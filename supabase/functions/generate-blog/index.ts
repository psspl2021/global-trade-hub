import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type AngleOption = { angle: string; focus: string };
type StructureOption = { name: string; instruction: string };
type ContentIntent = 'forecast' | 'hedging' | 'comparison' | 'cost' | 'supplier' | 'risk' | 'transformation' | 'commodity' | 'generic';
type TopicStrategy = {
  pattern: ContentIntent;
  anchorKeyword: string;
  introInstruction: string;
  titleDirection: string;
  anglePreference: string[];
  preferredStructures: string[];
  detailBrief: string;
  antiDrift: string;
  intentLock: string; // NEW: forces AI to stay on-topic
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

    // === CONTENT MEMORY: fetch recent blogs to avoid repetition ===
    let recentBlogTitles: string[] = [];
    let recentCities: string[] = [];
    try {
      const { data: recentBlogs } = await supabase
        .from('blogs')
        .select('title, content')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (recentBlogs) {
        recentBlogTitles = recentBlogs.map(b => b.title);
        // Extract cities mentioned in recent blogs
        const cityPool = ['Pune', 'Mumbai', 'Chennai', 'Raipur', 'Jamshedpur', 'Ahmedabad', 'Hyderabad', 'Bengaluru', 'Kolkata', 'Ludhiana', 'Coimbatore', 'Vizag', 'Delhi-NCR', 'Rourkela', 'Durgapur', 'Indore', 'Nagpur', 'Surat', 'Rajkot', 'Vadodara'];
        const last3Content = recentBlogs.slice(0, 3).map(b => b.content).join(' ');
        recentCities = cityPool.filter(c => last3Content.includes(c));
      }
    } catch { /* non-fatal */ }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const today = new Date().toISOString().split('T')[0];

    // === LIVE MARKET RESEARCH (internal context only — NOT injected as raw stats) ===
    let priceBenchmarkContext = '';
    let demandHotspots: string[] = [];
    let topSubcategories: string[] = [];
    
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: catSignals } = await supabase
        .from('demand_intelligence_signals')
        .select('country, intent_score, classification, buyer_type, estimated_value, subcategory, industry')
        .ilike('category', `%${category.split('&')[0].trim()}%`)
        .gte('created_at', thirtyDaysAgo)
        .order('intent_score', { ascending: false })
        .limit(30);

      const { data: priceBenchmarks } = await supabase
        .from('category_price_benchmarks')
        .select('subcategory, benchmark_price, unit, currency, region')
        .ilike('category', `%${category.split('&')[0].trim()}%`)
        .limit(10);

      if (catSignals && catSignals.length > 0) {
        demandHotspots = [...new Set(catSignals.map(s => s.country).filter(Boolean))].slice(0, 5);
        topSubcategories = [...new Set(catSignals.map(s => s.subcategory).filter(Boolean))].slice(0, 6);
      }

      if (priceBenchmarks && priceBenchmarks.length > 0) {
        priceBenchmarkContext = `\nREAL PRICE BENCHMARKS (use these as reference ranges, not exact quotes):\n${priceBenchmarks.map(p => `- ${p.subcategory || 'General'}: ${p.currency} ${p.benchmark_price}/${p.unit} (${p.region})`).join('\n')}`;
      }
    } catch (dbErr) {
      console.error('Market research DB error (non-fatal):', dbErr);
    }

    const isBuyerIntent = trade_type === 'Domestic' || trade_type === 'Import';
    const isSupplierIntent = trade_type === 'Export';
    const variationSeed = `${custom_topic || category}|${country}|${trade_type}`;
    const topicStrategy = buildTopicStrategy(custom_topic, category, country, trade_type);

    // === ANGLE SELECTION ===
    const buyerAngles: AngleOption[] = [
      { angle: 'Price Intelligence & Cost Optimization', focus: 'pricing mechanisms, cost breakdown, negotiation leverage' },
      { angle: 'Supply Chain Risk & Supplier Verification', focus: 'risk assessment, red flags, due diligence' },
      { angle: 'Market Outlook & Demand Forecasting', focus: 'forward-looking analysis, demand-supply gaps, timing strategies' },
      { angle: 'Quality Standards & Compliance', focus: 'regulatory landscape, testing, certification' },
      { angle: 'Regional Sourcing & Supplier Mapping', focus: 'manufacturing clusters, regional price differentials, logistics' },
      { angle: 'Total Cost of Ownership', focus: 'beyond unit price — logistics, rejection rates, payment terms, carrying costs' },
      { angle: 'Seasonal Trends & Procurement Timing', focus: 'cyclical patterns, monsoon impact, ordering windows' },
    ];
    
    const supplierAngles: AngleOption[] = [
      { angle: 'Export Market Penetration', focus: 'target markets, buyer expectations, competitive positioning' },
      { angle: 'Global Pricing & Margin', focus: 'FOB/CIF, forex hedging, payment terms' },
      { angle: 'Compliance & Certification', focus: 'destination country standards, market access' },
    ];

    const angles = isSupplierIntent ? supplierAngles : buyerAngles;
    const preferredAngles = angles.filter(({ angle }) => topicStrategy.anglePreference.includes(angle));
    const selectedAngle = pickDeterministicVariant(
      preferredAngles.length > 0 ? preferredAngles : angles,
      variationSeed, 'angle'
    );

    const structureVariants: StructureOption[] = [
      { name: 'problem-first', instruction: 'START with a specific buyer problem. Build tension before solutions.' },
      { name: 'case-study-first', instruction: 'START with a realistic illustrative case study. Walk through their journey, then extract lessons.' },
      { name: 'data-first', instruction: 'START with a striking data point or price movement. Use numbers to frame the narrative.' },
    ];
    const preferredStructures = structureVariants.filter(({ name }) => topicStrategy.preferredStructures.includes(name));
    const selectedStructure = pickDeterministicVariant(
      preferredStructures.length > 0 ? preferredStructures : structureVariants,
      variationSeed, 'structure'
    );

    const tradeContext = getTradeContext(trade_type, category, country);
    const countryRegs = getCountryRegs(country);
    const categoryInsights = getCategorySpecificInsights(category, currentYear, country);
    const topicSpecificInsights = getTopicSpecificInsights(custom_topic, category, country, trade_type);
    const sections = getSectionBlueprint(topicStrategy, selectedAngle, currentMonth, currentQuarter, currentYear, trade_type, demandHotspots, topSubcategories, countryRegs);

    // === SCENARIO BUILDING (with content memory — avoid recent cities) ===
    const seedHash = hashString(variationSeed);
    const allCities = ['Pune', 'Mumbai', 'Chennai', 'Raipur', 'Jamshedpur', 'Ahmedabad', 'Hyderabad', 'Bengaluru', 'Kolkata', 'Ludhiana', 'Coimbatore', 'Vizag', 'Delhi-NCR', 'Rourkela', 'Durgapur', 'Indore', 'Nagpur', 'Surat', 'Rajkot', 'Vadodara'];
    // Filter out cities used in last 3 blogs (content memory)
    const freshCities = allCities.filter(c => !recentCities.includes(c));
    const cityPools = freshCities.length >= 5 ? freshCities : allCities;
    const industryPools = ['construction company', 'mid-size manufacturer', 'EPC contractor', 'infrastructure developer', 'fabrication unit', 'real estate group', 'auto-component maker', 'chemical processor', 'textile mill', 'packaging converter', 'industrial distributor'];
    const selectedCity = cityPools[seedHash % cityPools.length];
    const selectedCity2 = cityPools[(seedHash + 3) % cityPools.length];
    const selectedCity3 = cityPools[(seedHash + 7) % cityPools.length];
    const selectedIndustry = industryPools[(seedHash >> 4) % industryPools.length];
    const product = custom_topic ? custom_topic.replace(/-/g, ' ').replace(/india$/i, '').trim() : category;

    // Intent-specific opening scenario
    const openingScenario = buildOpeningScenario(topicStrategy.pattern, product, selectedCity, seedHash);

    // Content memory context for prompt
    const memoryContext = recentBlogTitles.length > 0
      ? `\nCONTENT MEMORY (AVOID REPETITION):\nRecent blog titles already published:\n${recentBlogTitles.map(t => `- "${t}"`).join('\n')}\n\nDO NOT reuse similar:\n- Opening scenarios\n- Example companies\n- City combinations (avoid: ${recentCities.join(', ') || 'none'})\n- Table structures\n- Concluding phrases\n`
      : '';

    const systemPrompt = `You are NOT a content writer. You are a senior procurement consultant at ProcureSaathi writing a client briefing. Today is ${today}, ${currentMonth} ${currentYear}.

ROLE: Write a HIGHLY SPECIFIC blog that reads like a real procurement intelligence report — NOT like AI-generated marketing content.

${categoryInsights}
${topicSpecificInsights}
${priceBenchmarkContext}
${trending_context ? `TRENDING CONTEXT:\n${trending_context}\n` : ''}
${memoryContext}

INTENT LOCK (CRITICAL — THIS DEFINES THE ENTIRE BLOG):
${topicStrategy.intentLock}

MANDATORY OPENING (STRICT — VIOLATION = REJECTION):
1. Start with THIS scenario: "A ${selectedIndustry} in ${selectedCity} ${openingScenario}."
2. Opening MUST contain ₹ amounts or % figures showing real business impact.
3. Expand into 3-4 sentences that set up the SPECIFIC problem.
4. STRICTLY FORBIDDEN openers (if ANY appear, blog is REJECTED):
   - "In ${currentMonth} ${currentYear}" or any date-first opener
   - "Real-time platform intelligence"
   - "This report explores" / "This article discusses"
   - "In today's" anything
   - "As procurement professionals"
   - Any mention of "demand signals", "intent scores", or "platform data"

ARTICLE STRATEGY:
- Anchor keyword: "${topicStrategy.anchorKeyword}"
- Topic pattern: ${topicStrategy.pattern}
- Structure: "${selectedStructure.name}" — ${selectedStructure.instruction}
- Angle: "${selectedAngle.angle}" — ${selectedAngle.focus}
- Title direction: ${topicStrategy.titleDirection}

CONTENT RULES:
1. Write 1400-1800 words. ZERO filler. Every paragraph must add value.
2. Use THIS STRUCTURE:
${sections}
3. FORCE DEPTH:
   - IS codes (IS 1786, IS 2062) where relevant
   - Raw materials (iron ore, coking coal, billet, sponge iron)
   - Supply hubs (Raipur, Durgapur, Jamshedpur, Ludhiana)
   - HSN codes where applicable
   - Reference DGFT, BIS, PLI schemes, GST implications
4. KEYWORD: Use "${topicStrategy.anchorKeyword}" naturally 6-8 times. NO stuffing.
5. Price RANGES only (e.g., "₹48,000–55,000/MT"), never fake exact numbers.
6. Include 2-3 HTML <table> elements with decision-useful data.
7. Use <h2> for major sections, <h3> for subsections, <ul>/<ol> for lists.
8. Internal links: <a href="/post-rfq">Get AI-Matched Quotes</a>, <a href="/browseproducts">Browse Categories</a>
9. End with "Illustrative Scenario" disclaimer.
10. Output ONLY valid HTML inside a single <article> tag. No markdown. No code fences.
11. Mention cities: ${selectedCity}, ${selectedCity2}, ${selectedCity3}

BUYER DECISION BLOCK (MANDATORY — CRITICAL FOR CONVERSION):
You MUST include a section titled "When Should You Buy [Product] in ${currentYear}?"
Inside this section, create 3 scenarios in a TABLE:
| Scenario | Market Signal | Recommended Action | Risk Level |
| BUY NOW | Prices rising fast / project timeline fixed | Lock rate contract immediately | High if delayed |
| WAIT | Demand slowing / raw materials softening | Monitor for 2-4 weeks | Medium |
| HEDGE | Uncertain market / budget pressure | Split procurement: buy 30% now, 70% later | Low |
After the table, add: "Most buyers lose money not due to high prices, but due to wrong timing."

LOSS VISUALIZATION (MANDATORY — inside or after decision block):
After the decision table, add a LOSS SCENARIO in bold red:
"Delay decision by 30 days → potential increase of ₹2,000–₹4,000/MT. On 500 MT → ₹10–20 lakh additional cost."
This must feel visceral, not neutral. Show the COST OF INACTION.

HEDGING STRATEGY SECTION (MANDATORY):
You MUST include a section on hedging with REAL tactics:
- Rate Contract: lock ₹/MT for 30–60 days with top suppliers
- Split Procurement: buy 30% now at current rates, 70% later based on market movement
- Multi-supplier bidding: force price competition via reverse auction
- Reverse auction timing: run auctions after a price spike when suppliers are desperate for volume
Include 1 numerical example: "On 500 MT, a ₹3,000/MT difference = ₹15 lakh impact on project margin."

INTERACTIVE DECISION HOOK (MANDATORY — mid-blog):
Include AT LEAST ONE direct question to the reader that forces self-assessment:
Example: "How many supplier quotes did you compare last time — 2, 3, or more than 5?"
Followed by: "If it's less than 5, you're not seeing the real market price."
This creates self-realization and drives action.

MICRO-COMMITMENT CTA (MANDATORY — mid-blog, BEFORE final CTA):
Add a LOW-INTENT capture CTA somewhere in the middle of the blog:
"Not ready to run a reverse auction yet? → <a href="/browseproducts">See current market price trends first</a>"
This captures readers who aren't ready for the big CTA yet.

REGRET TRIGGER (MANDATORY — immediately before final CTA):
Add this line BEFORE the final CTA button:
"Most procurement teams realize this after final billing — when cost overruns are already locked."
This creates urgency through anticipated regret.

FINAL CTA (CONVERSION-OPTIMIZED — MANDATORY):
End blog with this EXACT structure:
1. Trust line: "Most buyers realize pricing inefficiencies only after the project is completed — when it's too late to recover margins."
2. Challenge line: "If your last ${product} purchase was based on 2–3 supplier quotes, you are likely overpaying by ₹2,000–₹5,000 per ton."
3. Action line: "Run a reverse auction on ProcureSaathi and see live price competition between verified suppliers."
4. Button: <a href="/post-rfq">Get Lowest Price Now →</a>

LANGUAGE DIVERSITY (CRITICAL):
- Every paragraph MUST use a DIFFERENT sentence structure.
- Mix: short punchy ("The quote looked competitive. It wasn't."), long analytical with data, bullet insights, sharp observations, direct questions to reader.
- NEVER write 3+ sentences starting with "The..." or "This..." or "It..."
- Vary paragraph length: some 2 sentences, some 4-5.
- If 2 consecutive paragraphs sound similar → REWRITE.

STRICTLY FORBIDDEN PHRASES (instant rejection):
- "In today's competitive market"
- "India is growing"  
- "It is important to note"
- "plays a crucial role"
- "In recent years" / "In the ever-evolving landscape"
- "As we navigate" / "Let us explore" / "Let's delve into"
- "This section explains" / "The market shows"
- "16 active demand signals" or any fabricated platform metrics
- Any sentence that could apply to ANY industry without modification

ANTI-DRIFT:
${topicStrategy.antiDrift}

TITLE RULES:
- ${topicStrategy.titleDirection}
- Make it sound like a market intelligence report a procurement head would forward`;

    const userPrompt = custom_topic
      ? `Write a procurement research blog about: "${custom_topic}"\nContext: ${category} industry, ${country} market, ${trade_type} trade.\nFocus: ${tradeContext}\n\nTOPIC BRIEF:\n${topicStrategy.detailBrief}\n\nYear: ${currentYear}. Regulations: ${countryRegs}.`
      : `Write a deep-research procurement blog about ${category} focused on ${tradeContext}\n\nTOPIC BRIEF:\n${topicStrategy.detailBrief}\n\nYear: ${currentYear}. Regulations: ${countryRegs}.`;

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
                title: { type: 'string', description: 'SEO H1 title. 50-70 chars. Must include specific angle and year.' },
                meta_title: { type: 'string', description: 'Meta title for search engines, under 60 characters' },
                meta_description: { type: 'string', description: 'Meta description, 120-160 chars, includes primary keyword and CTA hint' },
                excerpt: { type: 'string', description: 'Blog excerpt, 150-200 chars, compelling summary' },
                content: { type: 'string', description: 'Full blog HTML inside <article> tag. 1400-1800 words. h2/h3, 2-3 tables, lists, internal links, CTA.' },
                seo_keywords: { type: 'string', description: 'Comma-separated SEO keywords (8-12)' },
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
    let blogData = extractBlogFromResponse(aiData);

    // === POST-GENERATION VALIDATOR ===
    let validation = validateBlog(blogData.content, topicStrategy);
    console.log('Blog validation (pass 1):', JSON.stringify(validation));

    // === AUTO-REWRITE LOOP (only for CRITICAL failures — saves ~50% latency) ===
    const criticalIssues = validation.issues.filter(i =>
      i.includes('MISSING: Add') || i.includes('REMOVE')
    );
    if (criticalIssues.length > 0) {
      console.log('Triggering rewrite for issues:', validation.issues);
      const rewritePrompt = `REWRITE INSTRUCTIONS (MANDATORY FIXES):\n${validation.issues.map(i => `- ${i}`).join('\n')}\n\nReturn the FULL corrected HTML blog. Keep everything good, fix only the issues listed above.\n\nOriginal content:\n${blogData.content}`;

      const rewriteResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a procurement content editor. Fix ONLY the listed issues. Return complete HTML inside <article> tags. Do NOT add new problems.' },
            { role: 'user', content: rewritePrompt },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_blog',
              description: 'Return the corrected blog',
              parameters: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'Full corrected blog HTML' },
                },
                required: ['content'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'create_blog' } },
        }),
      });

      if (rewriteResponse.ok) {
        try {
          const rewriteData = await rewriteResponse.json();
          const rewriteCall = rewriteData.choices?.[0]?.message?.tool_calls?.[0];
          if (rewriteCall?.function?.arguments) {
            const rewritten = JSON.parse(rewriteCall.function.arguments);
            if (rewritten.content && rewritten.content.length > blogData.content.length * 0.5) {
              blogData.content = rewritten.content;
              console.log('Rewrite applied successfully');
            }
          }
        } catch (e) {
          console.error('Rewrite parse error (using original):', e);
        }
      }
    }

    // === HARD-INJECT MISSING SECTIONS ===
    blogData.content = enforceRequiredSections(blogData.content, topicStrategy, product, currentYear);

    const slugBase = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 70);
    const slug = `${slugBase}-${trade_type.toLowerCase()}-${country.toLowerCase().replace(/\s+/g, '-')}`;

    // === IMAGE SYSTEM: stable direct Unsplash URLs ===
    const imageIds = getKeywordImageIds(custom_topic || category);
    const coverImageUrl = `https://images.unsplash.com/photo-${imageIds.cover}?w=1200&h=600&fit=crop&auto=format&q=80`;
    const inlineImageUrl1 = `https://images.unsplash.com/photo-${imageIds.inline[0]}?w=800&h=400&fit=crop&auto=format&q=80`;
    const inlineImageUrl2 = `https://images.unsplash.com/photo-${imageIds.inline[1]}?w=800&h=400&fit=crop&auto=format&q=80`;

    const productName = custom_topic ? custom_topic.replace(/-/g, ' ').replace(/india$/i, '').trim() : category;

    // Inject images after first and third <h2>
    let finalContent = blogData.content;
    const h2Matches = [...finalContent.matchAll(/<h2[^>]*>.*?<\/h2>/gi)];

    if (h2Matches.length >= 1) {
      const firstH2 = h2Matches[0];
      const insertPos1 = firstH2.index! + firstH2[0].length;
      const imgTag1 = `\n<figure style="margin:1.5rem 0"><img src="${inlineImageUrl1}" alt="${productName} procurement India" style="width:100%;height:auto;border-radius:8px" loading="lazy" /><figcaption style="text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem">${productName} — sourcing and procurement in India</figcaption></figure>\n`;
      finalContent = finalContent.slice(0, insertPos1) + imgTag1 + finalContent.slice(insertPos1);
    }

    const h2Matches2 = [...finalContent.matchAll(/<h2[^>]*>.*?<\/h2>/gi)];
    if (h2Matches2.length >= 3) {
      const thirdH2 = h2Matches2[2];
      const insertPos2 = thirdH2.index! + thirdH2[0].length;
      const imgTag2 = `\n<figure style="margin:1.5rem 0"><img src="${inlineImageUrl2}" alt="${productName} supply chain India" style="width:100%;height:auto;border-radius:8px" loading="lazy" /><figcaption style="text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem">${productName} — supply chain and quality verification</figcaption></figure>\n`;
      finalContent = finalContent.slice(0, insertPos2) + imgTag2 + finalContent.slice(insertPos2);
    }

    // Clean up
    finalContent = finalContent
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/<p><br\s*\/?>\s*<\/p>/g, '')
      .replace(/(<br\s*\/?>){3,}/g, '<br/>')
      .replace(/\n{3,}/g, '\n\n');

    // Final validation for confidence score
    const finalValidation = validateBlog(finalContent, topicStrategy);

    // === 3. STORE VALIDATION DATA in blog record for analytics ===
    try {
      await supabase.from('blogs').upsert({
        slug,
        title: blogData.title,
        excerpt: blogData.excerpt || '',
        content: finalContent,
        category: category,
        cover_image: coverImageUrl,
        is_published: finalValidation.confidenceScore >= 70,
        published_at: finalValidation.confidenceScore >= 70 ? new Date().toISOString() : null,
      }, { onConflict: 'slug' });

      // Log validation metrics for future optimization
      console.log(`Blog published: ${slug} | Score: ${finalValidation.confidenceScore} | Issues: ${finalValidation.issues.length}`);
    } catch (dbErr) {
      console.error('Blog save error (non-fatal):', dbErr);
    }

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
        intent: isSupplierIntent ? 'supplier' : 'buyer',
        confidence_score: finalValidation.confidenceScore,
        remaining_issues: finalValidation.issues,
        auto_published: finalValidation.confidenceScore >= 70,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-blog error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

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

