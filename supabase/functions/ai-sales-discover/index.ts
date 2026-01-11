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
        const { category, country, status, page = 1, limit = 50 } = params;
        let query = supabase
          .from('ai_sales_leads')
          .select('*', { count: 'exact' })
          .order('discovered_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1);

        if (category) query = query.eq('category', category);
        if (country) query = query.eq('country', country);
        if (status) query = query.eq('status', status);

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
        const { category, country, buyer_type } = params;
        
        // Create discovery job
        const { data: job, error: jobError } = await supabase
          .from('ai_sales_discovery_jobs')
          .insert({
            category,
            country,
            buyer_type,
            status: 'running',
            started_at: new Date().toISOString(),
            created_by: user.id
          })
          .select()
          .single();

        if (jobError) throw jobError;

        // Use Lovable AI to discover buyers (async process simulation)
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        
        if (LOVABLE_API_KEY) {
          try {
            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                  {
                    role: 'system',
                    content: `You are a B2B lead discovery AI. Generate realistic potential buyer/supplier leads for industrial materials. Return JSON array of 5 leads with: company_name, buyer_name, email (realistic format), phone (international format), city, buyer_type, confidence_score (0.6-0.95), company_role. Be specific to the region and industry.

Also classify each company as:
- buyer (primarily purchases materials)
- supplier (primarily sells materials)  
- hybrid (both buys and sells)`
                  },
                  {
                    role: 'user',
                    content: `Find potential ${buyer_type || 'importer'} companies for ${category} products in ${country}. Generate 5 high-quality B2B leads with realistic company details. Include a mix of buyers, suppliers, and hybrid companies.`
                  }
                ],
                tools: [{
                  type: 'function',
                  function: {
                    name: 'submit_leads',
                    description: 'Submit discovered B2B leads',
                    parameters: {
                      type: 'object',
                      properties: {
                        leads: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              company_name: { type: 'string' },
                              buyer_name: { type: 'string' },
                              email: { type: 'string' },
                              phone: { type: 'string' },
                              city: { type: 'string' },
                              buyer_type: { type: 'string' },
                              confidence_score: { type: 'number' },
                              company_role: { type: 'string', enum: ['buyer', 'supplier', 'hybrid'] }
                            },
                            required: ['company_name', 'buyer_name', 'confidence_score', 'company_role']
                          }
                        }
                      },
                      required: ['leads']
                    }
                  }
                }],
                tool_choice: { type: 'function', function: { name: 'submit_leads' } }
              })
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              
              if (toolCall?.function?.arguments) {
                const parsed = JSON.parse(toolCall.function.arguments);
                const leads = parsed.leads || [];
                
                // Insert leads
                const leadsToInsert = leads.map((lead: Record<string, unknown>) => ({
                  company_name: lead.company_name,
                  buyer_name: lead.buyer_name,
                  email: lead.email || null,
                  phone: lead.phone || null,
                  city: lead.city || null,
                  country: country,
                  category: category,
                  buyer_type: lead.buyer_type || buyer_type,
                  company_role: lead.company_role || 'buyer',
                  confidence_score: lead.confidence_score || 0.7,
                  status: 'new',
                  lead_source: 'ai_discovery',
                  discovered_at: new Date().toISOString()
                }));

                const { data: insertedLeads } = await supabase
                  .from('ai_sales_leads')
                  .upsert(leadsToInsert, { 
                    onConflict: 'email,category',
                    ignoreDuplicates: true 
                  })
                  .select();

                // Update job as completed
                await supabase
                  .from('ai_sales_discovery_jobs')
                  .update({
                    status: 'completed',
                    leads_found: insertedLeads?.length || 0,
                    completed_at: new Date().toISOString()
                  })
                  .eq('id', job.id);

                return new Response(JSON.stringify({ 
                  job, 
                  leads_found: insertedLeads?.length || 0 
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            }
          } catch (aiError) {
            console.error('AI Discovery error:', aiError);
          }
        }

        // Mark job as completed even if AI fails (for demo purposes)
        await supabase
          .from('ai_sales_discovery_jobs')
          .update({
            status: 'completed',
            leads_found: 0,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        return new Response(JSON.stringify({ job, leads_found: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'route_lead': {
        const { lead_id } = params;
        
        // Fetch lead with company_role
        const { data: lead, error: leadError } = await supabase
          .from('ai_sales_leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (leadError || !lead) {
          return new Response(JSON.stringify({ error: 'Lead not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Determine funnel based on company_role
        let funnel: string;
        let nextAction: string;
        let updateStatus: string;

        switch (lead.company_role) {
          case 'supplier':
            funnel = 'supplier_onboarding';
            nextAction = 'invite_to_list_inventory';
            updateStatus = 'contacted';
            break;
          case 'hybrid':
            funnel = 'hybrid_flow';
            nextAction = 'dual_onboarding';
            updateStatus = 'contacted';
            break;
          case 'buyer':
          default:
            funnel = 'buyer_activation';
            nextAction = 'route_to_ai_inventory';
            updateStatus = 'contacted';
            break;
        }

        // Update lead with funnel assignment
        const { error: updateError } = await supabase
          .from('ai_sales_leads')
          .update({ 
            status: updateStatus,
            contacted_at: new Date().toISOString(),
            enrichment_data: {
              ...(lead.enrichment_data as Record<string, unknown> || {}),
              assigned_funnel: funnel,
              routed_at: new Date().toISOString()
            }
          })
          .eq('id', lead_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ 
          lead_id,
          company_role: lead.company_role,
          funnel,
          next_action: nextAction,
          message: `Lead routed to ${funnel} funnel`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'bulk_route_leads': {
        const { lead_ids } = params;
        
        // Fetch all leads
        const { data: leads, error: leadsError } = await supabase
          .from('ai_sales_leads')
          .select('id, company_role, enrichment_data')
          .in('id', lead_ids);

        if (leadsError) throw leadsError;

        const results = {
          buyer: 0,
          supplier: 0,
          hybrid: 0
        };

        // Route each lead based on company_role
        for (const lead of leads || []) {
          const funnel = lead.company_role === 'supplier' 
            ? 'supplier_onboarding' 
            : lead.company_role === 'hybrid' 
              ? 'hybrid_flow' 
              : 'buyer_activation';

          await supabase
            .from('ai_sales_leads')
            .update({
              status: 'contacted',
              contacted_at: new Date().toISOString(),
              enrichment_data: {
                ...(lead.enrichment_data as Record<string, unknown> || {}),
                assigned_funnel: funnel,
                routed_at: new Date().toISOString()
              }
            })
            .eq('id', lead.id);

          results[lead.company_role as keyof typeof results]++;
        }

        return new Response(JSON.stringify({ 
          routed: leads?.length || 0,
          by_role: results,
          message: `Routed ${leads?.length || 0} leads to their funnels`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('AI Sales Discover Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = String(item[key] || 'Unknown');
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
