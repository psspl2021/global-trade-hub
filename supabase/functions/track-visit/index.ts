import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // Handle time spent update
    if (body.update_time_spent) {
      const { visitor_id, session_id, page_path, time_spent_seconds } = body;
      
      // Find the most recent visit for this visitor/session/page and update time spent
      const { error } = await supabase
        .from('page_visits')
        .update({ time_spent_seconds })
        .eq('visitor_id', visitor_id)
        .eq('session_id', session_id)
        .eq('page_path', page_path)
        .is('time_spent_seconds', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error updating time spent:', error);
      } else {
        console.log('Time spent updated:', time_spent_seconds, 'seconds for', page_path);
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      visitor_id,
      session_id,
      page_path,
      referrer,
      source,
      device_type,
      browser,
      user_agent,
      screen_width,
      screen_height,
      // SEM tracking fields
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      gclid,
    } = body;

    // Get client IP from request headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    console.log('Tracking visit from IP:', clientIP);

    // Get country from IP using free geolocation API
    let country = null;
    let countryCode = null;

    if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1' && clientIP !== '::1') {
      try {
        // Using ip-api.com (free, no API key needed, 45 requests/minute limit)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,countryCode`);
        const geoData = await geoResponse.json();
        
        console.log('Geo lookup result:', geoData);

        if (geoData.status === 'success') {
          country = geoData.country;
          countryCode = geoData.countryCode;
        }
      } catch (geoError) {
        console.error('Geolocation lookup failed:', geoError);
        // Continue without country data
      }
    }

    // Insert the page visit with country data and SEM tracking
    const { data, error } = await supabase.from('page_visits').insert({
      visitor_id,
      session_id,
      page_path,
      referrer: referrer || null,
      source,
      device_type,
      browser,
      user_agent,
      screen_width,
      screen_height,
      country,
      country_code: countryCode,
      // SEM tracking fields
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      gclid: gclid || null,
    }).select('id').single();

    if (error) {
      console.error('Error inserting page visit:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Page visit tracked successfully with country:', country, countryCode);

    return new Response(JSON.stringify({ success: true, country, countryCode, visit_id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-visit function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
