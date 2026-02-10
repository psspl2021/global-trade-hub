import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    console.log('generate-blog called with:', { category, country, trade_type, custom_topic });

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

    const currentYear = new Date().getFullYear();

    // Intent detection
    const isBuyerIntent = trade_type === 'Domestic' || trade_type === 'Import';
    const isSupplierIntent = trade_type === 'Export';

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

    // Intent-specific sections
    const buyerSections = `
MANDATORY BLOG SECTIONS (in this order):
1. "Market Situation: ${category} in ${country} (${currentYear})" — supply-demand, capacity utilization, raw material trends
2. "Price Benchmarks & Cost Drivers" — price RANGES by grade/variant in a <table>, seasonal patterns, what drives price changes
3. "Key Buyer Pain Points" — quality inconsistency, supplier reliability, payment terms, logistics delays
4. "Regulatory & Compliance Requirements" — ${countryRegs}, testing/certification needed
5. "${trade_type === 'Import' ? 'Import Duty Structure & Landed Cost' : 'Regional Sourcing Hubs & Supplier Clusters'}" — specific to trade type
6. "Supplier Risk Assessment: Red Flags & Verification" — how to vet suppliers, common fraud patterns, verification checklist
7. "How AI Procurement Reduces ${category} Sourcing Cost" — multi-supplier bidding, price intelligence, demand aggregation (link to /post-rfq)
8. "Actionable Buyer Checklist for ${currentYear}" — numbered steps
9. CTA section with link to /post-rfq`;

    const supplierSections = `
MANDATORY BLOG SECTIONS (in this order):
1. "Global Demand Outlook for ${category} (${currentYear})" — which countries are buying, volume trends, emerging markets
2. "Export Opportunity Analysis: ${country} Suppliers" — competitive advantage, cost leadership areas
3. "Pricing Strategy for International Markets" — FOB/CIF benchmarks in a <table>, margin considerations
4. "Compliance for Exporters" — ${countryRegs}, destination country requirements
5. "Documentation & Logistics" — shipping routes, documentation checklist, port infrastructure
6. "Buyer Expectations in Target Markets" — quality standards, packaging, lead time expectations
7. "How AI Platforms Connect Suppliers to Global Buyers" — demand intelligence, verified buyer access (link to /signup?type=supplier)
8. "Supplier Readiness Checklist for ${currentYear}" — numbered steps
9. CTA section → "Register as a Verified Supplier on ProcureSaathi"`;

    const sections = isSupplierIntent ? supplierSections : buyerSections;

    const systemPrompt = `You are an expert B2B procurement research analyst writing for ProcureSaathi, an AI-powered procurement platform.

ROLE: Simulate deep market research. Write as if you've analyzed Google Trends, industry reports, trade data, and regulatory databases.

CONTENT RULES:
- Write 1500-2000 words of SUBSTANTIVE content. No filler.
- Use price RANGES (e.g., "₹48,000–55,000/MT"), never fake exact numbers.
- Reference REAL standards: BIS IS-2062, ISO 9001, ASTM A36, DGFT notifications, etc.
- Include HTML <table> elements for ANY price comparison or data comparison.
- Use <h2> for major sections, <h3> for subsections, <ul>/<ol> for lists.
- Internal links: <a href="/post-rfq">Get AI-Matched Quotes</a>, <a href="/categories">Browse Categories</a>
- End with "Illustrative Scenario" disclaimer and "AI Demand-Feed Notice".
- Output ONLY valid HTML inside a single <article> tag. No markdown. No code fences.
- NEVER use empty paragraphs, excessive <br> tags, or spacer divs.
- Every <h2> section must have at least 2 substantive paragraphs.

TITLE RULES:
- NEVER use the format "X Procurement in Y: Sourcing Guide YEAR"
- Title MUST include: category name, a specific angle, and year
- Angles: price trends, compliance, supplier risks, cost reduction, market outlook, buyer strategy, export opportunity`;

    const userPrompt = custom_topic
      ? `Write a procurement research blog about: "${custom_topic}"

Context: ${category} industry, ${country} market, ${trade_type} trade type.
Focus: ${tradeContext}

Include these sections adapted to the custom topic:
${sections}

Year: ${currentYear}. Regulations: ${countryRegs}.`
      : `Write a deep-research procurement blog about ${category} focused on ${tradeContext}

${sections}

TITLE EXAMPLES (pick a style, don't copy exactly):
- "${category} Prices in ${country} ${currentYear}: Market Trends, Risks & Buyer Strategy"
- "${trade_type === 'Export' ? 'Export Demand for' : trade_type === 'Import' ? 'Importing' : 'Sourcing'} ${category} ${trade_type === 'Export' ? 'from' : trade_type === 'Import' ? 'into' : 'in'} ${country}: Compliance, Pricing & ${trade_type === 'Export' ? 'Supplier Outlook' : 'Cost Benchmarks'} (${currentYear})"
- "${category} ${trade_type} Market ${currentYear}: What ${isSupplierIntent ? 'Suppliers' : 'Buyers'} Must Know"

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
                title: { type: 'string', description: 'SEO H1 title. 50-70 chars. Must include category, angle, and year. NEVER use "Sourcing Guide" format.' },
                meta_title: { type: 'string', description: 'Meta title for search engines, under 60 characters' },
                meta_description: { type: 'string', description: 'Meta description, 120-160 chars, includes primary keyword and CTA hint' },
                excerpt: { type: 'string', description: 'Blog excerpt, 150-200 chars, compelling summary' },
                content: { type: 'string', description: 'Full blog HTML inside <article> tag. 1500-2000 words. h2/h3 headings, tables for pricing, lists, internal links, CTA. No empty gaps or spacer elements.' },
                seo_keywords: { type: 'string', description: 'Comma-separated SEO keywords (8-12 keywords)' },
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
      // Fallback: try to parse content from message
      const msgContent = aiData.choices?.[0]?.message?.content;
      if (msgContent) {
        console.log('AI returned content in message instead of tool call, attempting parse');
      }
      throw new Error('AI did not return structured blog content');
    }

    const blogData = JSON.parse(toolCall.function.arguments);

    // Generate unique slug with trade_type and country suffix
    const slugBase = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 70);
    const slug = `${slugBase}-${trade_type.toLowerCase()}-${country.toLowerCase().replace(/\s+/g, '-')}`;

    // Image system: use Unsplash source API with category-specific keywords
    const catSlug = category.toLowerCase().replace(/[^a-z]+/g, '-');
    const imageQueries = getImageQueries(category, country, trade_type);
    
    const coverImageUrl = `https://images.unsplash.com/photo-${getReliablePhotoId(category)}?w=1200&h=600&fit=crop&auto=format&q=80`;
    const inlineImageUrls = imageQueries.map((q) =>
      `https://source.unsplash.com/800x400/?${encodeURIComponent(q)}`
    );

    // Inject images into content AFTER first <p> following each <h2>, skip sections with <table>
    let finalContent = injectImagesIntoContent(blogData.content, inlineImageUrls, imageQueries);

    // Clean up any blank gaps: remove empty paragraphs, excessive whitespace
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
  // Split content by <h2> sections
  const parts = html.split(/(<h2[^>]*>.*?<\/h2>)/gi);
  let imageIndex = 0;
  let result = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    result += part;

    // If this part is an <h2> tag and we have images left
    if (/<h2[^>]*>/i.test(part) && imageIndex < imageUrls.length) {
      // Look at the next part (the section content after h2)
      if (i + 1 < parts.length) {
        const sectionContent = parts[i + 1];

        // Skip image injection if section contains a table
        if (/<table/i.test(sectionContent)) {
          continue;
        }

        // Find the end of the first </p> in the section
        const firstPEnd = sectionContent.indexOf('</p>');
        if (firstPEnd !== -1) {
          const insertPos = firstPEnd + 4;
          const imgHtml = `<figure class="blog-image" style="margin:2rem 0"><img src="${imageUrls[imageIndex]}" alt="${captions[imageIndex]} - ProcureSaathi" width="800" height="400" loading="lazy" style="width:100%;height:auto;border-radius:8px" /><figcaption style="text-align:center;font-size:0.875rem;color:#6b7280;margin-top:0.5rem">${captions[imageIndex]}</figcaption></figure>`;
          parts[i + 1] = sectionContent.slice(0, insertPos) + imgHtml + sectionContent.slice(insertPos);
          imageIndex++;
        }
      }
    }
  }

  // If we didn't inject all parts yet (due to split), reassemble
  if (result.length < html.length / 2) {
    return parts.join('');
  }

  return parts.join('');
}

