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

    // === RANDOMIZED ANGLE SELECTION for variety ===
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
    const selectedAngle = angles[Math.floor(Math.random() * angles.length)];

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

    // Dynamic sections based on selected angle
    const buyerSections = `
PRIMARY ANGLE: "${selectedAngle.angle}" — ${selectedAngle.focus}

MANDATORY BLOG SECTIONS (adapt to the primary angle):
1. "${category} Market Intelligence: ${currentMonth} ${currentYear} Snapshot" — current supply-demand dynamics, capacity utilization, raw material input cost trends. Use REAL data from market intelligence above.
2. "Price Analysis: ${currentQuarter} ${currentYear} Benchmarks" — price RANGES by grade/variant/specification in a detailed <table> with columns for Product/Grade, Price Range, Unit, and Key Driver. Include ${topSubcategories.length > 0 ? `specific subcategories: ${topSubcategories.join(', ')}` : 'major subcategories'}.
3. "${selectedAngle.angle}" — the PRIMARY deep-dive section. This should be the most detailed section (400+ words). ${selectedAngle.focus}.
4. "Regulatory & Compliance Framework" — ${countryRegs}, testing/certification requirements, recent policy changes affecting ${category}
5. "${trade_type === 'Import' ? 'Import Duty Structure & Landed Cost Calculator' : 'Regional Sourcing Map: Where to Buy'}" — specific to trade type. Include a <table> with duty rates or regional comparison.
6. "Demand Signals: What the Data Shows" — reference REAL platform intelligence data. Which subcategories are trending? Which buyer segments are most active? ${demandHotspots.length > 0 ? `Highlight demand from: ${demandHotspots.join(', ')}` : ''}
7. "Procurement Strategy: ${currentYear} Action Plan" — numbered actionable steps specific to ${category}, not generic advice
8. CTA section with link to /post-rfq — "Get AI-matched quotes from verified ${category} suppliers"`;

    const supplierSections = `
PRIMARY ANGLE: "${selectedAngle.angle}" — ${selectedAngle.focus}

MANDATORY BLOG SECTIONS (adapt to the primary angle):
1. "Global ${category} Demand: ${currentQuarter} ${currentYear} Analysis" — which countries are buying, volume trends, emerging markets. Use REAL demand signal data.
2. "${selectedAngle.angle}" — PRIMARY deep-dive (400+ words). ${selectedAngle.focus}.
3. "Export Pricing Strategy: FOB/CIF Benchmarks" — detailed <table> with pricing by destination, Incoterms comparison
4. "Compliance Roadmap for ${category} Exporters" — ${countryRegs}, destination country requirements, certification timeline
5. "Buyer Profiles: Who's Buying ${category} Internationally" — ${buyerTypes.length > 0 ? `Active buyer types: ${buyerTypes.join(', ')}` : 'buyer segmentation'}. ${industrySegments.length > 0 ? `Industry verticals: ${industrySegments.join(', ')}` : ''}
6. "Documentation & Logistics Optimization" — shipping routes, documentation checklist, port infrastructure
7. "Supplier Growth Checklist: ${currentYear}" — numbered actionable steps
8. CTA section → "Register as a Verified Supplier on ProcureSaathi" with link to /signup?type=supplier`;

    const sections = isSupplierIntent ? supplierSections : buyerSections;

    const systemPrompt = `You are a senior B2B procurement research analyst at ProcureSaathi, an AI-powered procurement platform. Today is ${today}, ${currentMonth} ${currentYear}.

ROLE: You write data-driven, UNIQUE market analysis blogs. Each blog must feel like a fresh analyst report, not a template. You have access to REAL-TIME platform demand intelligence.

${marketResearchContext}

${trending_context ? `TRENDING MARKET CONTEXT (from platform intelligence):\n${trending_context}\n` : ''}

${categoryInsights}

CONTENT RULES:
- Write 1500-2000 words of SUBSTANTIVE, data-rich content. Zero filler sentences.
- UNIQUE ANGLE: This blog's primary angle is "${selectedAngle.angle}". Make this the centerpiece. Go deep, not broad.
- Use price RANGES (e.g., "₹48,000–55,000/MT"), never fabricated exact numbers.
- Reference REAL standards: BIS IS-2062, ISO 9001, ASTM A36, DGFT notifications, HS codes, etc.
- Include 2-3 HTML <table> elements for price comparisons, duty structures, or feature matrices.
- Use <h2> for major sections, <h3> for subsections, <ul>/<ol> for lists.
- Internal links: <a href="/post-rfq">Get AI-Matched Quotes</a>, <a href="/browseproducts">Browse Categories</a>
- End with "Illustrative Scenario" disclaimer and "AI Demand-Feed Notice".
- Output ONLY valid HTML inside a single <article> tag. No markdown. No code fences.
- NEVER use empty paragraphs, excessive <br> tags, or spacer divs.
- Every <h2> section must have at least 2 substantive paragraphs with concrete details.
- Weave live demand data naturally: "Platform intelligence for ${currentMonth} ${currentYear} shows..." or "Our AI demand engine has detected..."
- Include specific HS codes, BIS numbers, ASTM grades where relevant to ${category}.
- Mention specific raw material inputs and their price impact on ${category}.

UNIQUENESS RULES:
- DO NOT start with a generic "India's X industry is growing" opener. Start with a specific data point, market event, or buyer challenge.
- Each section must contain at least one SPECIFIC fact (a standard number, HS code, price benchmark, policy name, or geographic detail).
- Avoid phrases: "In today's competitive market", "In recent years", "It is important to note", "plays a crucial role".
- Use active voice. Write like a procurement consultant briefing a client.

TITLE RULES:
- NEVER use the format "X Procurement in Y: Sourcing Guide YEAR"
- Title MUST reflect the specific angle: "${selectedAngle.angle}"
- Include: category name, the angle, and ${currentYear}
- Make it sound like a market intelligence report, not a how-to guide`;

    const userPrompt = custom_topic
      ? `Write a procurement research blog about: "${custom_topic}"

Context: ${category} industry, ${country} market, ${trade_type} trade type.
Focus: ${tradeContext}

Include these sections adapted to the custom topic:
${sections}

Year: ${currentYear}. Regulations: ${countryRegs}.`
      : `Write a deep-research procurement blog about ${category} focused on ${tradeContext}

${sections}

TITLE APPROACH (create your own unique title reflecting the "${selectedAngle.angle}" angle):
Examples of GOOD titles (don't copy, create your own):
- "${category} ${selectedAngle.angle} in ${country}: ${currentQuarter} ${currentYear} Analysis"
- "${currentYear} ${category} ${isBuyerIntent ? 'Buyer' : 'Supplier'} Intelligence: ${selectedAngle.angle}"
- "${category} in ${country}: ${selectedAngle.angle} Report (${currentMonth} ${currentYear})"

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

    // Image system: use reliable direct Unsplash photo URLs
    const categoryImages = getCategoryImagePool(category);
    const coverImageUrl = `https://images.unsplash.com/photo-${categoryImages.cover}?w=1200&h=600&fit=crop&auto=format&q=80`;
    
    const inlineImageUrls = categoryImages.inline.map(id =>
      `https://images.unsplash.com/photo-${id}?w=800&h=400&fit=crop&auto=format&q=80`
    );
    const imageCaptions = getImageCaptions(category, country, trade_type);

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

