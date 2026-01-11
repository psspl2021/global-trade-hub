import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        const { category, country, status, industry, company_role, page = 1, limit = 50 } = params;
        let query = supabase
          .from('ai_sales_leads')
          .select('*', { count: 'exact' })
          .order('discovered_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        // ✅ Normalize filters to lowercase for consistent matching
        if (category) query = query.eq('category', category.toLowerCase());
        if (country) query = query.eq('country', country.toLowerCase());
        if (status) query = query.eq('status', status);
        if (industry) query = query.ilike('industry_segment', `%${industry.toLowerCase()}%`);
        if (company_role) query = query.eq('company_role', company_role.toLowerCase());

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
          country,
          buyer_type,
          company_role = 'buyer',
          industry_segments
        } = params;

        // ✅ NORMALIZATION (CRITICAL)
        const normalizedCategory = String(category || '').toLowerCase();
        const normalizedCountry = String(country || '').toLowerCase();
        const normalizedRole = String(company_role || 'buyer').toLowerCase();

        console.log('RUN DISCOVERY:', {
          category: normalizedCategory,
          country: normalizedCountry,
          role: normalizedRole
        });

        // ✅ Guard against empty category/country
        if (!normalizedCategory || !normalizedCountry) {
          return new Response(
            JSON.stringify({ error: 'Category and country are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 1️⃣ Create discovery job
        const { data: job, error: jobError } = await supabase
          .from('ai_sales_discovery_jobs')
          .insert({
            category: normalizedCategory,
            country: normalizedCountry,
            buyer_type,
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
          const defaultIndustries = [
            'construction & infrastructure',
            'fabrication & structural steel',
            'machinery manufacturing',
            'heavy engineering',
            'automotive manufacturing',
            'aerospace & defense'
          ];

          const targetIndustries =
            Array.isArray(industry_segments) && industry_segments.length > 0
              ? industry_segments.map((i: string) => i.toLowerCase())
              : defaultIndustries;

          // 🧠 PROMPT (NO FUNCTION CALLS – STABLE)
          const prompt = `
You are a B2B industrial demand discovery AI.

ONLY return REAL bulk-consuming companies.
NO traders, brokers, or generic sellers.

Product: ${normalizedCategory}
Country: ${normalizedCountry}
Company role focus: ${normalizedRole}

Target industries:
${targetIndustries.map(i => `- ${i}`).join('\n')}

Return JSON ONLY in this format:
{
  "leads": [
    {
      "company_name": "",
      "buyer_name": "",
      "email": "",
      "phone": "",
      "city": "",
      "industry_segment": "",
      "buyer_type": "",
      "confidence_score": 0.7,
      "company_role": "buyer"
    }
  ]
}

Rules:
- industry_segment MUST be lowercase
- confidence_score between 0.65 and 0.95
- company_role = buyer | supplier | hybrid
- Companies must consume product in BULK
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

          const leadsToInsert = leads.map((lead: any) => ({
            company_name: lead.company_name,
            buyer_name: lead.buyer_name,
            email: lead.email || null,
            phone: lead.phone || null,
            city: lead.city || null,
            country: normalizedCountry,
            category: normalizedCategory,
            industry_segment: String(lead.industry_segment || '').toLowerCase(),
            buyer_type: lead.buyer_type || buyer_type,
            company_role: lead.company_role || normalizedRole,
            confidence_score: lead.confidence_score || 0.7,
            status: 'new',
            lead_source: 'ai_discovery',
            discovered_at: new Date().toISOString()
          }));

          console.log('Inserting leads:', leadsToInsert.length);

          // Use insert instead of upsert to avoid constraint issues with null emails
          const { data: inserted, error: insertError } = await supabase
            .from('ai_sales_leads')
            .insert(leadsToInsert)
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
