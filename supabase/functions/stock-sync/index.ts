import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface StockItem {
  product_name?: string;
  sku?: string;
  quantity: number;
  unit?: string;
}

interface SyncRequest {
  source: string;
  items: StockItem[];
}

// Simple hash function for API key validation
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Include x-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('sk_live_') || apiKey.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: SyncRequest = await req.json();

    // Input validation
    if (!body.source || typeof body.source !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid source field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.source.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Source field too long (max 50 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Items array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.items.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Too many items. Maximum 500 items per request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.product_name && !item.sku) {
        return new Response(
          JSON.stringify({ error: 'Each item must have product_name or sku' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (item.product_name && item.product_name.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Product name too long (max 200 chars)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof item.quantity !== 'number' || item.quantity < 0 || item.quantity > 10000000) {
        return new Response(
          JSON.stringify({ error: 'Invalid quantity. Must be between 0 and 10,000,000' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Hash API key and look up in database
    const keyHash = await hashApiKey(apiKey);
    
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('supplier_api_keys')
      .select('id, supplier_id, is_active, revoked_at')
      .eq('api_key_hash', keyHash)
      .eq('is_active', true)
      .is('revoked_at', null)
      .maybeSingle();

    if (keyError || !apiKeyRecord) {
      console.log('API key lookup failed:', keyError?.message || 'Key not found');
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supplierId = apiKeyRecord.supplier_id;
    const apiKeyId = apiKeyRecord.id;

    // Update last_used_at
    await supabase
      .from('supplier_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyId);

    // Get supplier's products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('supplier_id', supplierId);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create name-to-id mapping (case-insensitive)
    const productMap = new Map<string, string>();
    for (const p of products || []) {
      productMap.set(p.name.toLowerCase().trim(), p.id);
    }

    let productsUpdated = 0;
    let productsCreated = 0;
    let errors = 0;
    const errorDetails: Array<{ item: string; error: string }> = [];

    // Process each item
    for (const item of body.items) {
      const itemName = (item.product_name || item.sku || '').trim();
      const productId = productMap.get(itemName.toLowerCase());

      if (!productId) {
        errors++;
        errorDetails.push({ item: itemName, error: 'Product not found' });
        continue;
      }

      // Check if stock record exists
      const { data: existingStock } = await supabase
        .from('stock_inventory')
        .select('id, quantity')
        .eq('product_id', productId)
        .maybeSingle();

      if (existingStock) {
        // Update existing stock
        const { error: updateError } = await supabase
          .from('stock_inventory')
          .update({ 
            quantity: item.quantity,
            unit: item.unit || 'units',
            last_updated: new Date().toISOString()
          })
          .eq('product_id', productId);

        if (updateError) {
          errors++;
          errorDetails.push({ item: itemName, error: updateError.message });
        } else {
          // Log stock update
          await supabase.from('stock_updates').insert({
            product_id: productId,
            previous_quantity: existingStock.quantity,
            new_quantity: item.quantity,
            change_reason: `API sync from ${body.source}`,
            updated_by: supplierId
          });
          productsUpdated++;
        }
      } else {
        // Create new stock record
        const { error: insertError } = await supabase
          .from('stock_inventory')
          .insert({
            product_id: productId,
            quantity: item.quantity,
            unit: item.unit || 'units'
          });

        if (insertError) {
          errors++;
          errorDetails.push({ item: itemName, error: insertError.message });
        } else {
          productsCreated++;
        }
      }
    }

    // Determine sync status
    let status = 'success';
    if (errors > 0 && (productsUpdated + productsCreated) > 0) {
      status = 'partial';
    } else if (errors > 0 && (productsUpdated + productsCreated) === 0) {
      status = 'failed';
    }

    // Log sync attempt
    await supabase.from('stock_sync_logs').insert({
      supplier_id: supplierId,
      api_key_id: apiKeyId,
      source: body.source,
      products_updated: productsUpdated,
      products_created: productsCreated,
      errors: errors,
      status: status,
      error_details: errorDetails.length > 0 ? errorDetails : null
    });

    return new Response(
      JSON.stringify({
        success: true,
        status: status,
        summary: {
          products_updated: productsUpdated,
          products_created: productsCreated,
          errors: errors
        },
        error_details: errorDetails.length > 0 ? errorDetails : undefined
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stock sync error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
