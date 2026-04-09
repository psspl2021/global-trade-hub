import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AngleOption = { angle: string; focus: string };
type StructureOption = { name: string; instruction: string };
type TopicStrategy = {
  pattern: 'commodity' | 'cost' | 'comparison' | 'supplier' | 'risk' | 'transformation' | 'generic';
  anchorKeyword: string;
  introInstruction: string;
  titleDirection: string;
  anglePreference: string[];
  preferredStructures: string[];
  detailBrief: string;
  antiDrift: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const category = body.category;
    const country = body.country || 'India';
    const trade_type = body.trade_type || 'Domestic';
    const custom_topic = body.custom_topic || '';
    const trending_context = body.trending_context || '';

    console.log('generate-blog called with:', { category, country, trade_type, custom_topic, has_trending: !!trending_context });

    if (!category) {
      return new Response(JSON.stringify({ error: 'Category is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const today = new Date().toISOString().split('T')[0];

    // === LIVE MARKET RESEARCH: Pull real demand signals for this category ===
    let marketResearchContext = '';
    let demandHotspots: string[] = [];
    let topSubcategories: string[] = [];
    let buyerTypes: string[] = [];
    let industrySegments: string[] = [];
    
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: catSignals } = await supabase
        .from('demand_intelligence_signals')
        .select('country, intent_score, classification, buyer_type, estimated_value, subcategory, industry')
        .ilike('category', `%${category.split('&')[0].trim()}%`)
        .gte('created_at', thirtyDaysAgo)
        .order('intent_score', { ascending: false })
        .limit(30);

      const { data: catRFQs } = await supabase
        .from('requirements')
        .select('destination, trade_type, product_category, created_at, quantity, unit')
        .ilike('product_category', `%${category.split('&')[0].trim()}%`)
        .gte('created_at', thirtyDaysAgo)
        .limit(25);

      // Get price benchmarks if available
      const { data: priceBenchmarks } = await supabase
        .from('category_price_benchmarks')
        .select('subcategory, benchmark_price, unit, currency, region')
        .ilike('category', `%${category.split('&')[0].trim()}%`)
        .limit(10);

      if ((catSignals && catSignals.length > 0) || (catRFQs && catRFQs.length > 0)) {
        const signalCountries = [...new Set((catSignals || []).map(s => s.country).filter(Boolean))];
        demandHotspots = signalCountries.slice(0, 5);
        topSubcategories = [...new Set((catSignals || []).map(s => s.subcategory).filter(Boolean))].slice(0, 6);
        buyerTypes = [...new Set((catSignals || []).map(s => s.buyer_type).filter(Boolean))].slice(0, 4);
        industrySegments = [...new Set((catSignals || []).map(s => s.industry).filter(Boolean))].slice(0, 5);
        
        const avgIntent = catSignals?.length
          ? (catSignals.reduce((sum, s) => sum + (s.intent_score || 0), 0) / catSignals.length).toFixed(1)
          : 'N/A';
        const maxValue = catSignals?.reduce((max, s) => Math.max(max, s.estimated_value || 0), 0) || 0;
        const rfqCount = catRFQs?.length || 0;
        const classifications = [...new Set((catSignals || []).map(s => s.classification).filter(Boolean))];
        
        // RFQ volume trends
        const rfqDestinations = [...new Set((catRFQs || []).map(r => r.destination).filter(Boolean))].slice(0, 5);
        const rfqTradeTypes = [...new Set((catRFQs || []).map(r => r.trade_type).filter(Boolean))];

        // Price benchmark context
        let priceContext = '';
        if (priceBenchmarks && priceBenchmarks.length > 0) {
          priceContext = `\n- Price benchmarks available: ${priceBenchmarks.map(p => `${p.subcategory || 'General'}: ${p.currency} ${p.benchmark_price}/${p.unit} (${p.region})`).join('; ')}`;
        }

        marketResearchContext = `
LIVE MARKET INTELLIGENCE (Real platform data as of ${today}, ${currentMonth} ${currentYear}):
- ${catSignals?.length || 0} active demand signals detected for ${category} in ${currentQuarter} ${currentYear}
- Average buyer intent score: ${avgIntent}/10 (higher = more urgent procurement need)
- Active demand hotspots: ${signalCountries.join(', ') || 'Multiple regions'}
- Top subcategories in demand: ${topSubcategories.join(', ') || 'Various'}
- Buyer segments active: ${buyerTypes.join(', ') || 'Mixed'}
- Industry verticals sourcing: ${industrySegments.join(', ') || 'Cross-industry'}
- ${rfqCount} RFQs submitted in last 30 days (destinations: ${rfqDestinations.join(', ') || 'Various'})
- Trade type mix: ${rfqTradeTypes.join(', ') || 'Mixed'}
${maxValue > 0 ? `- Estimated deal values up to $${(maxValue / 1000).toFixed(0)}K` : ''}
- Signal classifications: ${classifications.join(', ') || 'Mixed'}${priceContext}

CRITICAL: Use this REAL data throughout the blog. Reference specific subcategories, countries, and buyer segments. Make the content feel data-driven and current. Example: "In ${currentMonth} ${currentYear}, platform intelligence shows ${topSubcategories[0] || category} demand surging from ${demandHotspots[0] || 'key markets'}."`;
      }
    } catch (dbErr) {
      console.error('Market research DB error (non-fatal):', dbErr);
    }

    // Intent detection
    const isBuyerIntent = trade_type === 'Domestic' || trade_type === 'Import';
    const isSupplierIntent = trade_type === 'Export';
    const variationSeed = `${custom_topic || category}|${country}|${trade_type}`;
    const topicStrategy = buildTopicStrategy(custom_topic, category, country, trade_type);

    // === KEYWORD-AWARE ANGLE SELECTION ===
    const buyerAngles = [
      { angle: 'Price Intelligence & Cost Optimization', focus: 'deep-dive into pricing mechanisms, cost breakdown analysis, and negotiation leverage points' },
      { angle: 'Supply Chain Risk & Supplier Verification', focus: 'risk assessment frameworks, red flags in supplier evaluation, and due diligence checklists' },
      { angle: 'Market Outlook & Demand Forecasting', focus: 'forward-looking market analysis, demand-supply gap analysis, and procurement timing strategies' },
      { angle: 'Quality Standards & Compliance Navigation', focus: 'regulatory landscape, testing requirements, certification processes, and compliance cost impact' },
      { angle: 'Regional Sourcing Strategy & Supplier Mapping', focus: 'manufacturing cluster analysis, regional price differentials, and logistics optimization by geography' },
      { angle: 'Procurement Technology & AI-Driven Buying', focus: 'how AI and data analytics transform procurement decisions, multi-supplier comparison, automated RFQ matching' },
      { angle: 'Total Cost of Ownership Analysis', focus: 'beyond unit price - logistics, quality rejection rates, payment terms impact, inventory carrying costs' },
      { angle: 'Seasonal Trends & Procurement Timing', focus: 'cyclical price patterns, festive/monsoon impact, optimal ordering windows, inventory planning' },
    ];
    
    const supplierAngles = [
      { angle: 'Export Market Penetration Strategy', focus: 'target market selection, buyer expectations by region, competitive positioning' },
      { angle: 'Global Pricing & Margin Optimization', focus: 'FOB/CIF analysis, forex hedging, payment term negotiation, margin protection' },
      { angle: 'Compliance & Certification Roadmap', focus: 'destination country standards, certification timeline and costs, market access barriers' },
      { angle: 'Buyer Demand Intelligence & Market Signals', focus: 'reading demand signals, buyer behavior patterns, opportunity sizing' },
      { angle: 'Digital B2B Sales & Platform Strategy', focus: 'leveraging AI procurement platforms, digital visibility, verified supplier advantages' },
    ];

    const angles = isSupplierIntent ? supplierAngles : buyerAngles;
    const preferredAngles = angles.filter(({ angle }) => topicStrategy.anglePreference.includes(angle));
    const selectedAngle = pickDeterministicVariant(
      preferredAngles.length > 0 ? preferredAngles : angles,
      variationSeed,
      'angle'
    );

    // Structure variation to avoid repetitive blog layouts
    const structureVariants = [
      { name: 'problem-first', instruction: 'START with a specific, painful buyer problem. Open with a scenario: a procurement manager facing a real challenge. Build tension before introducing solutions.' },
      { name: 'case-study-first', instruction: 'START with a realistic illustrative case study (anonymized). Example: "A mid-size manufacturer in Pune was spending ₹X on Y..." Walk through their journey, then extract lessons.' },
      { name: 'data-first', instruction: 'START with a striking data point or market trend. Lead with numbers: "In Q1 2025, demand for X surged 34% while supply..." Use data to frame the entire narrative.' },
    ];
    const preferredStructures = structureVariants.filter(({ name }) => topicStrategy.preferredStructures.includes(name));
    const selectedStructure = pickDeterministicVariant(
      preferredStructures.length > 0 ? preferredStructures : structureVariants,
      variationSeed,
      'structure'
    );

    // Trade-specific deep context
    const tradeContextMap: Record<string, string> = {
      'Domestic': `domestic procurement within ${country}. Cover:
- Regional supplier hubs and manufacturing clusters
- BIS/ISI/FSSAI standards applicable to ${category}
- GST implications (HSN codes, input tax credit)
- State-level incentives or restrictions
- Typical MOQs and lead times from Indian manufacturers
- Quality variance across Tier-1 vs Tier-2/3 suppliers`,
      'Export': `exporting ${category} FROM ${country} to international markets. Cover:
- DGFT export policies and incentives (RoDTEP, MEIS if applicable)
- Required export documentation (Bill of Lading, Certificate of Origin, Phytosanitary)
- FOB vs CIF pricing structures with typical ranges
- Key destination markets and their import requirements
- Port logistics (major ports for ${category})
- Forex hedging considerations
- Compliance with destination country standards (EU REACH, US FDA, etc.)`,
      'Import': `importing ${category} INTO ${country}. Cover:
- Customs duty structure (Basic + IGST + Cess) with HS code references
- Anti-dumping duties if applicable
- Key source countries and their quality tiers
- Landed cost calculation methodology
- Import licensing requirements (if any)
- Quality inspection at port (BIS CRS, FSSAI import license)
- Forex exposure and payment terms (LC, TT, DA/DP)`,
    };

    const tradeContext = tradeContextMap[trade_type] || tradeContextMap['Domestic'];

    // Country-specific regulation context
    const regulationsByCountry: Record<string, string> = {
      'India': 'BIS standards, FSSAI (food), GST/HSN, Make in India, PLI schemes',
      'UAE': 'ESMA standards, Emirates Authority for Standardization, VAT at 5%, free zone regulations',
      'Saudi Arabia': 'SASO/SFDA standards, Vision 2030 procurement reforms, Saudization requirements',
      'USA': 'ASTM/ANSI standards, FDA (food/pharma), EPA regulations, Buy American Act',
      'UK': 'BSI standards, UKCA marking (post-Brexit), HMRC customs, UK-India FTA considerations',
      'Germany': 'DIN/EN standards, REACH compliance, CE marking, dual-use export controls',
      'Singapore': 'SS standards, Enterprise Singapore certifications, GST at 9%, CPTPP benefits',
    };
    const countryRegs = regulationsByCountry[country] || `local standards and trade regulations in ${country}`;

    // === CATEGORY-SPECIFIC DEEP KNOWLEDGE ===
    const categoryInsights = getCategorySpecificInsights(category, currentYear, country);
    const topicSpecificInsights = getTopicSpecificInsights(custom_topic, category, country, trade_type);
    const sections = getSectionBlueprint(
      topicStrategy,
      selectedAngle,
      currentMonth,
      currentQuarter,
      currentYear,
      trade_type,
      demandHotspots,
      topSubcategories,
      buyerTypes,
      industrySegments,
      countryRegs
    );

    // === RANDOMIZED OPENING SCENARIOS ===
    const cityPools = ['Pune', 'Mumbai', 'Chennai', 'Raipur', 'Jamshedpur', 'Ahmedabad', 'Hyderabad', 'Bengaluru', 'Kolkata', 'Ludhiana', 'Coimbatore', 'Vizag', 'Delhi-NCR', 'Rourkela', 'Durgapur', 'Indore', 'Nagpur', 'Surat', 'Rajkot', 'Vadodara'];
    const industryPools = ['construction company', 'mid-size manufacturer', 'EPC contractor', 'infrastructure developer', 'fabrication unit', 'real estate group', 'auto-component maker', 'FMCG plant', 'chemical processor', 'textile mill', 'packaging converter', 'food processor', 'steel trader', 'industrial distributor', 'government PSU project'];
    const scenarioPools = [
      'faced a {pct}% price spike in {product} after monsoon disrupted logistics from {hub}',
      'lost ₹{amount}L on a {product} order because the supplier delivered underweight bundles with no mill test certificates',
      'was paying {pct}% above market rate for {product} because their procurement team was comparing only 2 suppliers',
      'discovered that 3 out of 5 shortlisted {product} suppliers had fake BIS certifications',
      'saved ₹{amount}L annually by switching from single-source {product} buying to competitive reverse auctions',
      'rejected an entire {product} shipment worth ₹{amount}L due to grade mismatch — the supplier quoted Fe 500D but delivered Fe 415',
      'was stuck with 45-day payment terms on {product} while competitors negotiated 60-90 day credit from the same suppliers',
      'reduced {product} procurement cycle from 14 days to 3 days using AI-powered supplier matching',
      'found that freight from {hub} to their {city} plant was adding ₹{amount}K per MT to their {product} landed cost',
      'switched {product} sourcing from {hub} to a closer manufacturing cluster and cut logistics cost by {pct}%',
    ];
    const seedHash = hashString(variationSeed);
    const selectedCity = cityPools[seedHash % cityPools.length];
    const selectedIndustry = industryPools[(seedHash >> 4) % industryPools.length];
    const selectedScenario = scenarioPools[(seedHash >> 8) % scenarioPools.length];
    const product = custom_topic ? custom_topic.replace(/-/g, ' ').replace(/india$/i, '').trim() : category;
    const pct = 8 + (seedHash % 25);
    const amount = 5 + (seedHash % 40);
    const hub = demandHotspots[0] || 'Raipur';
    const openingScenario = selectedScenario
      .replace('{pct}', String(pct))
      .replace('{amount}', String(amount))
      .replace('{product}', product)
      .replace('{hub}', hub)
      .replace('{city}', selectedCity);

    const systemPrompt = `You are NOT a content writer. You are a senior procurement consultant at ProcureSaathi writing a client briefing. Today is ${today}, ${currentMonth} ${currentYear}.

ROLE: Write a HIGHLY SPECIFIC, conversion-focused blog that reads like a real procurement intelligence report — NOT like AI-generated marketing content.

${marketResearchContext}

${trending_context ? `TRENDING MARKET CONTEXT (from platform intelligence):\n${trending_context}\n` : ''}

${categoryInsights}

${topicSpecificInsights}

MANDATORY OPENING (USE THIS EXACT SCENARIO, then expand):
"A ${selectedIndustry} in ${selectedCity} recently ${openingScenario}."
— Expand this into a 3-4 sentence opening paragraph that sets up the problem. Then transition into market analysis.

ARTICLE STRATEGY:
- Anchor keyword: "${topicStrategy.anchorKeyword}"
- Topic pattern: ${topicStrategy.pattern}
- Structure style: "${selectedStructure.name}" — ${selectedStructure.instruction}
- Primary angle: "${selectedAngle.angle}" — ${selectedAngle.focus}
- Title direction: ${topicStrategy.titleDirection}

STRICT CONTENT RULES:
1. START with the scenario above — NEVER start with "In today's market" or "India is growing" or any generic opener.
2. Write 1400-1800 words of substantive commercial analysis with ZERO filler.
3. Use THIS STRUCTURE (sections must appear in this order but with natural flow):
   a) Scenario / Problem (using the opening above)
   b) Market Reality — India-specific, mention cities (${selectedCity}, ${cityPools[(seedHash + 3) % cityPools.length]}, ${cityPools[(seedHash + 7) % cityPools.length]})
   c) Price Benchmarks — use ₹ REAL RANGES in HTML <table>, e.g., "₹48,000–55,000/MT"
   d) Supplier Challenges — verification issues, red flags, documentation gaps
   e) AI Procurement Solution — how ProcureSaathi solves this
   f) Final Recommendation with CTA
4. FORCE DEPTH:
   - Mention IS codes (IS 1786, IS 2062, etc.) where relevant
   - Mention raw materials (iron ore, coking coal, billet, sponge iron, etc.)
   - Mention supply hubs (Raipur, Durgapur, Jamshedpur, Ludhiana, etc.)
   - Use real HSN codes where applicable
   - Reference DGFT, BIS, PLI schemes, GST implications
5. KEYWORD USAGE: Use "${topicStrategy.anchorKeyword}" naturally 6-8 times. NO keyword stuffing.
6. STRICTLY AVOID these phrases — if you use ANY of them, the blog will be rejected:
   - "In today's competitive market"
   - "India is growing"  
   - "It is important to note"
   - "plays a crucial role"
   - "In recent years"
   - "In the ever-evolving landscape"
   - "As we navigate"
   - "It goes without saying"
   - Any sentence that could apply to ANY industry without modification
7. Use price RANGES (e.g., "₹48,000–55,000/MT"), never fabricated exact numbers.
8. Reference REAL standards: BIS IS-2062, ISO 9001, ASTM A36, DGFT notifications, HS codes.
9. Include 2-3 HTML <table> elements with real decision-useful data.
10. Use <h2> for major sections, <h3> for subsections, <ul>/<ol> for lists.
11. Internal links: <a href="/post-rfq">Get AI-Matched Quotes</a>, <a href="/browseproducts">Browse Categories</a>
12. END with: "Start a reverse auction and get the lowest price from verified suppliers" + CTA link
13. End with "Illustrative Scenario" disclaimer and "AI Demand-Feed Notice".
14. Output ONLY valid HTML inside a single <article> tag. No markdown. No code fences.
15. Every <h2> section must have at least 2 substantive paragraphs with CONCRETE details.
16. Use DIFFERENT industry examples throughout: construction, infra, manufacturing, auto, FMCG.
17. Mention at least 3 different Indian cities by name in the body content.

ANTI-DRIFT RULES:
${topicStrategy.antiDrift}

UNIQUENESS ENFORCEMENT:
- Your opening paragraph MUST use the specific scenario provided above — no generic alternatives.
- Each section must contain at least one SPECIFIC fact (standard number, HS code, price benchmark, policy name, geographic detail).
- Write like a procurement consultant briefing a ₹10Cr+ buyer — specific, actionable, zero filler.
- Two blogs from the same category MUST have different openings, different city examples, different price tables, and different supplier challenges.

TITLE RULES:
- NEVER use "X Procurement in Y: Sourcing Guide YEAR"
- ${topicStrategy.titleDirection}
- Make it sound like a market intelligence report a procurement head would forward to their team`;

    const userPrompt = custom_topic
      ? `Write a procurement research blog about: "${custom_topic}"

Context: ${category} industry, ${country} market, ${trade_type} trade type.
Focus: ${tradeContext}

TOPIC BRIEF:
${topicStrategy.detailBrief}

SECTION BLUEPRINT:
${sections}

Year: ${currentYear}. Regulations: ${countryRegs}.`
      : `Write a deep-research procurement blog about ${category} focused on ${tradeContext}

TOPIC BRIEF:
${topicStrategy.detailBrief}

SECTION BLUEPRINT:
${sections}

Year: ${currentYear}. Country regulations: ${countryRegs}.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_blog',
            description: 'Create a structured blog post with SEO metadata and HTML content',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'SEO H1 title. 50-70 chars. Must include category, specific angle, and year. Must feel like a market intelligence report.' },
                meta_title: { type: 'string', description: 'Meta title for search engines, under 60 characters' },
                meta_description: { type: 'string', description: 'Meta description, 120-160 chars, includes primary keyword and CTA hint' },
                excerpt: { type: 'string', description: 'Blog excerpt, 150-200 chars, compelling summary referencing the specific angle' },
                content: { type: 'string', description: 'Full blog HTML inside <article> tag. 1500-2000 words. h2/h3 headings, 2-3 tables for pricing/data, lists, internal links, CTA. No empty gaps. Data-driven and unique.' },
                seo_keywords: { type: 'string', description: 'Comma-separated SEO keywords (8-12 keywords) including category-specific long-tail terms' },
              },
              required: ['title', 'meta_title', 'meta_description', 'excerpt', 'content', 'seo_keywords'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'create_blog' } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a minute.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      const msgContent = aiData.choices?.[0]?.message?.content;
      if (msgContent) {
        console.log('AI returned content in message instead of tool call, attempting parse');
      }
      throw new Error('AI did not return structured blog content');
    }

    const blogData = JSON.parse(toolCall.function.arguments);

    // Generate unique slug
    const slugBase = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 70);
    const slug = `${slugBase}-${trade_type.toLowerCase()}-${country.toLowerCase().replace(/\s+/g, '-')}`;

    // Image system: keyword-specific images for relevance
    const categoryImages = getCategoryImagePool(category, custom_topic);
    const coverImageUrl = categoryImages.cover;
    
    const inlineImageUrls = categoryImages.inline;
    const product_name = custom_topic ? custom_topic.replace(/-/g, ' ').replace(/india$/i, '').trim() : category;
    const imageCaptions = getImageCaptions(product_name, country, trade_type);

    // Inject images into content
    let finalContent = injectImagesIntoContent(blogData.content, inlineImageUrls, imageCaptions);

    // Clean up blank gaps
    finalContent = finalContent
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<p><br\s*\/?>\s*<\/p>/g, '')
      .replace(/(<br\s*\/?>){3,}/g, '<br/>')
      .replace(/\n{3,}/g, '\n\n');

    return new Response(JSON.stringify({
      blog: {
        title: blogData.title,
        slug,
        excerpt: blogData.excerpt,
        content: finalContent,
        meta_title: blogData.meta_title,
        meta_description: blogData.meta_description,
        seo_keywords: blogData.seo_keywords,
        cover_image: coverImageUrl,
        inline_images: inlineImageUrls,
        intent: isSupplierIntent ? 'supplier' : 'buyer',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-blog error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickDeterministicVariant<T>(items: T[], seed: string, salt: string): T {
  return items[hashString(`${seed}|${salt}`) % items.length];
}

function buildTopicStrategy(customTopic: string, category: string, country: string, tradeType: string): TopicStrategy {
  const anchorKeyword = (customTopic || `${category} procurement ${tradeType.toLowerCase()} ${country}`).trim();
  const topic = anchorKeyword.toLowerCase();
  const commodityNotes = getCommodityTopicNotes(topic, category, country);

  if (/\b(compare|comparison|vs|versus)\b/.test(topic)) {
    return {
      pattern: 'comparison',
      anchorKeyword,
      introInstruction: 'Open with a real decision under pressure: two sourcing approaches, two supplier types, or two cost levers that produce different outcomes.',
      titleDirection: 'Write the title like a decision framework or commercial scorecard tied to the exact keyword.',
      anglePreference: ['Total Cost of Ownership Analysis', 'Supply Chain Risk & Supplier Verification', 'Procurement Technology & AI-Driven Buying'],
      preferredStructures: ['data-first', 'problem-first'],
      detailBrief: `- Build an apples-to-apples comparison framework around price, freight, lead time, quality risk, payment terms, and operational effort.\n- Include a weighted decision matrix and explain when each option wins.`,
      antiDrift: 'Do not turn the article into a generic explainer. Keep returning to comparison criteria, trade-offs, and decision thresholds.',
    };
  }

  if (/verified suppliers|find .*suppliers?|source raw materials/.test(topic)) {
    return {
      pattern: 'supplier',
      anchorKeyword,
      introInstruction: 'Open with a supplier discovery failure: too many unverifiable leads, weak documentation, or poor quote quality.',
      titleDirection: 'Write the title like a supplier-shortlisting or verification brief anchored to the keyword.',
      anglePreference: ['Supply Chain Risk & Supplier Verification', 'Regional Sourcing Strategy & Supplier Mapping', 'Procurement Technology & AI-Driven Buying'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `- Focus on verification checks such as GST, plant address, dispatch proof, certifications, reference calls, and sample validation.\n- Include a supplier scorecard table buyers can use before floating RFQs.`,
      antiDrift: 'Stay focused on supplier discovery, verification, and shortlisting. Avoid category-level filler that does not help a buyer validate or compare suppliers.',
    };
  }

  if (/reduce procurement cost|cost saving|lowest supplier price|lowest price|bulk buying|negotiation|competition/.test(topic)) {
    return {
      pattern: 'cost',
      anchorKeyword,
      introInstruction: 'Open with a margin-pressure scenario, a quote stack that looks competitive but is not, or a buying habit that quietly destroys savings.',
      titleDirection: 'Write the title like a cost-reduction playbook or negotiation brief for the exact keyword.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Total Cost of Ownership Analysis', 'Procurement Technology & AI-Driven Buying'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `- Focus on total landed cost, quote normalization, supplier competition design, payment terms, freight, and spec discipline.\n- Show 3-5 concrete cost levers with realistic rupee impact.`,
      antiDrift: 'Keep the article about savings mechanics and execution choices, not generic product-market narration.',
    };
  }

  if (/mistakes|challenges|dependency|risk/.test(topic)) {
    return {
      pattern: 'risk',
      anchorKeyword,
      introInstruction: 'Open with a broken buying pattern, escalation, stockout, or quality issue that exposes a weak procurement process.',
      titleDirection: 'Write the title like a failure analysis or buyer operating memo for the keyword.',
      anglePreference: ['Supply Chain Risk & Supplier Verification', 'Quality Standards & Compliance Navigation', 'Total Cost of Ownership Analysis'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `- Diagnose the operational and commercial impact of vague specs, supplier concentration, weak verification, and quote incomparability.\n- Use a risk heatmap or issue-priority matrix.`,
      antiDrift: 'Do not drift into motivational procurement content. Keep surfacing failure modes, commercial consequences, and the controls that reduce them.',
    };
  }

  if (/reverse auction|auction|automation|digital procurement|strategic sourcing|process explained|benefits|strategies/.test(topic)) {
    return {
      pattern: 'transformation',
      anchorKeyword,
      introInstruction: 'Open with a slow, manual, approval-heavy workflow or a buyer team missing savings because data is fragmented.',
      titleDirection: 'Write the title like an operating model brief or buyer playbook anchored to the keyword.',
      anglePreference: ['Procurement Technology & AI-Driven Buying', 'Price Intelligence & Cost Optimization', 'Total Cost of Ownership Analysis'],
      preferredStructures: ['problem-first', 'case-study-first', 'data-first'],
      detailBrief: `- Focus on workflow design, RFQ standardization, supplier scoring, approval logic, rate history, and KPI visibility.\n- Include a before-vs-after table showing speed, quote quality, and savings visibility.`,
      antiDrift: 'Keep the article anchored on workflow design and execution. Avoid vague thought-leadership language.',
    };
  }

  if (commodityNotes || /\b(tmt|rebar|steel|pipe|cement|coil|ingot|tray|bars?|pvc|polymer|solvent|fabric|board|mineral)\b/.test(topic)) {
    return {
      pattern: 'commodity',
      anchorKeyword,
      introInstruction: 'Open with a concrete market signal, buying trigger, freight squeeze, or spec-selection decision — not a generic industry intro.',
      titleDirection: 'Write the title like a product-specific commercial brief or market intelligence note.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Regional Sourcing Strategy & Supplier Mapping', 'Quality Standards & Compliance Navigation', 'Seasonal Trends & Procurement Timing'],
      preferredStructures: ['data-first', 'case-study-first'],
      detailBrief: commodityNotes || `- Keep the article centered on the exact product or material named in the keyword.\n- Explain the specs, pricing variables, compliance checks, and sourcing regions that determine buying outcomes.`,
      antiDrift: 'Do not drift into adjacent products unless the article is explicitly comparing substitutes. Category context should support the exact product keyword, not overwhelm it.',
    };
  }

  return {
    pattern: 'generic',
    anchorKeyword,
    introInstruction: 'Open with a concrete buyer decision, operational constraint, or commercial trigger tied to the keyword.',
    titleDirection: 'Write the title like a commercial buyer brief, not a reusable generic template.',
    anglePreference: ['Price Intelligence & Cost Optimization', 'Supply Chain Risk & Supplier Verification', 'Procurement Technology & AI-Driven Buying', 'Market Outlook & Demand Forecasting'],
    preferredStructures: ['problem-first', 'data-first', 'case-study-first'],
    detailBrief: `- Keep every section tightly aligned to the exact search intent implied by "${anchorKeyword}".\n- Avoid sections that could be copied into another keyword with only minor edits.`,
    antiDrift: 'Every section must feel impossible to reuse for another keyword without rewriting it.',
  };
}

function getTopicSpecificInsights(customTopic: string, category: string, country: string, tradeType: string): string {
  const anchorKeyword = customTopic.trim();
  if (!anchorKeyword) {
    return `TOPIC DEEP KNOWLEDGE:\n- Keep the article specific to ${category} procurement decisions in ${country}.\n- Use commercial detail, supplier evaluation logic, and live demand context instead of generic category history.`;
  }

  const topic = anchorKeyword.toLowerCase();
  const commodityNotes = getCommodityTopicNotes(topic, category, country);
  if (commodityNotes) return commodityNotes;

  if (/\b(compare|comparison|vs|versus)\b/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Procurement Comparison:\n- Build a true apples-to-apples comparison around landed cost, lead time, quality risk, compliance fit, payment terms, and operational effort.\n- Show where price-only comparisons break down and what secondary variables decide the outcome.`;
  }

  if (/verified suppliers|find .*suppliers?|source raw materials/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Supplier Discovery & Verification:\n- Cover verification checks such as GST status, plant address, dispatch proof, certifications, bank validation, reference calls, and sample approval.\n- Highlight red flags like incomplete documentation, weak quote specificity, refusal to share recent dispatch history, or inconsistent commercial terms.`;
  }

  if (/reduce procurement cost|cost saving|lowest supplier price|lowest price|bulk buying|negotiation|competition/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Cost Optimization:\n- Focus on total landed cost, freight normalization, payment-term impact, batch size, spec discipline, supplier participation depth, and quote normalization.\n- Separate unit price savings from real retained procurement savings.`;
  }

  if (/mistakes|challenges|dependency|risk/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Procurement Risk Diagnostics:\n- Diagnose issues such as vague specs, supplier concentration, quote incomparability, poor verification, and late buying cycles.\n- Explain the commercial impact on margins, fill rate, cash flow, and quality outcomes.`;
  }

  if (/reverse auction|auction|automation|digital procurement|strategic sourcing|process explained|benefits|strategies/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Procurement Operating Model:\n- Focus on workflow design: RFQ standardization, supplier scorecards, approval rules, rate history, savings visibility, and quote comparison logic.\n- Show what actually changes when teams move from email-and-spreadsheet buying to structured digital procurement.`;
  }

  return `TOPIC DEEP KNOWLEDGE:\n- Tie every section back to the exact decision implied by "${anchorKeyword}".\n- Use concrete commercial variables, documentation requirements, and supplier-evaluation logic relevant to ${country} and ${tradeType.toLowerCase()} trade.`;
}

function getCommodityTopicNotes(topic: string, category: string, country: string): string {
  if (/(tmt|rebar)/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - TMT Bars:\n- Focus on BIS IS 1786 grades Fe 500, Fe 500D, Fe 550, and Fe 550D across common size bands such as 8mm, 10mm, 12mm, 16mm, 20mm, and 25mm.\n- Buyers care about actual bundle weight, elongation, bend and rebend performance, mill test certificates, and primary-mill versus secondary-mill consistency.\n- Key sourcing belts in ${country}: Raipur/Durg, Jalna, Rourkela, and Visakhapatnam.\n- Price moves with billet or sponge iron, scrap, power tariffs, freight, project demand, and monsoon execution cycles.\n- Procurement red flags: fake ISI marks, underweight bundles, vague grade declarations, freight-excluded quotes, and missing test reports.`;
  }

  if (/structural steel/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Structural Steel:\n- Focus on IS 2062 grades such as E250 and E350, plus section types like beams, channels, angles, plates, and fabricated assemblies.\n- Commercial variables include section weight accuracy, cut-to-length or fabrication losses, primer requirements, and delivery sequencing to site.`;
  }

  if (/stainless steel pipes?|ss pipes?/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Stainless Steel Pipes:\n- Focus on grades such as 202, 304, and 316, along with welded versus seamless construction, OD and wall-thickness tolerance, and schedule requirements.\n- Price is shaped by nickel and alloy surcharge, thickness tolerance, polishing requirements, and whether buyers need documentation for food, pharma, or utility use.`;
  }

  if (/(hr coil|hot rolled coil)/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Hot Rolled Coil:\n- Focus on thickness and width bands, yield and tensile requirements, pickled versus non-pickled supply, and relevant flat-steel quality standards.\n- Buyers care about gauge tolerance, slit-width accuracy, surface quality, and whether the quote includes decoiling, slitting, or cut-to-length services.`;
  }

  if (/pvc pipes?/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - PVC Pipes:\n- Differentiate between UPVC pressure pipes, SWR pipes, and application-specific variants; commercial decisions hinge on pressure class, wall thickness, socket quality, and fitting compatibility.\n- Buyers should compare leak risk, fitting availability, and landed project cost, not pipe price alone.`;
  }

  if (/cable trays?/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Cable Trays:\n- Focus on ladder, perforated, and trough tray variants with load-span rating, thickness, finish quality, and hardware inclusion.\n- Buyers need clarity on support spacing, corrosion resistance, and earthing continuity before comparing prices.`;
  }

  if (/aluminium|aluminum ingots?/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Aluminium Ingots:\n- Distinguish primary versus secondary ingots, purity or alloy expectations, and whether the buyer needs foundry-grade supply.\n- Price moves with LME aluminium, regional premium, power cost, scrap availability, and furnace-yield economics.`;
  }

  if (/cement/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Cement:\n- Differentiate OPC 43 grade, OPC 53 grade, PPC, and PSC based on structural use, curing conditions, and project timelines.\n- Buyers should compare freshness, bag versus bulk dispatch, freight-to-site, and consistency rather than headline bag price alone.`;
  }

  if (/steel/.test(topic) || category.toLowerCase().includes('steel')) {
    return `TOPIC DEEP KNOWLEDGE - Steel Buying:\n- Anchor the article on the exact steel family named in the keyword: long products, structural sections, flat products, tubes and pipes, or stainless grades.\n- Cover only the raw-material and commercial drivers relevant to that family.`;
  }

  return '';
}

function getSectionBlueprint(
  strategy: TopicStrategy,
  selectedAngle: AngleOption,
  currentMonth: string,
  currentQuarter: string,
  currentYear: number,
  tradeType: string,
  demandHotspots: string[],
  topSubcategories: string[],
  buyerTypes: string[],
  industrySegments: string[],
  countryRegs: string
): string {
  const hotspotText = demandHotspots.length > 0 ? demandHotspots.join(', ') : 'current platform hotspots';
  const subcategoryText = topSubcategories.length > 0 ? topSubcategories.join(', ') : 'the most active subcategories';
  const buyerText = buyerTypes.length > 0 ? buyerTypes.join(', ') : 'active buyer segments';
  const industryText = industrySegments.length > 0 ? industrySegments.join(', ') : 'active downstream industries';

  if (tradeType === 'Export') {
    return `1. "${strategy.anchorKeyword}: Export Demand Brief (${currentQuarter} ${currentYear})" — lead with buyer demand signals, priority markets, and the current commercial trigger.\n2. "Destination Matrix & Buyer Fit" — <table> with destination, buyer type, compliance need, and pricing sensitivity.\n3. "FOB/CIF Pricing Logic" — show where margin moves: Incoterms, freight, documentation, payment terms, and destination requirements.\n4. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n5. "Compliance, Documentation & Logistics Workflow" — ${countryRegs}, shipment documents, route logic, and export failure points.\n6. "Supplier Action Plan" — numbered checklist for exporters.\n7. CTA section with link to /signup?type=supplier — "Register as a Verified Supplier on ProcureSaathi".\nUse live touchpoints from hotspots ${hotspotText}, buyer types ${buyerText}, and industries ${industryText}.`;
  }

  switch (strategy.pattern) {
    case 'commodity':
      return `1. "${strategy.anchorKeyword}: Live Market Brief (${currentMonth} ${currentYear})" — open with one concrete demand, pricing, or availability signal.\n2. "Spec & Commercial Lock-In Before Comparing Quotes" — grades, dimensions, certifications, quantity slabs, freight basis, and payment terms.\n3. "Benchmark Pricing & Quote Drivers" — <table> with spec or grade, indicative price range, unit, and the variable that moves that price.\n4. "Regional Sourcing Map" — sourcing clusters, lead-time logic, and how buyers in ${hotspotText} pull supply.\n5. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n6. "Compliance, Inspection & Quote Red Flags" — ${countryRegs}, test documents, dispatch checks, and supplier warning signs.\n7. "RFQ Design: How to Get Better Quotes in ${currentYear}" — numbered action plan and shortlist checklist.\n8. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nWeave in live signals from hotspots ${hotspotText}, subcategories ${subcategoryText}, buyer types ${buyerText}, and industries ${industryText}.`;
    case 'cost':
      return `1. "Where Cost Leaks Begin" — identify the most common procurement cost traps tied to the keyword.\n2. "Savings Model & Baseline" — <table> with cost levers, likely impact, and operational dependency.\n3. "Negotiate, Consolidate, or Run Supplier Competition?" — compare the buyer's realistic options.\n4. "Quote Normalization & Commercial Controls" — freight, payment terms, taxes, MOQ, and spec discipline.\n5. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n6. "KPI Scoreboard" — what to track over 30, 60, and 90 days.\n7. "Execution Plan" — concrete steps the buyer can act on now.\n8. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nReference live demand from hotspots ${hotspotText}, buyer types ${buyerText}, and related subcategories ${subcategoryText}.`;
    case 'comparison':
      return `1. "The Decision Context" — explain what the buyer is really choosing between and why it matters now.\n2. "Comparison Matrix" — <table> with options, cost, lead time, quality risk, and operational fit.\n3. "Where Price-Only Comparisons Fail" — show the non-obvious variables that change the result.\n4. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n5. "When Each Option Wins" — spell out the threshold conditions.\n6. "Implementation Checklist" — what the buyer should verify before deciding.\n7. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nUse live context from buyer types ${buyerText}, industries ${industryText}, and hotspots ${hotspotText}.`;
    case 'supplier':
      return `1. "Why Supplier Discovery Fails" — identify the failure pattern behind weak supplier pipelines.\n2. "Verification Scorecard" — <table> with documents, checks, why each one matters, and what counts as a red flag.\n3. "Regional Supplier Map" — where serious suppliers are usually concentrated and how buyers should validate them.\n4. "Quote Quality: How to Compare Suppliers Fairly" — normalize price, lead time, commercial terms, and responsiveness.\n5. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n6. "Shortlist & RFQ Checklist" — exact steps to move from discovery to actionable quotes.\n7. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nWeave in live buyer activity from ${buyerText}, industries ${industryText}, and hotspots ${hotspotText}.`;
    case 'risk':
      return `1. "The Failure Pattern" — define the core risk or recurring mistake in commercial terms.\n2. "Risk Heatmap" — <table> with issue, probability, commercial impact, and control.\n3. "What It Costs the Buyer" — margin, working-capital, fill-rate, quality, or lead-time impact.\n4. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n5. "Controls Buyers Should Put in the RFQ" — preventive workflow and supplier-governance steps.\n6. "90-Day Fix Plan" — prioritized operational action list.\n7. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nAnchor the argument in hotspots ${hotspotText}, subcategories ${subcategoryText}, and buyer types ${buyerText}.`;
    case 'transformation':
      return `1. "Why the Old Workflow Breaks Down" — describe the manual process bottleneck tied to the keyword.\n2. "What a Better Buying Workflow Looks Like" — map the future-state process.\n3. "Operating Model & System Design" — <table> comparing old versus improved workflow by speed, visibility, and control.\n4. "${selectedAngle.angle}" — this must be the deepest section; focus on ${selectedAngle.focus}.\n5. "Metrics That Matter" — cycle time, quote quality, savings visibility, supplier participation, or approval discipline.\n6. "Rollout Plan" — staged steps for implementation.\n7. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nUse live context from active buyer types ${buyerText}, industries ${industryText}, and hotspots ${hotspotText}.`;
    default:
      return `1. "Commercial Context" — open with a concrete market or buyer signal tied to ${strategy.anchorKeyword}.\n2. "Benchmark Table" — <table> with the most decision-useful numbers or criteria.\n3. "${selectedAngle.angle}" — make this the deepest section; focus on ${selectedAngle.focus}.\n4. "Compliance, Sourcing & Supplier Logic" — ${countryRegs} plus commercial implications.\n5. "Action Plan" — what the reader should do next.\n6. CTA section with link to /post-rfq — "Get AI-matched quotes from verified suppliers on ProcureSaathi".\nUse live data touchpoints from hotspots ${hotspotText}, subcategories ${subcategoryText}, buyer types ${buyerText}, and industries ${industryText}.`;
  }
}

function injectImagesIntoContent(html: string, imageUrls: string[], captions: string[]): string {
  const parts = html.split(/(<h2[^>]*>.*?<\/h2>)/gi);
  let imageIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    if (/<h2[^>]*>/i.test(parts[i]) && imageIndex < imageUrls.length && i + 1 < parts.length) {
      const section = parts[i + 1];
      if (/<table/i.test(section)) continue;

      const firstPEnd = section.indexOf('</p>');
      if (firstPEnd !== -1) {
        const insertPos = firstPEnd + 4;
        const caption = captions[imageIndex] || `${captions[0]} - ProcureSaathi procurement insights`;
        const imgHtml = `<figure class="blog-image" style="margin:2rem 0"><img src="${imageUrls[imageIndex]}" alt="${caption}" width="800" height="400" loading="lazy" style="width:100%;height:auto;border-radius:8px" /><figcaption style="text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem">${caption}</figcaption></figure>`;
        parts[i + 1] = section.slice(0, insertPos) + imgHtml + section.slice(insertPos);
        imageIndex++;
      }
    }
  }

  return parts.join('');
}