function getImageQueries(category: string, country: string, tradeType: string): string[] {
  const cat = category.toLowerCase().split('&')[0].trim();
  return [
    `${cat} manufacturing factory ${country}`,
    `${cat} warehouse supply chain`,
    `${cat} quality inspection industrial`,
    `B2B procurement ${tradeType === 'Export' ? 'export shipping port' : tradeType === 'Import' ? 'import customs' : 'industrial logistics'} ${country}`,
    `${cat} ${tradeType === 'Export' ? 'container cargo' : 'raw materials storage'}`,
  ];
}

function getReliablePhotoId(category: string): string {
  const map: Record<string, string> = {
    'steel': '1504328345606-18bbc8c9d7d1',
    'metal': '1504328345606-18bbc8c9d7d1',
    'chemical': '1532187863486-abf9dbad1b69',
    'solvent': '1532187863486-abf9dbad1b69',
    'polymer': '1558618666-fcd25c85f82e',
    'plastic': '1558618666-fcd25c85f82e',
    'construction': '1504307651254-35680f356dfd',
    'textile': '1558171813-4c2e8f2ad057',
    'fabric': '1558171813-4c2e8f2ad057',
    'food': '1556909114-f6e7ad7d3136',
    'agriculture': '1500595046743-cd271d694d30',
    'packaging': '1586528116311-ad8dd3c8310d',
    'mineral': '1518611012118-696072aa579a',
    'mining': '1518611012118-696072aa579a',
    'rubber': '1504328345606-18bbc8c9d7d1',
    'auto': '1581091226825-a6a2a5aee158',
    'electrical': '1581091226825-a6a2a5aee158',
    'paper': '1586528116311-ad8dd3c8310d',
    'board': '1586528116311-ad8dd3c8310d',
    'pulses': '1556909114-f6e7ad7d3136',
    'spices': '1596040033229-a9821ebd058d',
    'industrial': '1581091226825-a6a2a5aee158',
  };
  const catLower = category.toLowerCase();
  for (const [key, id] of Object.entries(map)) {
    if (catLower.includes(key)) return id;
  }
  return '1581091226825-a6a2a5aee158';
}
