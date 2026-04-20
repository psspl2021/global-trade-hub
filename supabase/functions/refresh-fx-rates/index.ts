/**
 * refresh-fx-rates
 * Fetches latest FX rates anchored to INR from the free exchangerate.host API
 * and upserts into public.fx_rates. Designed to be called by pg_cron daily.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.95.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPPORTED = ['USD','EUR','GBP','AED','SAR','QAR','KES','NGN','JPY','CNY','VND','SGD','AUD'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Source: open.er-api.com (no key required, INR base)
    const resp = await fetch('https://open.er-api.com/v6/latest/INR');
    if (!resp.ok) throw new Error(`FX API failed: ${resp.status}`);
    const data = await resp.json();
    const rates = data?.rates;
    if (!rates) throw new Error('No rates in response');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const rows = SUPPORTED
      .filter((code) => typeof rates[code] === 'number' && rates[code] > 0)
      .map((code) => {
        const rateFromInr = rates[code]; // 1 INR = X currency
        const rateToInr = 1 / rateFromInr;
        return {
          currency_code: code,
          rate_to_inr: rateToInr,
          rate_from_inr: rateFromInr,
          source: 'open.er-api.com',
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

    // Always include INR identity
    rows.push({
      currency_code: 'INR',
      rate_to_inr: 1,
      rate_from_inr: 1,
      source: 'identity',
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const { error } = await supabase
      .from('fx_rates')
      .upsert(rows, { onConflict: 'currency_code' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, updated: rows.length, rows }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err) {
    console.error('[refresh-fx-rates] error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
