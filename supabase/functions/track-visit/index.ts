import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (100 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (limit && now < limit.resetTime) {
    if (limit.count >= 100) return false;
    limit.count++;
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
  }
  
  // Clean up old entries periodically (every 1000 requests)
  if (rateLimitMap.size > 1000) {
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((value, key) => {
      if (now >= value.resetTime) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => rateLimitMap.delete(key));
  }
  
  return true;
}

// Anonymize IP address by truncating last octet (IPv4) for privacy
function anonymizeIP(ip: string): string {
  if (ip.includes('.')) {
    // IPv4: Replace last octet with 0
    return ip.split('.').slice(0, 3).join('.') + '.0';
  }
  // Return as-is for IPv6 or unknown formats
  return ip;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from request headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      console.warn('Rate limit exceeded for IP:', anonymizeIP(clientIP));
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    console.log('Tracking visit from IP:', anonymizeIP(clientIP));

    // Get country from IP — multi-provider fallback chain so it almost never fails.
    // Order: Cloudflare header (instant, free) → ip-api → ipapi.co → ipwho.is → geojs.io → country.is
    let country: string | null = null;
    let countryCode: string | null = null;

    // 0) Cloudflare edge header (zero network call, when proxied via CF)
    const cfCountry = req.headers.get('cf-ipcountry');
    if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
      countryCode = cfCountry.toUpperCase();
      // We'll still try to enrich the country name below if missing
    }

    const isPublicIP =
      clientIP &&
      clientIP !== 'unknown' &&
      clientIP !== '127.0.0.1' &&
      clientIP !== '::1' &&
      !clientIP.startsWith('10.') &&
      !clientIP.startsWith('192.168.') &&
      !clientIP.startsWith('172.');

    if (isPublicIP && !country) {
      const providers: Array<{ name: string; url: string; parse: (d: any) => { country?: string; code?: string } }> = [
        {
          name: 'ip-api',
          url: `https://ip-api.com/json/${clientIP}?fields=status,country,countryCode`,
          parse: (d) => d?.status === 'success' ? { country: d.country, code: d.countryCode } : {},
        },
        {
          name: 'ipapi.co',
          url: `https://ipapi.co/${clientIP}/json/`,
          parse: (d) => d?.country_name ? { country: d.country_name, code: d.country_code } : {},
        },
        {
          name: 'ipwho.is',
          url: `https://ipwho.is/${clientIP}`,
          parse: (d) => d?.success ? { country: d.country, code: d.country_code } : {},
        },
        {
          name: 'geojs.io',
          url: `https://get.geojs.io/v1/ip/country/${clientIP}.json`,
          parse: (d) => d?.country ? { country: d.name || d.country, code: d.country } : {},
        },
        {
          name: 'country.is',
          url: `https://api.country.is/${clientIP}`,
          parse: (d) => d?.country ? { country: d.country, code: d.country } : {},
        },
      ];

      for (const provider of providers) {
        try {
          const resp = await fetch(provider.url, { signal: AbortSignal.timeout(2500) });
          if (!resp.ok) {
            console.warn(`Geo provider ${provider.name} returned ${resp.status}`);
            continue;
          }
          const data = await resp.json();
          const parsed = provider.parse(data);
          if (parsed.country || parsed.code) {
            country = parsed.country ?? country;
            countryCode = parsed.code ?? countryCode;
            console.log(`Geo lookup success via ${provider.name}:`, country, countryCode);
            break;
          }
        } catch (err) {
          console.warn(`Geo provider ${provider.name} failed:`, err instanceof Error ? err.message : err);
        }
      }
    }

    // Insert the page visit with country data and SEM tracking
    // Store anonymized IP for privacy compliance
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