// === EXTRACT BLOG FROM AI RESPONSE ===
function extractBlogFromResponse(aiData: any): any {
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error('AI did not return structured blog content');
  }
  return JSON.parse(toolCall.function.arguments);
}

// === POST-GENERATION VALIDATOR ===
function validateBlog(content: string, strategy: TopicStrategy): { pass: boolean; issues: string[]; confidenceScore: number } {
  const issues: string[] = [];

  // Check for tables
  if (!/<table/i.test(content)) {
    issues.push('MISSING: Add at least one HTML <table> with decision-useful data (pricing ranges, comparison matrix, or decision framework).');
  }

  // Check for price ranges (₹ figures)
  if (!/₹\s*[\d,]+/.test(content)) {
    issues.push('MISSING: Add ₹ price ranges or cost impact figures. Every procurement blog needs real numbers.');
  }

  // Check for CTA
  if (!/reverse auction/i.test(content)) {
    issues.push('MISSING: End with CTA mentioning "reverse auction" for verified suppliers.');
  }

  // Check for Indian cities (localization)
  if (!/(Mumbai|Chennai|Raipur|Ludhiana|Jamshedpur|Pune|Ahmedabad|Hyderabad|Bengaluru|Kolkata|Delhi|Vizag|Durgapur|Coimbatore)/i.test(content)) {
    issues.push('MISSING: Mention at least 2-3 Indian cities/supply hubs for localization.');
  }

  // Check for banned phrases
  const bannedPhrases = [
    'In today\'s competitive market',
    'It is important to note',
    'plays a crucial role',
    'In the ever-evolving landscape',
    'As we navigate',
    'Let us explore',
    'Let\'s delve into',
  ];
  const found = bannedPhrases.filter(p => content.toLowerCase().includes(p.toLowerCase()));
  if (found.length > 0) {
    issues.push(`REMOVE these generic AI phrases: ${found.map(f => `"${f}"`).join(', ')}. Replace with sharp, specific observations.`);
  }

  // Intent-specific checks
  if (strategy.pattern === 'forecast' && !/forecast|outlook|expected.*range|price.*driver/i.test(content)) {
    issues.push('MISSING: This is a PRICE FORECAST blog. Add forecast section with expected ₹/MT ranges and price drivers.');
  }
  if (strategy.pattern === 'hedging' && !/rate contract|forward buying|staggered|inventory.*plan/i.test(content)) {
    issues.push('MISSING: This is a HEDGING blog. Add specific hedging strategies: rate contracts, forward buying, staggered procurement.');
  }

  // Check for decision block with BUY/WAIT/HEDGE scenarios
  if (!/when.*should.*buy|buying.*decision|decision.*matrix|action.*plan/i.test(content)) {
    issues.push('MISSING: Add a "When Should You Buy" section with BUY NOW / WAIT / HEDGE scenarios in a table.');
  }

  // Check for hedging tactics
  if (!/rate contract|split procurement|staggered|forward buying/i.test(content)) {
    issues.push('MISSING: Add hedging strategy section with rate contracts, split procurement, multi-supplier bidding.');
  }

  // Check for quantified scenario (₹ lakh impact)
  if (!/₹.*lakh|lakh.*impact|₹.*crore/i.test(content)) {
    issues.push('MISSING: Add at least one quantified scenario (e.g., "On 500 MT, ₹3,000 difference = ₹15 lakh impact").');
  }

  // Check for INSIGHT lines (premium quality signal)
  if (!/Most buyers|Smart buyers|hidden cost|what actually matters|real cost|overlooked|don't realize|too late/i.test(content)) {
    issues.push('MISSING: Add sharp procurement insights with psychological triggers (e.g., "Most buyers realize pricing inefficiencies only after the project is completed")');
  }

  // Check for conversion-optimized CTA (not generic)
  if (!/overpaying|lowest price now|live price competition/i.test(content)) {
    issues.push('MISSING: Replace generic CTA with conversion-optimized CTA ("If your last purchase was based on 2-3 quotes, you are likely overpaying...")');
  }

  // Check for RAW MATERIAL depth
  if (!/iron ore|coking coal|billet|sponge iron|clinker|caustic soda|ethylene/i.test(content)) {
    issues.push('MISSING: Add raw material cost drivers (iron ore, coking coal, billet, sponge iron, etc.)');
  }

  // Check for BIS/IS standards
  if (!/IS\s?2062|IS\s?1786|IS\s?3589|ASTM|BIS|EN\s?\d/i.test(content)) {
    issues.push('MISSING: Add BIS/IS standards reference (IS 2062, IS 1786, ASTM, etc.)');
  }

  // Check for HSN codes (commercial clarity)
  if (!/HSN|7208|7213|7304|7306|3917|6811/i.test(content)) {
    issues.push('MISSING: Add HSN codes for commercial clarity (e.g., HSN 7208 for HR coils)');
  }

  // === NEW: DECISION PRESSURE VALIDATORS ===

  // Check for reader question (interactive decision hook)
  if (!/\?\s*<\/p>|how many.*quotes|did you compare|are you comparing|do you know/i.test(content)) {
    issues.push('MISSING: Add at least 1 direct question to the reader (e.g., "How many supplier quotes did you compare last time?"). Forces self-realization.');
  }

  // Check for loss visualization (₹ cost of delay/inaction)
  if (!/delay.*₹|additional cost|cost of inaction|potential increase|₹.*lakh additional/i.test(content)) {
    issues.push('MISSING: Add loss visualization showing ₹ cost of INACTION/DELAY (e.g., "Delay 30 days → ₹10-20 lakh additional cost on 500 MT").');
  }

  // Check for micro-commitment CTA (low-intent capture)
  if (!/not ready|see.*price trends|market price trends first|compare prices first/i.test(content)) {
    issues.push('MISSING: Add micro-commitment CTA for low-intent readers (e.g., "Not ready to run a reverse auction yet? → See current market price trends first").');
  }

  // Check for regret trigger before CTA
  if (!/after final billing|cost overruns.*locked|realize.*too late|when it's too late/i.test(content)) {
    issues.push('MISSING: Add regret trigger before final CTA (e.g., "Most procurement teams realize this after final billing — when cost overruns are already locked").');
  }

  // === TRUST PROOF VALIDATOR ===
  if (!/5–12%|price reduction|without changing suppliers|₹.*lakh saved|savings.*structured/i.test(content)) {
    issues.push('MISSING: Add trust proof block with % savings range and ₹ example (e.g., "ProcureSaathi buyers typically see 5–12% price reduction when supplier competition is structured properly").');
  }

  // === FRICTION REMOVAL VALIDATOR ===
  if (!/no commitment|no platform fees|quotes in 24 hours|no signup required|free to use/i.test(content)) {
    issues.push('MISSING: Add friction removal line below CTA (e.g., "No commitment. No platform fees. Get supplier quotes in 24 hours.").');
  }

  // === SPEED TRIGGER VALIDATOR ===
  if (!/in 24 hours|within 24 hours|24-hour|same-day/i.test(content)) {
    issues.push('MISSING: Add speed trigger in CTA (e.g., "Get Lowest Price in 24 Hours →" instead of generic CTA).');
  }

  const confidenceScore = Math.max(0, 100 - (issues.length * 10));
  return { pass: issues.length === 0, issues, confidenceScore };
}

