import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auto-expire all active requirements where bidding_deadline_at has passed
    const { data, error } = await supabase
      .from('requirements')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('bidding_deadline_at', new Date().toISOString())
      .select('id, title');

    if (error) {
      console.error('Error expiring requirements:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiredCount = data?.length || 0;
    console.log(`Auto-expired ${expiredCount} requirements at ${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired_count: expiredCount,
        expired_ids: data?.map(r => r.id) || [],
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
