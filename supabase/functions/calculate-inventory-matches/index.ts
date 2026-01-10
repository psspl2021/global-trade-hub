import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deterministic hash for consistent pseudo-values
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getDaysSinceUpdate = (dateStr: string): number => {
  if (!dateStr) return 30;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supplierId = user.id;

    // Check recalculation lock (prevent spam)
    const { data: existingMatch } = await supabase
      .from('supplier_inventory_matches')
      .select('recalculation_locked_until')
      .eq('supplier_id', supplierId)
      .limit(1)
      .single();

    if (existingMatch?.recalculation_locked_until) {
      const lockUntil = new Date(existingMatch.recalculation_locked_until);
      if (lockUntil > new Date()) {
        return new Response(JSON.stringify({ 
          error: "Recalculation is locked",
          locked_until: existingMatch.recalculation_locked_until,
          message: "Please wait before requesting another recalculation"
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch supplier profile for city
    const { data: supplierProfile } = await supabase
      .from('profiles')
      .select('city, state')
      .eq('id', supplierId)
      .single();

    const supplierCity = supplierProfile?.city?.toLowerCase() || '';

    // Fetch supplier's products with stock
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        stock_inventory (
          quantity,
          unit,
          low_stock_threshold,
          last_updated
        )
      `)
      .eq('supplier_id', supplierId)
      .eq('is_active', true);

    if (productsError) throw productsError;

    // Fetch active requirements for matching
    const { data: requirements, error: reqError } = await supabase
      .from('requirements')
      .select('id, title, product_category, quantity, delivery_location, deadline, buyer_id')
      .eq('status', 'active')
      .limit(100);

    if (reqError) throw reqError;

    // Fetch buyer locations for proximity calculation
    const buyerIds = [...new Set((requirements || []).map((r: any) => r.buyer_id))];
    const { data: buyerProfiles } = await supabase
      .from('profiles')
      .select('id, city, state')
      .in('id', buyerIds);

    const buyerCityMap: Record<string, string> = {};
    (buyerProfiles || []).forEach((p: any) => {
      if (p.city) buyerCityMap[p.id] = p.city.toLowerCase();
    });

    // Fetch existing match data for historical acceptance
    const { data: persistedMatches } = await supabase
      .from('supplier_inventory_matches')
      .select('product_id, historical_acceptance, is_boosted, boost_expires_at')
      .eq('supplier_id', supplierId);

    const persistedMatchMap: Record<string, any> = {};
    (persistedMatches || []).forEach((m: any) => {
      persistedMatchMap[m.product_id] = m;
    });

    // Calculate matches
    const matchesToPersist: any[] = [];
    const now = new Date();
    const recalculationLock = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute lock

    for (const product of (products || [])) {
      const stock = (product as any).stock_inventory;
      if (!stock || stock.quantity <= 0) continue;

      const matchingRfqs = (requirements || []).filter((r: any) => 
        r.product_category.toLowerCase().includes(product.category.toLowerCase()) ||
        product.category.toLowerCase().includes(r.product_category.toLowerCase())
      );

      // Calculate location proximity based on actual city match
      let locationProximity = 0.6;
      if (supplierCity && matchingRfqs.length > 0) {
        const matchingBuyerCities = matchingRfqs
          .map((r: any) => buyerCityMap[r.buyer_id] || '')
          .filter((city: string) => city);
        
        const sameCity = matchingBuyerCities.filter((city: string) => city === supplierCity).length;
        
        if (matchingBuyerCities.length > 0) {
          locationProximity = sameCity > 0 ? 1.0 : 0.75;
        }
      }

      // Use persisted historical acceptance or default
      const persisted = persistedMatchMap[product.id];
      const historicalAcceptance = persisted?.historical_acceptance || 0.6;

      // Calculate stock freshness
      const stockFreshness = Math.max(0, 1 - (getDaysSinceUpdate(stock.last_updated) / 30));

      // Calculate match score
      const exactSkuMatch = matchingRfqs.length > 0;
      const quantityAlignment = Math.min(1, matchingRfqs.reduce((acc: number, r: any) => 
        acc + (r.quantity <= stock.quantity ? 0.3 : 0.1), 0));

      const matchScore = Math.min(100, Math.max(0, (
        (exactSkuMatch ? 30 : 10) +
        (quantityAlignment * 25) +
        (locationProximity * 20) +
        (historicalAcceptance * 15) +
        (stockFreshness * 10)
      )));

      // Preserve boost status
      const isBoosted = persisted?.is_boosted && 
        persisted?.boost_expires_at && 
        new Date(persisted.boost_expires_at) > now;

      matchesToPersist.push({
        product_id: product.id,
        supplier_id: supplierId,
        match_score: matchScore,
        matching_rfq_count: matchingRfqs.length,
        location_proximity: locationProximity,
        historical_acceptance: historicalAcceptance,
        supplier_city: supplierCity || null,
        ai_version: 'inventory_match_v2',
        last_calculated_at: now.toISOString(),
        recalculation_locked_until: recalculationLock.toISOString(),
        // Don't overwrite boost fields - they're controlled separately
        ...(isBoosted ? {} : { is_boosted: false }),
      });
    }

    // Batch upsert all matches
    if (matchesToPersist.length > 0) {
      const { error: upsertError } = await supabase
        .from('supplier_inventory_matches')
        .upsert(matchesToPersist, {
          onConflict: 'supplier_id,product_id'
        });

      if (upsertError) throw upsertError;
    }

    return new Response(JSON.stringify({ 
      success: true,
      matches_calculated: matchesToPersist.length,
      locked_until: recalculationLock.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error calculating inventory matches:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