// === HARD-INJECT MISSING SECTIONS + INTERNAL LINKS + LOSS MOMENT ===
function enforceRequiredSections(content: string, strategy: TopicStrategy, product: string, year: number): string {
  const seedHash = hashString(`${product}|${year}`);
  const cityPools = ['Pune', 'Mumbai', 'Chennai', 'Raipur', 'Jamshedpur', 'Ahmedabad', 'Hyderabad', 'Bengaluru', 'Kolkata', 'Ludhiana'];
  const c1 = cityPools[seedHash % cityPools.length];
  const c2 = cityPools[(seedHash + 3) % cityPools.length];
  const c3 = cityPools[(seedHash + 7) % cityPools.length];

  // === 1. INTERNAL LINK INJECTION (SEO + user flow — max 2 links per phrase) ===
  // First-occurrence-only linking for static phrases
  content = content.replace(
    /Get AI-Matched Quotes/,
    '<a href="/post-rfq" style="color:#16a34a;font-weight:600">Get AI-Matched Quotes</a>'
  );
  content = content.replace(
    /Browse Categories/,
    '<a href="/browseproducts" style="color:#16a34a;font-weight:600">Browse Categories</a>'
  );
  // HTML-safe linking: split by existing <a> tags, only process non-link parts
  let raLinkCount = 0;
  content = content.split(/(<a[^>]*>.*?<\/a>)/gi).map(part => {
    if (part.match(/^<a/i)) return part; // skip existing links
    return part.replace(/reverse auction/gi, (match) => {
      if (raLinkCount < 2) {
        raLinkCount++;
        return `<a href="/post-rfq" style="color:#16a34a;font-weight:600">${match}</a>`;
      }
      return match;
    });
  }).join('');

  // Inject decision block if missing — BUY / WAIT / HEDGE scenarios
  if (!/when.*should.*buy|buying.*timing|decision.*matrix/i.test(content)) {
    const decisionBlock = `
<h2>When Should You Buy ${product} in ${year}?</h2>
<p><strong>Most buyers lose money not due to high prices, but due to wrong timing.</strong> Here's a decision framework:</p>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
<thead><tr style="background:#f3f4f6"><th style="padding:10px;border:1px solid #e5e7eb;text-align:left">Scenario</th><th style="padding:10px;border:1px solid #e5e7eb;text-align:left">Market Signal</th><th style="padding:10px;border:1px solid #e5e7eb;text-align:left">Recommended Action</th><th style="padding:10px;border:1px solid #e5e7eb;text-align:left">Risk Level</th></tr></thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;color:#dc2626">🔴 BUY NOW</td><td style="padding:10px;border:1px solid #e5e7eb">Prices rising 5–8% month-on-month in ${c1}, iron ore trending up</td><td style="padding:10px;border:1px solid #e5e7eb">Lock rate contract for 60 days immediately</td><td style="padding:10px;border:1px solid #e5e7eb">High if you delay — ₹3,000–5,000/MT increase likely</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;color:#ca8a04">🟡 WAIT</td><td style="padding:10px;border:1px solid #e5e7eb">Demand slowing in ${c2}, raw materials softening, inventory buildup at mills</td><td style="padding:10px;border:1px solid #e5e7eb">Monitor for 2–4 weeks, run <a href="/post-rfq" style="color:#16a34a;font-weight:600">reverse auction</a> to test current floor</td><td style="padding:10px;border:1px solid #e5e7eb">Medium — prices may drop ₹1,500–3,000/MT</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;color:#16a34a">🟢 HEDGE</td><td style="padding:10px;border:1px solid #e5e7eb">Uncertain market, budget pressure, multiple projects in pipeline</td><td style="padding:10px;border:1px solid #e5e7eb">Split procurement: buy 30% now at current rates, 70% later based on movement</td><td style="padding:10px;border:1px solid #e5e7eb">Low — limits downside to 30% of volume</td></tr>
</tbody></table>`;

    const ctaIdx = content.lastIndexOf('<div style="margin-top:2rem');
    if (ctaIdx > 0) {
      content = content.slice(0, ctaIdx) + decisionBlock + '\n' + content.slice(ctaIdx);
    } else {
      content = content.replace(/<\/article>/i, decisionBlock + '\n</article>');
    }
  }

  // Inject hedging tactics if missing
  if (!/rate contract.*lock|split procurement|staggered.*procurement/i.test(content)) {
    const hedgingBlock = `
<h2>Hedging Strategies That Actually Work</h2>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
<thead><tr style="background:#f3f4f6"><th style="padding:10px;border:1px solid #e5e7eb">Strategy</th><th style="padding:10px;border:1px solid #e5e7eb">How It Works</th><th style="padding:10px;border:1px solid #e5e7eb">Best When</th></tr></thead>
<tbody>
<tr><td style="padding:10px;border:1px solid #e5e7eb"><strong>Rate Contract</strong></td><td style="padding:10px;border:1px solid #e5e7eb">Lock ₹/MT with supplier for 30–60 days</td><td style="padding:10px;border:1px solid #e5e7eb">Prices are trending up</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb"><strong>Split Procurement</strong></td><td style="padding:10px;border:1px solid #e5e7eb">Buy 30% now, 70% later based on market</td><td style="padding:10px;border:1px solid #e5e7eb">Market direction unclear</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb"><strong>Multi-Supplier Bidding</strong></td><td style="padding:10px;border:1px solid #e5e7eb">Force price competition via <a href="/post-rfq" style="color:#16a34a;font-weight:600">reverse auction</a></td><td style="padding:10px;border:1px solid #e5e7eb">Suppliers quoting high — use competition</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb"><strong>Post-Spike Auction</strong></td><td style="padding:10px;border:1px solid #e5e7eb">Run auction after price spike when suppliers need volume</td><td style="padding:10px;border:1px solid #e5e7eb">After a demand crash or inventory buildup</td></tr>
</tbody></table>
<p><strong>Example:</strong> On 500 MT of ${product}, a ₹3,000/MT difference = <strong>₹15 lakh impact</strong> on your project margin. That's the difference between a profitable project and a breakeven one.</p>`;

    const decisionIdx = content.indexOf('When Should You Buy');
    if (decisionIdx > 0) {
      // Insert before decision block
      content = content.slice(0, decisionIdx).replace(/<h2[^>]*>$/, '') + hedgingBlock + '\n<h2>' + content.slice(decisionIdx);
    } else {
      const ctaIdx = content.lastIndexOf('<div style="margin-top:2rem');
      if (ctaIdx > 0) {
        content = content.slice(0, ctaIdx) + hedgingBlock + '\n' + content.slice(ctaIdx);
      } else {
        content = content.replace(/<\/article>/i, hedgingBlock + '\n</article>');
      }
    }
  }

  // === 2. LOSS MOMENT TRIGGER (buyer psychology — inject before CTA) ===
  if (!/Where Buyers Lose Money|hidden loss|don't realize/i.test(content)) {
    const lossBlock = `
<div style="margin-top:1.5rem;padding:1.25rem;border-left:4px solid #ef4444;background:#fef2f2;border-radius:0 8px 8px 0;">
<h3 style="font-size:1.1rem;font-weight:700;color:#991b1b;margin-bottom:0.75rem;">Where Buyers Lose Money (And Don't Realize It)</h3>
<ul style="margin:0;padding-left:1.25rem;color:#7f1d1d;">
<li><strong>Underweight bundles</strong> → 2–5% hidden loss on every delivery</li>
<li><strong>Freight miscalculation</strong> → ₹2,000–4,000/MT extra when not factored into landed cost</li>
<li><strong>No supplier competition</strong> → suppliers quote 5–12% higher when they know you have no alternative</li>
<li><strong>Spec ambiguity in PO</strong> → grade/size mismatches cost ₹1–3 lakh per rejected lot</li>
</ul>
</div>`;

    const ctaIdx = content.lastIndexOf('<div style="margin-top:2rem');
    if (ctaIdx > 0) {
      content = content.slice(0, ctaIdx) + lossBlock + '\n' + content.slice(ctaIdx);
    } else {
      content = content.replace(/<\/article>/i, lossBlock + '\n</article>');
    }
  }

  // === 3. LOSS VISUALIZATION (visceral cost-of-delay — inject after decision block) ===
  if (!/delay.*₹|additional cost|cost of inaction|potential increase|₹.*lakh additional/i.test(content)) {
    const lossVizBlock = `
<p style="color:#b91c1c;font-weight:600;margin-top:1rem;font-size:1.05rem;">
⚠️ Delay decision by 30 days → potential increase of ₹2,000–₹4,000/MT.<br/>
On 500 MT → <strong>₹10–20 lakh additional cost</strong>. That's margin you'll never recover.
</p>`;
    // Insert after decision table or loss moment block
    const decisionEnd = content.indexOf('wrong timing.');
    if (decisionEnd > 0) {
      const insertAt = content.indexOf('</p>', decisionEnd);
      if (insertAt > 0) {
        content = content.slice(0, insertAt + 4) + lossVizBlock + content.slice(insertAt + 4);
      }
    } else {
      const lossIdx = content.indexOf('Where Buyers Lose Money');
      if (lossIdx > 0) {
        const divEnd = content.indexOf('</div>', lossIdx);
        if (divEnd > 0) {
          content = content.slice(0, divEnd + 6) + lossVizBlock + content.slice(divEnd + 6);
        }
      }
    }
  }

  // === 4. INTERACTIVE DECISION HOOK (reader question — inject mid-blog) ===
  if (!/how many.*quotes|did you compare|are you comparing/i.test(content)) {
    const questionBlock = `
<div style="margin:1.5rem 0;padding:1.25rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
<p style="font-weight:600;font-size:1.05rem;margin-bottom:0.5rem;">How many supplier quotes did you compare last time — 2, 3, or more than 5?</p>
<p style="margin:0;color:#1e3a5f;">If it's less than 5, you're not seeing the real market price. Most procurement teams compare 2–3 quotes and assume they have the best deal. They don't.</p>
</div>`;
    // Insert after second <h2>
    const h2s = [...content.matchAll(/<\/h2>/gi)];
    if (h2s.length >= 2) {
      const pos = h2s[1].index! + h2s[1][0].length;
      // Find next paragraph end
      const nextP = content.indexOf('</p>', pos);
      if (nextP > 0) {
        content = content.slice(0, nextP + 4) + questionBlock + content.slice(nextP + 4);
      }
    }
  }

  // === 5. MICRO-COMMITMENT CTA (low-intent capture — mid-blog) ===
  if (!/not ready.*auction|see.*price trends first|market price trends first/i.test(content)) {
    const microCTA = `
<p style="margin:1.5rem 0;padding:1rem;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
Not ready to run a reverse auction yet? → <a href="/browseproducts" style="color:#16a34a;font-weight:600;">See current market price trends first</a>
</p>`;
    // Insert after third <h2>
    const h2s = [...content.matchAll(/<\/h2>/gi)];
    if (h2s.length >= 3) {
      const pos = h2s[2].index! + h2s[2][0].length;
      const nextP = content.indexOf('</p>', pos);
      if (nextP > 0) {
        content = content.slice(0, nextP + 4) + microCTA + content.slice(nextP + 4);
      }
    }
  }

  // === 6. REGRET TRIGGER (before final CTA) ===
  if (!/after final billing|cost overruns.*locked/i.test(content)) {
    const regretTrigger = `
<p style="font-style:italic;color:#374151;margin-bottom:0.75rem;">Most procurement teams realize this after final billing — when cost overruns are already locked.</p>`;
    // Insert just before the final CTA div
    const ctaIdx = content.lastIndexOf('<div style="margin-top:2rem;padding:1.5rem;border:2px solid');
    if (ctaIdx > 0) {
      content = content.slice(0, ctaIdx) + regretTrigger + content.slice(ctaIdx);
    }
  }

  // Inject CONVERSION-OPTIMIZED CTA with TRUST PROOF + FRICTION REMOVAL + SPEED TRIGGER
  if (!/overpaying|lowest price.*24|live price competition/i.test(content)) {
    // Remove old generic CTA if present
    content = content.replace(/<div style="margin-top:2rem;padding:1\.5rem;border:1px solid #e5e7eb;border-radius:12px;background:#f0fdf4;">[\s\S]*?<\/div>/i, '');
    
    const conversionCTA = `
<div style="margin-top:2rem;padding:1.5rem;border:2px solid #16a34a;border-radius:12px;background:#f0fdf4;">
<p style="font-size:0.95rem;color:#374151;font-style:italic;margin-bottom:0.75rem;">Most buyers realize pricing inefficiencies only after the project is completed — when it's too late to recover margins.</p>
<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.75rem;color:#111827;">Still Comparing Quotes Manually?</h3>
<p style="margin-bottom:0.5rem;">If your last ${product} purchase was based on 2–3 supplier quotes, you are likely <strong>overpaying by ₹2,000–₹5,000 per ton</strong>.</p>
<p style="margin-bottom:0.5rem;font-weight:600;">ProcureSaathi buyers typically see 5–12% price reduction when supplier competition is structured properly. On a ₹50 lakh procurement, that's <strong>₹2.5–6 lakh saved</strong> — without changing suppliers.</p>
<p style="margin-bottom:1rem;">Run a <a href="/post-rfq" style="color:#16a34a;font-weight:600">reverse auction</a> on ProcureSaathi and see <strong>live price competition</strong> between verified suppliers.</p>
<a href="/post-rfq" style="display:inline-block;padding:0.75rem 2rem;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;">Get Lowest Price in 24 Hours →</a>
<p style="font-size:0.85rem;color:#6b7280;margin-top:0.75rem;margin-bottom:0;">No commitment. No platform fees. Get supplier quotes in 24 hours.</p>
</div>`;
    content = content.replace(/<\/article>/i, conversionCTA + '\n</article>');
  }

  // Add disclaimer if missing
  if (!/illustrative/i.test(content)) {
    content = content.replace(/<\/article>/i,
      `\n<p style="font-size:0.8rem;color:#9ca3af;margin-top:2rem;font-style:italic;">Disclaimer: Scenarios, price ranges, and examples are illustrative and based on market patterns. Actual prices vary by spec, quantity, location, and market conditions. Always verify with current supplier quotes.</p>\n</article>`
    );
  }

  return content;
}

