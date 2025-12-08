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

    // Insert the page visit with country data
    const { error } = await supabase.from('page_visits').insert({
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
    });

    if (error) {
      console.error('Error inserting page visit:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Page visit tracked successfully with country:', country, countryCode);

    return new Response(JSON.stringify({ success: true, country, countryCode }), {
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