// Keyword-specific image matching for relevant blog images
function getKeywordImageQuery(keyword: string, category: string): string {
  const kw = (keyword || category).toLowerCase();
  
  // Steel & Metals - specific products
  if (/tmt|rebar/.test(kw)) return 'tmt+bars+construction+site+india';
  if (/structural steel/.test(kw)) return 'steel+structure+construction+building';
  if (/stainless steel pipe/.test(kw)) return 'stainless+steel+pipes+industrial+warehouse';
  if (/hr coil|hot rolled/.test(kw)) return 'steel+coil+factory+manufacturing';
  if (/cable tray/.test(kw)) return 'cable+tray+electrical+industrial';
  if (/aluminium|aluminum/.test(kw)) return 'aluminium+ingots+metal+factory';
  if (/steel/.test(kw)) return 'steel+manufacturing+factory+india';
  
  // Construction
  if (/cement/.test(kw)) return 'cement+bags+construction+site+india';
  if (/pvc pipe/.test(kw)) return 'pvc+pipes+plumbing+warehouse+india';
  if (/aggregate|sand|gravel/.test(kw)) return 'construction+aggregates+quarry';
  if (/tile/.test(kw)) return 'ceramic+tiles+warehouse+manufacturing';
  
  // Chemicals
  if (/chemical|solvent|acid/.test(kw)) return 'chemical+drums+industrial+warehouse';
  if (/polymer|plastic/.test(kw)) return 'plastic+polymer+granules+manufacturing';
  
  // Other categories
  if (/textile|fabric|yarn/.test(kw)) return 'textile+fabric+rolls+manufacturing+india';
  if (/food|spice|grain/.test(kw)) return 'food+grain+warehouse+india';
  if (/packaging/.test(kw)) return 'packaging+corrugated+boxes+factory';
  if (/electrical|wire|cable/.test(kw)) return 'electrical+cables+wiring+industrial';
  if (/auto|automotive/.test(kw)) return 'automotive+parts+manufacturing+india';
  
  // Category fallbacks
  const catLower = category.toLowerCase();
  if (catLower.includes('steel')) return 'steel+factory+industrial+india';
  if (catLower.includes('chemical')) return 'chemical+plant+industrial';
  if (catLower.includes('construction')) return 'construction+site+building+india';
  if (catLower.includes('textile')) return 'textile+mill+fabric+india';
  if (catLower.includes('food')) return 'food+processing+warehouse+india';
  
  return 'industrial+procurement+warehouse+india';
}