// === STABLE IMAGE IDs (direct Unsplash — no redirects) ===
function getKeywordImageIds(keyword: string): { cover: string; inline: string[] } {
  const k = (keyword || '').toLowerCase();

  if (/tmt|rebar/.test(k)) return {
    cover: '1504307651254-35680f356dfd',
    inline: ['1541888946425-d81bb19240f5', '1590574716244-261b09b21bad']
  };
  if (/structural steel|steel beam/.test(k)) return {
    cover: '1587293852726-70cdb56c2866',
    inline: ['1504307651254-35680f356dfd', '1590574716244-261b09b21bad']
  };
  if (/stainless.*pipe|ss pipe/.test(k)) return {
    cover: '1635070041078-e363dbe005cb',
    inline: ['1581094794329-c8112a89af12', '1590574716244-261b09b21bad']
  };
  if (/hr coil|hot rolled/.test(k)) return {
    cover: '1587293852726-70cdb56c2866',
    inline: ['1504307651254-35680f356dfd', '1581094794329-c8112a89af12']
  };
  if (/pvc.*pipe/.test(k)) return {
    cover: '1504328345606-18bbc8c9d7d1',
    inline: ['1581094794329-c8112a89af12', '1590574716244-261b09b21bad']
  };
  if (/cable tray/.test(k)) return {
    cover: '1558618666-fcd25c85f82e',
    inline: ['1581094794329-c8112a89af12', '1590574716244-261b09b21bad']
  };
  if (/cement/.test(k)) return {
    cover: '1590644365607-56a7b277d44c',
    inline: ['1504307651254-35680f356dfd', '1541888946425-d81bb19240f5']
  };
  if (/alumini?um/.test(k)) return {
    cover: '1558618666-fcd25c85f82e',
    inline: ['1581094794329-c8112a89af12', '1504307651254-35680f356dfd']
  };
  if (/steel/.test(k)) return {
    cover: '1504307651254-35680f356dfd',
    inline: ['1587293852726-70cdb56c2866', '1590574716244-261b09b21bad']
  };
  if (/chemical|solvent|acid/.test(k)) return {
    cover: '1532187863486-abf9dbad1b69',
    inline: ['1581093458791-9f3c3250a8b0', '1581094794329-c8112a89af12']
  };
  if (/textile|fabric|yarn/.test(k)) return {
    cover: '1558171813-4c2e8ac4a37a',
    inline: ['1606107557195-0e29a4b5b4aa', '1581094794329-c8112a89af12']
  };
  if (/food|spice|grain/.test(k)) return {
    cover: '1596040033229-a9821ebd058d',
    inline: ['1574323347407-f5e1ad6d020b', '1590574716244-261b09b21bad']
  };
  if (/pipe/.test(k)) return {
    cover: '1581094794329-c8112a89af12',
    inline: ['1635070041078-e363dbe005cb', '1590574716244-261b09b21bad']
  };

  // Default industrial
  return {
    cover: '1590574716244-261b09b21bad',
    inline: ['1504307651254-35680f356dfd', '1581094794329-c8112a89af12']
  };
}

