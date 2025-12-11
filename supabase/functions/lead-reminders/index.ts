import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get leads with follow-up dates today or overdue
    const today = new Date().toISOString().split('T')[0];
    
    const { data: leads, error: leadsError } = await supabase
      .from('supplier_leads')
      .select('id, name, company_name, supplier_id, next_follow_up, status')
      .lte('next_follow_up', today)
      .not('status', 'in', '("won","lost")')
      .not('next_follow_up', 'is', null);

    if (leadsError) {
      throw leadsError;
    }

    const notifications = [];
    
    for (const lead of leads || []) {
      const isOverdue = lead.next_follow_up < today;
      const title = isOverdue ? 'Overdue Follow-up' : 'Follow-up Reminder';
      const message = isOverdue 
        ? `Follow-up for ${lead.name}${lead.company_name ? ` (${lead.company_name})` : ''} was due on ${lead.next_follow_up}`
        : `Follow-up scheduled today for ${lead.name}${lead.company_name ? ` (${lead.company_name})` : ''}`;

      // Check if notification already exists for this lead today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', lead.supplier_id)
        .eq('type', 'lead_followup')
        .gte('created_at', today)
        .contains('metadata', { lead_id: lead.id })
        .single();

      if (!existing) {
        notifications.push({
          user_id: lead.supplier_id,
          type: 'lead_followup',
          title,
          message,
          metadata: { 
            lead_id: lead.id, 
            lead_name: lead.name,
            follow_up_date: lead.next_follow_up,
            is_overdue: isOverdue
          }
        });
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminders_sent: notifications.length,
        leads_checked: leads?.length || 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error processing lead reminders:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
