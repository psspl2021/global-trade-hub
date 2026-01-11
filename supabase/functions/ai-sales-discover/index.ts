import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ✅ Generate deterministic fingerprint to prevent duplicates
// Now includes subcategory + industry for precise deduplication
async function generateFingerprint(lead: {
  company_name: string;
  subcategory?: string;
  industry_segment?: string;
  city?: string;
  country: string;
}): Promise<string> {
  // Fingerprint = company + subcategory + industry + city + country
  const raw = `${lead.company_name}|${lead.subcategory || ''}|${lead.industry_segment || ''}|${lead.city || ''}|${lead.country}`
    .toLowerCase()
    .trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'get_metrics': {
        const { data: metrics } = await supabase
          .from('ai_sales_leads')
          .select('category, country, status, confidence_score, discovered_at');
        
        const { data: landingPages } = await supabase
          .from('ai_sales_landing_pages')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: conversions } = await supabase
          .from('ai_sales_conversions')
          .select('*, ai_sales_leads(company_name, category, country)')
          .order('converted_at', { ascending: false })
          .limit(20);

        // Aggregate metrics
        const aggregated = {
          total_leads: metrics?.length || 0,
          new_leads: metrics?.filter(m => m.status === 'new').length || 0,
          contacted: metrics?.filter(m => m.status === 'contacted').length || 0,
          rfqs_created: metrics?.filter(m => m.status === 'rfq_created').length || 0,
          deals_closed: metrics?.filter(m => m.status === 'closed').length || 0,
          avg_confidence: metrics?.length 
            ? (metrics.reduce((sum, m) => sum + (m.confidence_score || 0), 0) / metrics.length).toFixed(2) 
            : 0,
          by_category: groupBy(metrics || [], 'category'),
          by_country: groupBy(metrics || [], 'country'),
        };

        return new Response(JSON.stringify({ 
          metrics: aggregated, 
          landingPages, 
          conversions 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_leads': {
        const { category, subcategory, country, status, industry, company_role, search, page = 1, limit = 50 } = params;
        let query = supabase
          .from('ai_sales_leads')
          .select('*', { count: 'exact' })
          .order('discovered_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        // ✅ Normalize filters to lowercase for consistent matching
        if (category) query = query.eq('category', category.toLowerCase());
        if (subcategory) query = query.eq('subcategory', subcategory.toLowerCase());
        if (country) query = query.eq('country', country.toLowerCase());
        if (status) query = query.eq('status', status);
        if (industry) query = query.eq('industry_segment', industry.toLowerCase());
        if (company_role) query = query.eq('company_role', company_role.toLowerCase());
        
        // ✅ Backend search across multiple fields (now includes subcategory)
        if (search) {
          query = query.or(
            `company_name.ilike.%${search}%,buyer_name.ilike.%${search}%,email.ilike.%${search}%,industry_segment.ilike.%${search}%,subcategory.ilike.%${search}%`
          );
        }

        const { data, count } = await query;
        return new Response(JSON.stringify({ leads: data, total: count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_lead': {
        const { data, error } = await supabase
          .from('ai_sales_leads')
          .insert(params.lead)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ lead: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_lead': {
        const { id, ...updates } = params;
        const { data, error } = await supabase
          .from('ai_sales_leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ lead: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'bulk_update_status': {
        const { ids, status } = params;
        const updates: Record<string, unknown> = { status };
        if (status === 'contacted') {
          updates.contacted_at = new Date().toISOString();
        }

        const { data, error } = await supabase
          .from('ai_sales_leads')
          .update(updates)
          .in('id', ids)
          .select();

        if (error) throw error;
        return new Response(JSON.stringify({ updated: data?.length || 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'convert_to_rfq': {
        const { lead_id, rfq_id, conversion_type } = params;
        
        // Update lead status
        await supabase
          .from('ai_sales_leads')
          .update({ status: 'rfq_created' })
          .eq('id', lead_id);

        // Create conversion record
        const { data, error } = await supabase
          .from('ai_sales_conversions')
          .insert({
            lead_id,
            rfq_id,
            conversion_type,
            source_channel: 'admin'
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ conversion: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'run_discovery': {
        const {
          category,
          subcategory,
          country,
          buyer_type,
          company_role = 'buyer',
          industry_segments
        } = params;

        // ✅ NORMALIZATION (CRITICAL)
        const normalizedCategory = String(category || '').toLowerCase();
        const normalizedSubcategory = String(subcategory || '').toLowerCase();
        const normalizedCountry = String(country || '').toLowerCase();
        const normalizedRole = String(company_role || 'buyer').toLowerCase();
        const normalizedBuyerTypes = Array.isArray(buyer_type) 
          ? buyer_type.map((bt: string) => bt.toLowerCase())
          : buyer_type ? [buyer_type.toLowerCase()] : ['manufacturer'];

        console.log('RUN DISCOVERY:', {
          category: normalizedCategory,
          subcategory: normalizedSubcategory,
          country: normalizedCountry,
          role: normalizedRole,
          buyer_types: normalizedBuyerTypes,
          industries: industry_segments
        });

        // ✅ Guard against empty required fields
        if (!normalizedCategory || !normalizedCountry) {
          return new Response(
            JSON.stringify({ error: 'Category and country are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // ✅ Subcategory is now STRONGLY RECOMMENDED for precision
        if (!normalizedSubcategory) {
          console.warn('⚠️ No subcategory provided - discovery will be less precise');
        }

        // 1️⃣ Create discovery job
        const { data: job, error: jobError } = await supabase
          .from('ai_sales_discovery_jobs')
          .insert({
            category: normalizedCategory,
            country: normalizedCountry,
            buyer_type: normalizedBuyerTypes.join(','),
            status: 'running',
            started_at: new Date().toISOString(),
            created_by: user.id
          })
          .select()
          .single();

        if (jobError || !job) {
          throw new Error('Failed to create discovery job');
        }

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          await supabase
            .from('ai_sales_discovery_jobs')
            .update({
              status: 'failed',
              error_message: 'LOVABLE_API_KEY missing',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          return new Response(
            JSON.stringify({ error: 'AI key not configured' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          // ✅ Use provided industries or require subcategory-based industries
          const targetIndustries =
            Array.isArray(industry_segments) && industry_segments.length > 0
              ? industry_segments.map((i: string) => i.toLowerCase())
              : [];

          if (targetIndustries.length === 0) {
            console.warn('⚠️ No target industries provided - AI will choose based on subcategory');
          }

          // 🧠 DYNAMIC PROMPT BASED ON COMPANY ROLE + SUBCATEGORY
          const productDescription = normalizedSubcategory 
            ? `${normalizedSubcategory} (under ${normalizedCategory})`
            : normalizedCategory;

          // ✅ EXPLICIT ROLE INSTRUCTIONS - Critical for supplier discovery quality
          const roleInstructions = normalizedRole === 'supplier'
            ? `
You are discovering SUPPLIERS.

ONLY return companies that:
- MANUFACTURE, STOCK, or EXPORT this product: ${productDescription}
- Have production capacity or inventory
- Act as OEMs, stockists, mills, factories, or exporters

DO NOT return end consumers.
DO NOT return companies that only BUY this product.
`
            : normalizedRole === 'hybrid'
            ? `
You are discovering HYBRID companies.

ONLY return companies that BOTH BUY and SELL ${productDescription} in bulk.
These could be manufacturers who also source raw materials, or large traders who act as both buyer and seller.
`
            : `
You are discovering BUYERS.

ONLY return companies that:
- CONSUME this product in BULK: ${productDescription}
- Use it in manufacturing, EPC, fabrication, or projects
- Have recurring procurement demand

DO NOT return traders unless they consume the product.
DO NOT return suppliers, mills, or manufacturers who SELL this product.
`;

          const buyerTypeFilter = normalizedBuyerTypes.length > 0
            ? `\n\nTarget buyer types: ${normalizedBuyerTypes.join(', ')}
EXCLUDE these types: ${normalizedBuyerTypes.includes('trader') ? '' : 'traders, '}stockists, brokers, agents`
            : '';

          const industryFilter = targetIndustries.length > 0
            ? `\n\nTarget industries:\n${targetIndustries.map(i => `- ${i}`).join('\n')}`
            : '';

          const prompt = `
You are a B2B industrial ${normalizedRole === 'supplier' ? 'supplier' : 'demand'} discovery AI.

ONLY return REAL companies that match the criteria below.
NO fake data, NO placeholder emails, NO generic company names.

Product Category: ${normalizedCategory}
Product Subcategory: ${normalizedSubcategory || 'not specified'}
Country: ${normalizedCountry}
Company role: ${normalizedRole}

${roleInstructions}
${buyerTypeFilter}
${industryFilter}

Return JSON ONLY in this format:
{
  "leads": [
    {
      "company_name": "Actual Company Name",
      "buyer_name": "Contact Person Name (if known)",
      "email": "actual@email.com (leave empty if unknown)",
      "phone": "+1234567890 (leave empty if unknown)",
      "city": "City Name",
      "industry_segment": "specific industry this company operates in",
      "buyer_type": "manufacturer|importer|distributor|trader|epc|contractor",
      "confidence_score": 0.7,
      "company_role": "${normalizedRole}"
    }
  ]
}

Rules:
- industry_segment MUST be lowercase and specific to what this company does
- confidence_score between 0.65 and 0.95 based on how well the company matches
- company_role MUST be "${normalizedRole}"
- buyer_type MUST match one of: ${normalizedBuyerTypes.join(', ')}
- ONLY include companies that are verifiable and real
- Return 5-10 high-quality leads maximum
- Focus on companies that specifically use/produce ${productDescription}
`;

          const aiResponse = await fetch(
            'https://ai.gateway.lovable.dev/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [{ role: 'user', content: prompt }]
              })
            }
          );

          if (!aiResponse.ok) {
            throw new Error(await aiResponse.text());
          }

          const aiData = await aiResponse.json();
          console.log('AI Response received');
          
          const content = aiData.choices?.[0]?.message?.content;
          if (!content) {
            console.error('Empty AI content:', JSON.stringify(aiData));
            throw new Error('Empty AI response');
          }

          console.log('AI Content length:', content.length);

          // Extract JSON from response (handle markdown code blocks)
          let jsonContent = content;
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1].trim();
          }

          let parsed;
          try {
            parsed = JSON.parse(jsonContent);
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr, 'Content:', jsonContent.substring(0, 500));
            throw new Error('Failed to parse AI response as JSON');
          }

          const leads = parsed.leads || [];
          console.log('Leads parsed:', leads.length);

          if (leads.length === 0) {
            await supabase
              .from('ai_sales_discovery_jobs')
              .update({
                status: 'completed',
                leads_found: 0,
                completed_at: new Date().toISOString()
              })
              .eq('id', job.id);

            return new Response(
              JSON.stringify({
                leads_found: 0,
                industries: targetIndustries,
                message: 'No leads found by AI'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // ✅ Generate fingerprints for each lead to prevent duplicates
          // Now includes subcategory + industry for precise deduplication
          const leadsToInsert = await Promise.all(leads.map(async (lead: any) => {
            const industrySegment = String(lead.industry_segment || '').toLowerCase();
            const leadData = {
              company_name: lead.company_name,
              subcategory: normalizedSubcategory || undefined,
              industry_segment: industrySegment || undefined,
              city: lead.city || undefined,
              country: normalizedCountry,
            };
            const fingerprint = await generateFingerprint(leadData);
            
            return {
              company_name: lead.company_name,
              buyer_name: lead.buyer_name,
              email: lead.email || null,
              phone: lead.phone || null,
              city: lead.city || null,
              country: normalizedCountry,
              category: normalizedCategory,
              subcategory: normalizedSubcategory || null, // ✅ NEW: Subcategory
              industry_segment: industrySegment,
              buyer_type: lead.buyer_type || normalizedBuyerTypes[0],
              company_role: lead.company_role || normalizedRole,
              confidence_score: lead.confidence_score || 0.7,
              status: 'new',
              lead_source: 'ai_discovery',
              discovered_at: new Date().toISOString(),
              lead_fingerprint: fingerprint, // ✅ Unique fingerprint (now subcategory-aware)
            };
          }));

          console.log('Inserting leads with fingerprints:', leadsToInsert.length);

          // ✅ Use upsert with fingerprint to prevent duplicates
          const { data: inserted, error: insertError } = await supabase
            .from('ai_sales_leads')
            .upsert(leadsToInsert, {
              onConflict: 'lead_fingerprint',
              ignoreDuplicates: true
            })
            .select();

          if (insertError) {
            console.error('Insert error:', insertError);
            // Try inserting one by one to get as many as possible
            let successCount = 0;
            for (const lead of leadsToInsert) {
              const { error: singleErr } = await supabase
                .from('ai_sales_leads')
                .insert(lead);
              if (!singleErr) successCount++;
            }
            console.log('Fallback insert succeeded:', successCount);
            
            await supabase
              .from('ai_sales_discovery_jobs')
              .update({
                status: 'completed',
                leads_found: successCount,
                completed_at: new Date().toISOString()
              })
              .eq('id', job.id);

            return new Response(
              JSON.stringify({
                leads_found: successCount,
                industries: targetIndustries
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log('Leads inserted successfully:', inserted?.length);

          await supabase
            .from('ai_sales_discovery_jobs')
            .update({
              status: 'completed',
              leads_found: inserted?.length || 0,
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          return new Response(
            JSON.stringify({
              leads_found: inserted?.length || 0,
              industries: targetIndustries
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error('AI DISCOVERY ERROR:', err);

          await supabase
            .from('ai_sales_discovery_jobs')
            .update({
              status: 'failed',
              error_message: String(err),
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          return new Response(
            JSON.stringify({ error: 'AI discovery failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function groupBy(arr: any[], key: string) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}