// === KEYWORD → IMAGE QUERY (kept as fallback reference) ===
function getKeywordImageQuery(keyword: string): string {
  const k = (keyword || '').toLowerCase();
  if (/tmt|rebar/.test(k)) return 'tmt bars construction site india';
  if (/structural steel/.test(k)) return 'steel beams construction site';
  if (/stainless.*pipe|ss pipe/.test(k)) return 'stainless steel pipes industrial';
  if (/hr coil|hot rolled/.test(k)) return 'steel coil factory';
  if (/pvc.*pipe/.test(k)) return 'pvc pipes plumbing warehouse';
  if (/cable tray/.test(k)) return 'cable trays electrical industrial';
  if (/cement/.test(k)) return 'cement bags construction site india';
  if (/alumini?um/.test(k)) return 'aluminium ingots factory';
  if (/steel/.test(k)) return 'steel bars warehouse india';
  if (/chemical|solvent|acid/.test(k)) return 'chemical drums industrial warehouse';
  if (/textile|fabric|yarn/.test(k)) return 'textile fabric rolls factory india';
  if (/food|spice|grain/.test(k)) return 'grain warehouse india';
  if (/pipe/.test(k)) return 'industrial pipes storage warehouse';
  return 'industrial procurement warehouse india';
}

// === INTENT-SPECIFIC OPENING SCENARIOS ===
function buildOpeningScenario(intent: ContentIntent, product: string, city: string, seed: number): string {
  const amt = 5 + (seed % 40);
  const pct = 8 + (seed % 20);

  switch (intent) {
    case 'forecast':
      return `saw ${product} prices jump from ₹52,000 to ₹60,000/MT within 6 weeks, increasing project cost by ₹${amt} lakh. With no price-lock strategy in place, the team had no option but to absorb the spike`;
    case 'hedging':
      return `lost ₹${amt} lakh on a single quarter's ${product} procurement because they had no rate contract, no forward buying plan, and were buying spot at peak prices every time`;
    case 'comparison':
      return `was comparing ${product} from two supplier tiers — one quoting ₹${48 + (seed % 8)},000/MT ex-works and another at ₹${52 + (seed % 6)},000/MT delivered — but couldn't figure out which was actually cheaper after freight, GST, and rejection risk`;
    case 'cost':
      return `was paying ${pct}% above market rate for ${product} because their procurement team relied on just 2 suppliers and never ran competitive bidding`;
    case 'supplier':
      return `discovered that 3 out of 5 shortlisted ${product} suppliers had incomplete documentation — no mill test certificates, no valid BIS mark, and no verifiable dispatch history`;
    case 'risk':
      return `rejected an entire ${product} shipment worth ₹${amt} lakh due to grade mismatch — the supplier quoted Fe 500D but delivered Fe 415, and there was no pre-dispatch inspection clause in the PO`;
    case 'transformation':
      return `was spending 14 days per ${product} procurement cycle — 3 days writing specs, 5 days collecting quotes via WhatsApp, 4 days on approvals, and 2 days on PO generation`;
    default:
      return `faced a ${pct}% cost overrun on ${product} procurement after monsoon disrupted logistics from Raipur, and had no backup supplier mapped`;
  }
}

