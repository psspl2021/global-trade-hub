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
      case 'get_messages': {
        const { category, country, channel } = params;
        let query = supabase
          .from('ai_sales_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (category) query = query.eq('category', category);
        if (country) query = query.eq('country', country);
        if (channel) query = query.eq('channel', channel);

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ messages: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_message': {
        const { category, country, channel, tone = 'professional' } = params;
        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        
        if (!lovableApiKey) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const prompt = `Generate a ${tone} B2B outreach ${channel} message for a procurement platform.
Target: ${category} buyers in ${country}
Platform: ProcureSaathi - India's B2B procurement marketplace

${channel === 'email' ? 'Include subject line and body.' : ''}
${channel === 'whatsapp' ? 'Keep it short and conversational (under 160 words).' : ''}
${channel === 'landing' ? 'Create headline, subheadline, and CTA text for a landing page.' : ''}

Focus on:
- Verified suppliers from India
- Competitive pricing
- Quick quote turnaround
- Quality assurance

Return JSON with: ${channel === 'email' ? '{ subject, message_body }' : channel === 'landing' ? '{ headline, subheadline, cta_text }' : '{ message_body }'}`;

        const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a B2B marketing expert. Return only valid JSON.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI generation failed');
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse AI response');
        }

        const generated = JSON.parse(jsonMatch[0]);

        return new Response(JSON.stringify({ generated, category, country, channel, tone }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'save_message': {
        const { message } = params;
        const { data, error } = await supabase
          .from('ai_sales_messages')
          .insert(message)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ message: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_message': {
        const { id, ...updates } = params;
        const { data, error } = await supabase
          .from('ai_sales_messages')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ message: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete_message': {
        const { id } = params;
        const { error } = await supabase
          .from('ai_sales_messages')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
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
    console.error('AI Sales Messaging Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