function getCategoryImagePool(category: string, keyword?: string): { cover: string; inline: string[] } {
  const query = getKeywordImageQuery(keyword || '', category);
  
  // Use Unsplash source URLs with keyword-specific queries for relevant images
  // These generate different images each time but are always contextually relevant
  const baseUrl = `https://source.unsplash.com/featured`;
  
  return {
    cover: `${baseUrl}/1200x600/?${query}`,
    inline: [
      `${baseUrl}/800x400/?${query}+warehouse`,
      `${baseUrl}/800x400/?${query}+supply+chain`,
      `${baseUrl}/800x400/?${query}+quality+inspection`,
    ]
  };
}

function getImageCaptions(productName: string, country: string, tradeType: string): string[] {
  return [
    `${productName} procurement and sourcing in ${country} - ProcureSaathi`,
    `${productName} supply chain and warehouse operations - ProcureSaathi`,
    `${productName} quality inspection and verification process`,
    `B2B ${tradeType.toLowerCase()} logistics for ${productName} in ${country}`,
    `${productName} raw materials and inventory management`,
  ];
}

function getCategorySpecificInsights(category: string, year: number, country: string): string {
  const catLower = category.toLowerCase();
  
  const insights: Record<string, string> = {
    'steel': `CATEGORY DEEP KNOWLEDGE - Steel & Metals:
- Key grades: IS 2062 (structural), IS 1786 (TMT bars), SS 304/316, MS ERW/seamless pipes
- Raw material drivers: Iron ore (Odisha/Karnataka), coking coal (imported), nickel (LME), zinc
- Major hubs: Jamshedpur, Raipur, Ludhiana, Ahmedabad, Visakhapatnam
- Current dynamics: PLI scheme for specialty steel, China export rebate changes, BIS mandatory certification expansion
- HSN codes: 7208 (flat-rolled), 7213 (bars/rods), 7304 (seamless pipes), 7306 (welded tubes)`,
    'chemical': `CATEGORY DEEP KNOWLEDGE - Chemicals & Petrochemicals:
- Key segments: Basic chemicals, specialty chemicals, agrochemicals, dyes & pigments, solvents
- Raw material drivers: Crude oil, natural gas, ethylene, propylene prices
- Major hubs: GIDC Gujarat, MIDC Maharashtra, Vizag, Chennai-Manali
- Current dynamics: China+1 benefiting Indian specialty chemicals, REACH compliance for EU exports, PLI for bulk drugs
- HSN codes: 2801-2853 (inorganic), 2901-2942 (organic), 3801-3826 (misc chemicals)`,
    'construction': `CATEGORY DEEP KNOWLEDGE - Building & Construction Materials:
- Key products: Cement (OPC/PPC/PSC), TMT bars, aggregates, tiles, sanitary ware, paints
- Raw material drivers: Limestone, gypsum, clinker, steel prices
- Major hubs: Rajasthan (marble), Gujarat (tiles-Morbi), Maharashtra, Tamil Nadu
- Current dynamics: Housing for All, Smart Cities Mission, RERA impact on quality, green building norms
- Standards: BIS IS 269 (OPC), IS 1489 (PPC), IS 2185 (blocks), IS 1786 (TMT)`,
    'textile': `CATEGORY DEEP KNOWLEDGE - Textiles & Apparel:
- Key segments: Cotton yarn, synthetic fabrics, technical textiles, home textiles, garments
- Raw material drivers: Cotton MSP, polyester (PTA/MEG), viscose staple fiber
- Major hubs: Tirupur (knits), Surat (synthetics), Ludhiana (woolens), Panipat (home textiles)
- Current dynamics: PLI for technical textiles, Mega Textile Parks (PM MITRA), EU deforestation regulations
- HSN codes: 5204-5212 (cotton), 5407-5408 (synthetics), 6101-6117 (garments)`,
    'food': `CATEGORY DEEP KNOWLEDGE - Food & Beverage:
- Key segments: Grains, pulses, spices, processed foods, dairy, edible oils
- Regulations: FSSAI licensing, APEDA for exports, Codex Alimentarius
- Major hubs: Punjab (grains), Kerala/Karnataka (spices), Maharashtra (pulses), Gujarat (groundnuts)
- Current dynamics: PLI for food processing, Mega Food Parks, organic certification growth
- Standards: FSSAI, ISO 22000, HACCP, BRC/IFS for exports`,
    'packaging': `CATEGORY DEEP KNOWLEDGE - Packaging:
- Key segments: Corrugated boxes, flexible packaging, rigid plastics, glass, metal cans
- Raw material drivers: Kraft paper, BOPP film, PET resin, aluminium foil
- Major hubs: Mumbai, Delhi-NCR, Hyderabad, Bengaluru
- Current dynamics: EPR (Extended Producer Responsibility), single-use plastic ban, sustainable packaging demand
- Standards: BIS IS 2771 (corrugated), FSSAI packaging norms, EU packaging directive for exports`,
  };

  for (const [key, insight] of Object.entries(insights)) {
    if (catLower.includes(key)) return insight;
  }

  return `CATEGORY CONTEXT: ${category} industry in ${country}, ${year}. Include specific standards, HSN codes, major manufacturing hubs, and raw material price drivers relevant to this category.`;
}