// === INTENT DETECTION (THE CRITICAL FIX) ===
function buildTopicStrategy(customTopic: string, category: string, country: string, tradeType: string): TopicStrategy {
  const anchorKeyword = (customTopic || `${category} procurement ${tradeType.toLowerCase()} ${country}`).trim();
  const topic = anchorKeyword.toLowerCase();
  const commodityNotes = getCommodityTopicNotes(topic, category, country);

  // FORECAST intent
  if (/price forecast|price trend|price outlook|price prediction|price movement/.test(topic)) {
    return {
      pattern: 'forecast',
      anchorKeyword,
      introInstruction: 'Open with a real price spike/drop scenario showing ₹ impact on a buyer.',
      titleDirection: 'Title must include "Price Forecast" or "Price Outlook" with year. NOT a generic sourcing guide.',
      anglePreference: ['Market Outlook & Demand Forecasting', 'Price Intelligence & Cost Optimization', 'Seasonal Trends & Procurement Timing'],
      preferredStructures: ['data-first', 'problem-first'],
      detailBrief: `This is a PRICE FORECAST blog. NOT a general procurement blog.\n\nSTRICTLY INCLUDE:\n1. Price Drivers: iron ore, coking coal, power cost, infrastructure demand, govt policies\n2. Forecast Section: expected ₹/MT ranges for the quarter, what triggers spike vs drop\n3. Historical context: how prices moved in last 2-3 quarters\n4. Supply-side factors: production capacity, imports, China export policy\n5. Demand-side factors: infrastructure projects, housing, manufacturing\n6. Buyer timing recommendations: when to buy, when to wait, when to lock\n\nDO NOT write generic procurement advice. Every section must be about PRICE MOVEMENT.`,
      antiDrift: 'This is a PRICE FORECAST. If any section talks about generic supplier verification, procurement technology, or platform features without connecting it to price movement and buying timing — DELETE IT. Every paragraph must help the reader predict or react to price changes.',
      intentLock: `INTENT: PRICE FORECAST\nThis blog MUST answer: "Where are ${anchorKeyword.replace(/price forecast|price trend/gi, '').trim()} prices heading and what should I do about it?"\n\nMUST INCLUDE:\n- Price drivers (raw materials, demand, policy)\n- ₹/MT forecast ranges\n- What triggers spikes vs drops\n- When to buy vs wait vs lock price\n\nMUST NOT include:\n- Generic supplier discovery advice\n- Platform feature descriptions\n- "Demand signals" or "intent scores"\n- Any section that doesn't connect to PRICE MOVEMENT`,
    };
  }

  // HEDGING intent
  if (/hedge|hedging|price lock|rate contract|forward buying|price protection/.test(topic)) {
    return {
      pattern: 'hedging',
      anchorKeyword,
      introInstruction: 'Open with a buyer who lost money because they had no hedging strategy.',
      titleDirection: 'Title must include hedging/price-lock strategy. NOT a generic sourcing guide.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Market Outlook & Demand Forecasting', 'Total Cost of Ownership'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `This is a HEDGING STRATEGY blog. NOT a general procurement blog.\n\nSTRICTLY INCLUDE:\n1. Why prices spike (raw material volatility, seasonal demand, policy changes)\n2. Hedging strategies:\n   - Rate contracts (6-month, annual)\n   - Bulk/forward buying at current rates\n   - Staggered procurement (split orders across months)\n   - Supplier diversification across regions\n   - Reverse auction timing (buy in low-demand periods)\n   - Inventory buffer planning\n3. When each strategy works best\n4. Cost of NOT hedging (₹ impact examples)\n5. Implementation checklist\n\nDO NOT write about generic procurement. Every section = how to protect against price spikes.`,
      antiDrift: 'This is about HEDGING AND PRICE PROTECTION. If a section discusses generic supplier verification or market overview without connecting to how it helps hedge price risk — DELETE IT.',
      intentLock: `INTENT: HEDGING STRATEGY\nThis blog MUST answer: "How do I protect my business against ${anchorKeyword.replace(/hedge|hedging|how to/gi, '').trim()} price spikes?"\n\nMUST INCLUDE:\n- Rate contracts, bulk locking, staggered procurement\n- Supplier diversification as a hedge\n- Reverse auction timing strategy\n- Inventory planning as buffer\n- ₹ cost of NOT hedging\n\nMUST NOT include:\n- Generic market overviews\n- Platform metric dumps\n- Sections unrelated to price risk management`,
    };
  }

  // COMPARISON
  if (/\b(compare|comparison|vs|versus)\b/.test(topic)) {
    return {
      pattern: 'comparison',
      anchorKeyword,
      introInstruction: 'Open with a real decision: two sourcing approaches producing different outcomes.',
      titleDirection: 'Title like a decision framework or scorecard tied to the keyword.',
      anglePreference: ['Total Cost of Ownership', 'Supply Chain Risk & Supplier Verification'],
      preferredStructures: ['data-first', 'problem-first'],
      detailBrief: `Build apples-to-apples comparison: price, freight, lead time, quality risk, payment terms.\nInclude weighted decision matrix. Explain when each option wins.`,
      antiDrift: 'Keep returning to comparison criteria and trade-offs. No generic explainers.',
      intentLock: `INTENT: COMPARISON\nThis blog MUST help the reader CHOOSE between two options.\nEvery section must compare, not describe generically.`,
    };
  }

  // COST
  if (/reduce procurement cost|cost saving|lowest.*price|bulk buying|negotiation/.test(topic)) {
    return {
      pattern: 'cost',
      anchorKeyword,
      introInstruction: 'Open with a margin-pressure scenario or a quote stack that looks competitive but is not.',
      titleDirection: 'Title like a cost-reduction playbook for the keyword.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Total Cost of Ownership'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `Focus on total landed cost, quote normalization, supplier competition, payment terms, freight, spec discipline.\nShow 3-5 concrete cost levers with ₹ impact.`,
      antiDrift: 'Keep about savings mechanics. No generic product-market narration.',
      intentLock: `INTENT: COST OPTIMIZATION\nEvery section must show HOW to save money. No generic market descriptions.`,
    };
  }

  // SUPPLIER
  if (/verified suppliers|find .*suppliers?|source raw materials/.test(topic)) {
    return {
      pattern: 'supplier',
      anchorKeyword,
      introInstruction: 'Open with a supplier discovery failure.',
      titleDirection: 'Title like a supplier-verification brief for the keyword.',
      anglePreference: ['Supply Chain Risk & Supplier Verification', 'Regional Sourcing & Supplier Mapping'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `Focus on verification: GST, plant address, dispatch proof, certifications, reference calls, samples.\nInclude supplier scorecard table.`,
      antiDrift: 'Stay on supplier discovery and verification. No category-level filler.',
      intentLock: `INTENT: SUPPLIER DISCOVERY\nEvery section must help the reader FIND and VERIFY suppliers.`,
    };
  }

  // RISK
  if (/mistakes|challenges|dependency|risk/.test(topic)) {
    return {
      pattern: 'risk',
      anchorKeyword,
      introInstruction: 'Open with a broken buying pattern that caused real damage.',
      titleDirection: 'Title like a failure analysis or buyer operating memo.',
      anglePreference: ['Supply Chain Risk & Supplier Verification', 'Quality Standards & Compliance'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `Diagnose impact of vague specs, supplier concentration, weak verification, quote incomparability.\nUse risk heatmap or issue-priority matrix.`,
      antiDrift: 'Keep surfacing failure modes and controls. No motivational content.',
      intentLock: `INTENT: RISK ANALYSIS\nEvery section must identify a risk and its commercial impact + control.`,
    };
  }

  // TRANSFORMATION
  if (/reverse auction|auction|automation|digital procurement|strategic sourcing|process|benefits|strategies/.test(topic)) {
    return {
      pattern: 'transformation',
      anchorKeyword,
      introInstruction: 'Open with a slow, manual procurement workflow causing missed savings.',
      titleDirection: 'Title like an operating model brief for the keyword.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Total Cost of Ownership'],
      preferredStructures: ['problem-first', 'case-study-first'],
      detailBrief: `Focus on workflow design, RFQ standardization, supplier scoring, approval logic.\nInclude before-vs-after table.`,
      antiDrift: 'Stay on workflow and execution. No vague thought-leadership.',
      intentLock: `INTENT: PROCESS TRANSFORMATION\nEvery section must show the old vs new way of buying.`,
    };
  }

  // COMMODITY
  if (commodityNotes || /\b(tmt|rebar|steel|pipe|cement|coil|ingot|bars?|pvc|polymer|solvent|fabric|mineral)\b/.test(topic)) {
    return {
      pattern: 'commodity',
      anchorKeyword,
      introInstruction: 'Open with a concrete market signal, buying trigger, or spec-selection decision.',
      titleDirection: 'Title like a product-specific commercial brief or market intelligence note.',
      anglePreference: ['Price Intelligence & Cost Optimization', 'Regional Sourcing & Supplier Mapping', 'Quality Standards & Compliance'],
      preferredStructures: ['data-first', 'case-study-first'],
      detailBrief: commodityNotes || `Keep centered on the exact product. Explain specs, pricing variables, compliance, sourcing regions.`,
      antiDrift: 'Do not drift into adjacent products. Category context should support the exact product keyword.',
      intentLock: `INTENT: COMMODITY INTELLIGENCE\nThis blog is about "${anchorKeyword}" specifically.\nEvery section must be about THIS product's specs, prices, suppliers, and buying decisions.\nDo NOT write generic procurement advice that could apply to any commodity.`,
    };
  }

  // GENERIC fallback
  return {
    pattern: 'generic',
    anchorKeyword,
    introInstruction: 'Open with a concrete buyer decision tied to the keyword.',
    titleDirection: 'Title like a commercial buyer brief, not a generic template.',
    anglePreference: ['Price Intelligence & Cost Optimization', 'Supply Chain Risk & Supplier Verification'],
    preferredStructures: ['problem-first', 'data-first'],
    detailBrief: `Keep every section tightly aligned to "${anchorKeyword}". Avoid sections reusable for other keywords.`,
    antiDrift: 'Every section must feel impossible to reuse for another keyword without rewriting.',
    intentLock: `INTENT: "${anchorKeyword}"\nEvery section must directly address this topic. No generic filler.`,
  };
}

function getTopicSpecificInsights(customTopic: string, category: string, country: string, tradeType: string): string {
  const topic = (customTopic || '').toLowerCase();
  if (!topic) return '';
  const commodityNotes = getCommodityTopicNotes(topic, category, country);
  if (commodityNotes) return commodityNotes;
  return '';
}

function getCommodityTopicNotes(topic: string, category: string, country: string): string {
  if (/(tmt|rebar)/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - TMT Bars:\n- BIS IS 1786 grades: Fe 500, Fe 500D, Fe 550, Fe 550D. Sizes: 8mm–25mm.\n- Buyers check: bundle weight, elongation, bend/rebend, mill test certificates, primary vs secondary mill.\n- Sourcing belts: Raipur/Durg, Jalna, Rourkela, Visakhapatnam.\n- Price drivers: billet/sponge iron, scrap, power tariffs, freight, monsoon cycles.\n- Red flags: fake ISI marks, underweight bundles, vague grade declarations, missing test reports.`;
  }
  if (/structural steel/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Structural Steel:\n- IS 2062 grades: E250, E350. Sections: beams, channels, angles, plates, fabricated assemblies.\n- Variables: section weight accuracy, cut-to-length losses, primer, delivery sequencing.\n- Price drivers: iron ore, coking coal, import duties, infrastructure demand cycles.`;
  }
  if (/stainless.*pipe|ss pipe/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - SS Pipes:\n- Grades: 202, 304, 316. Welded vs seamless. OD/wall-thickness tolerance, schedule requirements.\n- Price shaped by nickel surcharge, thickness tolerance, polishing, documentation for food/pharma/utility.`;
  }
  if (/(hr coil|hot rolled)/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - HR Coil:\n- Thickness/width bands, yield/tensile requirements, pickled vs non-pickled.\n- Gauge tolerance, slit-width accuracy, surface quality, decoiling/slitting services.`;
  }
  if (/pvc.*pipe/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - PVC Pipes:\n- UPVC pressure pipes, SWR pipes. Pressure class, wall thickness, socket quality, fitting compatibility.\n- Compare leak risk, fitting availability, landed project cost — not pipe price alone.`;
  }
  if (/cement/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Cement:\n- OPC 43, OPC 53, PPC, PSC. Based on structural use, curing conditions, project timelines.\n- Compare freshness, bag vs bulk, freight-to-site, consistency — not headline bag price.`;
  }
  if (/alumini?um/.test(topic)) {
    return `TOPIC DEEP KNOWLEDGE - Aluminium:\n- Primary vs secondary ingots, purity/alloy expectations, foundry-grade supply.\n- Price: LME aluminium, regional premium, power cost, scrap availability.`;
  }
  if (/steel/.test(topic) || category.toLowerCase().includes('steel')) {
    return `TOPIC DEEP KNOWLEDGE - Steel:\n- Anchor on exact steel family: long products, structural sections, flat products, tubes/pipes, stainless grades.\n- Cover only raw-material and commercial drivers relevant to that family.`;
  }
  return '';
}

function getSectionBlueprint(
  strategy: TopicStrategy, selectedAngle: AngleOption,
  currentMonth: string, currentQuarter: string, currentYear: number,
  tradeType: string, demandHotspots: string[], topSubcategories: string[], countryRegs: string
): string {
  const hotspotText = demandHotspots.length > 0 ? demandHotspots.join(', ') : 'key Indian regions';

  // Intent-specific blueprints
  if (strategy.pattern === 'forecast') {
    return `   a) Business Impact Scenario (opening — ₹ loss from price spike)
   b) Price Drivers Analysis — iron ore, coking coal, power costs, demand factors, government policies
   c) Price Benchmark Table — <table> with product/grade, current ₹/MT range, expected direction, key trigger
   d) ${currentQuarter} ${currentYear} Forecast — expected price range, what pushes up vs down
   e) Buyer Decision Table (MANDATORY) — "When Should You Buy?" with BUY NOW / WAIT / HEDGE scenarios, market signals, actions, risk levels
   f) Hedging Strategies (MANDATORY) — rate contracts, split procurement, multi-supplier bidding, post-spike auctions. Include ₹ lakh impact example.
   g) Conversion CTA: "If your last purchase was based on 2–3 quotes, you are likely overpaying..." + "Get Lowest Price Now" button`;
  }

  if (strategy.pattern === 'hedging') {
    return `   a) Business Impact Scenario (opening — ₹ loss from no hedging)
   b) Why Prices Spike — raw materials, seasonal demand, policy changes, supply disruptions
   c) Hedging Strategy Matrix — <table> with strategy, how it works, best when, expected savings
   d) Rate Contracts Deep-Dive — how to negotiate, typical terms, lock-in periods
   e) Split Procurement — buy 30% now, 70% later. Include example: "On 500 MT, ₹3,000 difference = ₹15 lakh impact"
   f) Buyer Decision Table (MANDATORY) — "When Should You Buy?" with BUY NOW / WAIT / HEDGE scenarios
   g) Reverse Auction as a Hedge — using competition to lock lower prices after price spikes
   h) Conversion CTA: "Most buyers realize pricing inefficiencies only after the project is completed..." + "Get Lowest Price Now" button`;
  }

  if (tradeType === 'Export') {
    return `   a) Export demand brief (${currentQuarter} ${currentYear}) — buyer signals, priority markets
   b) Destination Matrix — <table> with destination, buyer type, compliance, pricing
   c) FOB/CIF Pricing Logic — margin analysis, payment terms
   d) ${selectedAngle.angle} — ${selectedAngle.focus}
   e) Compliance & Documentation — ${countryRegs}
   f) Supplier Action Plan
   g) CTA: "Register as a Verified Supplier on ProcureSaathi"`;
  }

  switch (strategy.pattern) {
    case 'commodity':
      return `   a) Market Brief — one concrete demand or pricing signal
   b) Spec & Commercial Lock-In — grades, dimensions, certifications, quantity slabs
   c) Benchmark Pricing — <table> with spec, ₹ price range, unit, price driver
   d) Regional Sourcing Map — clusters, lead times, ${hotspotText}
   e) ${selectedAngle.angle} — ${selectedAngle.focus}
   f) Buyer Decision Table (MANDATORY) — "When Should You Buy?" with BUY NOW / WAIT / HEDGE scenarios
   g) Hedging Strategies (MANDATORY) — rate contracts, split procurement, ₹ lakh impact example
   h) Conversion CTA: "If your last purchase was based on 2–3 quotes, you are likely overpaying..." + "Get Lowest Price Now"`;
    case 'cost':
      return `   a) Where Cost Leaks Begin — common traps
   b) Savings Model — <table> with cost levers, likely impact, dependency
   c) Negotiate, Consolidate, or Run Competition?
   d) Quote Normalization — freight, payment terms, taxes, MOQ
   e) ${selectedAngle.angle} — ${selectedAngle.focus}
   f) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE with ₹ impact
   g) Hedging Strategies — rate contracts, split procurement, multi-supplier bidding
   h) Conversion CTA: "Most buyers realize pricing inefficiencies only after the project is completed..." + "Get Lowest Price Now"`;
    case 'comparison':
      return `   a) The Decision Context — what the buyer is choosing between
   b) Comparison Matrix — <table> with options, cost, lead time, quality risk
   c) Where Price-Only Comparisons Fail
   d) ${selectedAngle.angle} — ${selectedAngle.focus}
   e) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE scenarios
   f) Hedging Strategies — when to lock, when to split, ₹ lakh example
   g) Conversion CTA: "Get Lowest Price Now"`;
    case 'supplier':
      return `   a) Why Supplier Discovery Fails
   b) Verification Scorecard — <table> with documents, checks, red flags
   c) Regional Supplier Map — where serious suppliers concentrate
   d) ${selectedAngle.angle} — ${selectedAngle.focus}
   e) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE
   f) Hedging via Supplier Diversification — multi-source bidding, rate contracts
   g) Conversion CTA: "Get Lowest Price Now"`;
    case 'risk':
      return `   a) The Failure Pattern — core risk in commercial terms
   b) Risk Heatmap — <table> with issue, probability, impact, control
   c) What It Costs the Buyer — margin, cash flow, lead-time impact
   d) ${selectedAngle.angle} — ${selectedAngle.focus}
   e) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE with risk levels
   f) Hedging as Risk Control — rate contracts, split procurement, ₹ lakh example
   g) Conversion CTA: "Get Lowest Price Now"`;
    case 'transformation':
      return `   a) Why the Old Workflow Breaks — manual bottlenecks
   b) Better Buying Workflow — future-state process
   c) Operating Model — <table> old vs new by speed, visibility, control
   d) ${selectedAngle.angle} — ${selectedAngle.focus}
   e) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE
   f) Hedging Strategies — rate contracts, split procurement, reverse auction timing
   g) Conversion CTA: "Get Lowest Price Now"`;
    default:
      return `   a) Commercial Context — concrete signal tied to keyword
   b) Benchmark Table — <table> with decision-useful data
   c) ${selectedAngle.angle} — ${selectedAngle.focus}
   d) Buyer Decision Table (MANDATORY) — BUY NOW / WAIT / HEDGE scenarios
   e) Hedging Strategies — rate contracts, split procurement, ₹ impact example
   f) Conversion CTA: "Most buyers realize pricing inefficiencies only after the project is completed..." + "Get Lowest Price Now"`;
  }
}

function getTradeContext(tradeType: string, category: string, country: string): string {
  if (tradeType === 'Export') return `exporting ${category} FROM ${country}. Cover DGFT policies, FOB/CIF, documentation, destination standards.`;
  if (tradeType === 'Import') return `importing ${category} INTO ${country}. Cover customs duty, HS codes, landed cost, quality inspection.`;
  return `domestic procurement of ${category} within ${country}. Cover regional hubs, BIS/ISI standards, GST/HSN, MOQs, lead times.`;
}

function getCountryRegs(country: string): string {
  const regs: Record<string, string> = {
    'India': 'BIS standards, FSSAI (food), GST/HSN, Make in India, PLI schemes',
    'UAE': 'ESMA standards, VAT at 5%, free zone regulations',
    'USA': 'ASTM/ANSI, FDA (food/pharma), EPA, Buy American Act',
  };
  return regs[country] || `local standards and trade regulations in ${country}`;
}

function getCategorySpecificInsights(category: string, year: number, country: string): string {
  const catLower = category.toLowerCase();
  const insights: Record<string, string> = {
    'steel': `CATEGORY KNOWLEDGE - Steel & Metals:\n- Grades: IS 2062 (structural), IS 1786 (TMT), SS 304/316, MS ERW/seamless pipes\n- Raw materials: Iron ore (Odisha/Karnataka), coking coal (imported), nickel (LME), zinc\n- Hubs: Jamshedpur, Raipur, Ludhiana, Ahmedabad, Visakhapatnam\n- Dynamics: PLI for specialty steel, BIS certification expansion, China export rebate changes\n- HSN: 7208 (flat-rolled), 7213 (bars/rods), 7304 (seamless pipes)`,
    'chemical': `CATEGORY KNOWLEDGE - Chemicals:\n- Segments: Basic, specialty, agrochemicals, dyes, solvents\n- Raw materials: Crude oil, natural gas, ethylene, propylene\n- Hubs: GIDC Gujarat, MIDC Maharashtra, Vizag, Chennai-Manali\n- HSN: 2801-2853 (inorganic), 2901-2942 (organic)`,
    'construction': `CATEGORY KNOWLEDGE - Construction Materials:\n- Products: Cement (OPC/PPC/PSC), TMT bars, aggregates, tiles\n- Raw materials: Limestone, gypsum, clinker, steel\n- Standards: BIS IS 269 (OPC), IS 1489 (PPC), IS 1786 (TMT)`,
  };
  for (const [key, insight] of Object.entries(insights)) {
    if (catLower.includes(key)) return insight;
  }
  return `CATEGORY: ${category} in ${country}, ${year}. Include specific standards, HSN codes, hubs, and raw material drivers.`;
}