// Reliable Unsplash photo IDs (verified working) organized by category
function getCategoryImagePool(category: string): { cover: string; inline: string[] } {
  const catLower = category.toLowerCase();
  
  const pools: Record<string, { cover: string; inline: string[] }> = {
    'steel': {
      cover: '1504328345606-18bbc8c9d7d1',
      inline: [
        '1587293852726-4724c26728f3', // steel factory
        '1565193566173-7a0ee3dbe261', // metal warehouse  
        '1581091226825-a6a2a5aee158', // industrial manufacturing
        '1565008576549-57569a49371d', // steel structure
        '1558618666-fcd25c85f82e',    // industrial pipes
      ]
    },
    'chemical': {
      cover: '1532187863486-abf9dbad1b69',
      inline: [
        '1581091226825-a6a2a5aee158', // chemical plant
        '1532187863486-abf9dbad1b69', // laboratory
        '1585435557343-3b092031a831', // chemical storage
        '1581093458791-9f3c3250a8d0', // industrial facility
        '1587293852726-4724c26728f3', // manufacturing
      ]
    },
    'construction': {
      cover: '1504307651254-35680f356dfd',
      inline: [
        '1541888946425-d81bb19240f5', // construction site
        '1504307651254-35680f356dfd', // building construction
        '1581091226825-a6a2a5aee158', // cement/materials
        '1565008576549-57569a49371d', // structural work
        '1587293852726-4724c26728f3', // heavy equipment
      ]
    },
    'textile': {
      cover: '1558171813-4c2e8f2ad057',
      inline: [
        '1558171813-4c2e8f2ad057', // textile rolls
        '1586528116311-ad8dd3c8310d', // fabric production
        '1581091226825-a6a2a5aee158', // manufacturing
        '1565193566173-7a0ee3dbe261', // warehouse
        '1558618666-fcd25c85f82e',    // industrial
      ]
    },
    'food': {
      cover: '1556909114-f6e7ad7d3136',
      inline: [
        '1556909114-f6e7ad7d3136', // food processing
        '1500595046743-cd271d694d30', // agriculture
        '1596040033229-a9821ebd058d', // spices/ingredients
        '1586528116311-ad8dd3c8310d', // packaging
        '1565193566173-7a0ee3dbe261', // cold storage
      ]
    },
    'agriculture': {
      cover: '1500595046743-cd271d694d30',
      inline: [
        '1500595046743-cd271d694d30', // farming
        '1556909114-f6e7ad7d3136', // produce
        '1596040033229-a9821ebd058d', // harvest
        '1586528116311-ad8dd3c8310d', // packaging
        '1565193566173-7a0ee3dbe261', // warehouse
      ]
    },
    'packaging': {
      cover: '1586528116311-ad8dd3c8310d',
      inline: [
        '1586528116311-ad8dd3c8310d', // packaging materials
        '1565193566173-7a0ee3dbe261', // warehouse
        '1581091226825-a6a2a5aee158', // manufacturing
        '1558618666-fcd25c85f82e',    // industrial
        '1587293852726-4724c26728f3', // factory
      ]
    },
    'auto': {
      cover: '1581091226825-a6a2a5aee158',
      inline: [
        '1581091226825-a6a2a5aee158', // automotive
        '1565008576549-57569a49371d', // auto parts
        '1587293852726-4724c26728f3', // assembly
        '1558618666-fcd25c85f82e',    // components
        '1504328345606-18bbc8c9d7d1', // metal parts
      ]
    },
    'electrical': {
      cover: '1581091226825-a6a2a5aee158',
      inline: [
        '1581091226825-a6a2a5aee158', // electronics
        '1558618666-fcd25c85f82e',    // wiring
        '1587293852726-4724c26728f3', // manufacturing
        '1565193566173-7a0ee3dbe261', // components warehouse
        '1504328345606-18bbc8c9d7d1', // industrial
      ]
    },
    'plastic': {
      cover: '1558618666-fcd25c85f82e',
      inline: [
        '1558618666-fcd25c85f82e',    // polymer/plastic
        '1581091226825-a6a2a5aee158', // manufacturing
        '1586528116311-ad8dd3c8310d', // products
        '1587293852726-4724c26728f3', // factory
        '1565193566173-7a0ee3dbe261', // warehouse
      ]
    },
    'mineral': {
      cover: '1518611012118-696072aa579a',
      inline: [
        '1518611012118-696072aa579a', // mining
        '1504328345606-18bbc8c9d7d1', // minerals
        '1587293852726-4724c26728f3', // processing
        '1565008576549-57569a49371d', // extraction
        '1581091226825-a6a2a5aee158', // industrial
      ]
    },
  };

  // Match category to pool
  for (const [key, pool] of Object.entries(pools)) {
    if (catLower.includes(key)) return pool;
  }

  // Default industrial pool
  return {
    cover: '1581091226825-a6a2a5aee158',
    inline: [
      '1587293852726-4724c26728f3',
      '1565193566173-7a0ee3dbe261',
      '1558618666-fcd25c85f82e',
      '1504328345606-18bbc8c9d7d1',
      '1586528116311-ad8dd3c8310d',
    ]
  };
}

function getImageCaptions(category: string, country: string, tradeType: string): string[] {
  return [
    `${category} manufacturing facility - ProcureSaathi procurement insights`,
    `${category} supply chain warehouse - ProcureSaathi`,
    `${category} quality inspection process`,
    `B2B ${tradeType.toLowerCase()} logistics for ${category} - ${country}`,
    `${category} raw materials and inventory management`,
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
