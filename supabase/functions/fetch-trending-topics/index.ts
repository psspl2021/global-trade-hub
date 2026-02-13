import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch top demand signals from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: signals } = await supabase
      .from('demand_intelligence_signals')
      .select('category, country, subcategory, intent_score, classification, buyer_type, estimated_value, industry')
      .gte('created_at', thirtyDaysAgo)
      .gte('intent_score', 4)
      .order('intent_score', { ascending: false })
      .limit(50);

    // 2. Fetch recent RFQ categories for activity context
    const { data: recentRFQs } = await supabase
      .from('requirements')
      .select('product_category, destination, trade_type, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(30);

    // 3. Aggregate signal data
    const categoryHeat: Record<string, { count: number; avgIntent: number; countries: Set<string>; maxValue: number }> = {};

    for (const s of (signals || [])) {
      const cat = s.category || 'Unknown';
      if (!categoryHeat[cat]) categoryHeat[cat] = { count: 0, avgIntent: 0, countries: new Set(), maxValue: 0 };
      categoryHeat[cat].count++;
      categoryHeat[cat].avgIntent += (s.intent_score || 0);
      if (s.country) categoryHeat[cat].countries.add(s.country);
      if (s.estimated_value) categoryHeat[cat].maxValue = Math.max(categoryHeat[cat].maxValue, s.estimated_value);
    }

    // Finalize averages
    for (const cat of Object.keys(categoryHeat)) {
      categoryHeat[cat].avgIntent = Math.round(categoryHeat[cat].avgIntent / categoryHeat[cat].count * 10) / 10;
    }

    // RFQ activity summary
    const rfqCategories: Record<string, number> = {};
    for (const r of (recentRFQs || [])) {
      const cat = r.product_category || 'Unknown';
      rfqCategories[cat] = (rfqCategories[cat] || 0) + 1;
    }

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    // 4. Build context for AI to generate trending topics
    const signalSummary = Object.entries(categoryHeat)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([cat, data]) => `${cat}: ${data.count} signals, avg intent ${data.avgIntent}/10, countries: ${[...data.countries].join(', ')}${data.maxValue > 0 ? `, est. value up to $${(data.maxValue / 1000).toFixed(0)}K` : ''}`)
      .join('\n');

    const rfqSummary = Object.entries(rfqCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, count]) => `${cat}: ${count} RFQs`)
      .join('\n');

    const systemPrompt = `You are a B2B procurement market analyst for ProcureSaathi. Today is ${today}. 
You have access to REAL demand intelligence data from the platform showing what categories buyers are actively searching for and submitting RFQs in.
Generate blog topic suggestions that reflect CURRENT market conditions.`;

    const userPrompt = `Based on this REAL platform demand data from the last 30 days, suggest 8-10 trending blog topics.

DEMAND SIGNALS (categories with active buyer intent):
${signalSummary || 'No recent signals'}

RECENT RFQ ACTIVITY:
${rfqSummary || 'No recent RFQs'}

For each topic, provide:
1. A compelling blog title reflecting current ${currentYear} market conditions
2. The best category to select
3. Best country focus  
4. Trade type (Domestic/Import/Export)
5. Why it's trending (based on the data above)
6. Topic type: "price" (commodity price movements), "policy" (trade policy/regulation), or "hotspot" (supply-demand hotspot)

Focus on:
- Categories with HIGH intent scores (7+) = urgent buyer demand
- Categories with MULTI-COUNTRY signals = emerging global trend
- Categories with high RFQ volume = proven demand
- Seasonal/quarterly trends for ${currentYear}
- Recent trade policy changes (BIS, DGFT, customs duty updates)`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_trending_topics',
            description: 'Return trending blog topic suggestions based on market data',
            parameters: {
              type: 'object',
              properties: {
                topics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Compelling blog title with year' },
                      category: { type: 'string', description: 'Best matching category from: Steel & Metals, Chemicals & Solvents, Polymers & Plastics, Construction Materials, Textiles & Fabrics, Food & Agriculture, Pulses & Spices, Industrial Supplies, Packaging Materials, Minerals & Mining, Rubber Products, Auto Components, Electrical Equipment, Paper & Board' },
                      country: { type: 'string', description: 'Target country' },
                      trade_type: { type: 'string', enum: ['Domestic', 'Import', 'Export'] },
                      reason: { type: 'string', description: 'Why this topic is trending (1-2 sentences)' },
                      topic_type: { type: 'string', enum: ['price', 'policy', 'hotspot'] },
                      heat_score: { type: 'number', description: 'Trending score 1-10 based on signal strength' },
                    },
                    required: ['title', 'category', 'country', 'trade_type', 'reason', 'topic_type', 'heat_score'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['topics'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_trending_topics' } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('AI did not return structured topics');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      topics: result.topics,
      signal_count: signals?.length || 0,
      rfq_count: recentRFQs?.length || 0,
      generated_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('fetch-trending-topics error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
