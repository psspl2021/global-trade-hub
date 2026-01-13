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

    const { action, ...params } = await req.json();

    // Public actions don't need auth
    if (action === 'get_page_by_slug' || action === 'track_view') {
      if (action === 'get_page_by_slug') {
        const { slug } = params;
        const { data, error } = await supabase
          .from('ai_sales_landing_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return new Response(JSON.stringify({ error: 'Page not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Increment view count
        await supabase
          .from('ai_sales_landing_pages')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);

        return new Response(JSON.stringify({ page: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'track_view') {
        const { page_id } = params;
        await supabase.rpc('increment_view_count', { page_id });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Admin-only actions
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

    switch (action) {
      case 'get_pages': {
        const { data, error } = await supabase
          .from('ai_sales_landing_pages')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ pages: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_page': {
        const { category, country } = params;
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        
        if (!lovableApiKey) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const slug = `buy-${category.toLowerCase().replace(/\s+/g, '-')}-in-${country.toLowerCase().replace(/\s+/g, '-')}`;

        const prompt = `Generate SEO-optimized landing page content for B2B buyers looking for ${category} from India.
Target Country: ${country}

Return JSON with:
{
  "headline": "Compelling H1 headline (under 60 chars)",
  "subheadline": "Supporting text explaining value proposition",
  "cta_text": "Action button text",
  "meta_title": "SEO title tag (under 60 chars)",
  "meta_description": "SEO meta description (under 160 chars)"
}

Focus on: verified suppliers, competitive pricing, quality assurance, quick quotes.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You are an SEO expert for B2B marketplaces. Return only valid JSON.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 400,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI generation failed');
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse AI response');
        }

        const generated = JSON.parse(jsonMatch[0]);

        return new Response(JSON.stringify({ 
          page: { ...generated, category, country, slug } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_page': {
        const { page } = params;
        const { data, error } = await supabase
          .from('ai_sales_landing_pages')
          .insert(page)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ page: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_page': {
        const { id, ...updates } = params;
        const { data, error } = await supabase
          .from('ai_sales_landing_pages')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ page: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'toggle_active': {
        const { id, is_active } = params;
        const { data, error } = await supabase
          .from('ai_sales_landing_pages')
          .update({ is_active })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ page: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete_page': {
        const { id } = params;
        const { error } = await supabase
          .from('ai_sales_landing_pages')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'track_conversion': {
        const { page_id, rfq_id } = params;
        
        // Update conversion count
        const { data: page } = await supabase
          .from('ai_sales_landing_pages')
          .select('conversion_count')
          .eq('id', page_id)
          .single();

        await supabase
          .from('ai_sales_landing_pages')
          .update({ conversion_count: (page?.conversion_count || 0) + 1 })
          .eq('id', page_id);

        // Create conversion record
        const { data, error } = await supabase
          .from('ai_sales_conversions')
          .insert({
            landing_page_id: page_id,
            rfq_id,
            conversion_type: 'landing_page',
            source_channel: 'landing'
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ conversion: data }), {
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
    console.error('AI Sales Landing Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
