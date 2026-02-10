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
    const { category, country, trade_type, custom_topic } = await req.json();

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
    const tradeContext = trade_type === 'Domestic'
      ? `domestic sourcing within ${country}, covering local regulations, BIS/ISI standards, GST compliance, and regional supplier networks`
      : trade_type === 'Export'
        ? `exporting from ${country} to international markets, covering DGFT regulations, export incentives, customs documentation, FOB/CIF pricing, and logistics`
        : `importing into ${country}, covering customs duties, trade agreements, quality certifications, forex considerations, and landed cost calculations`;

    const systemPrompt = `You are an expert B2B procurement content strategist writing for ProcureSaathi, an AI-powered procurement platform. 
Write authoritative, data-rich procurement blogs targeting CFOs, Purchase Heads, and Factory Owners.

CRITICAL RULES:
- Never use generic filler text. Every paragraph must contain specific, actionable insights.
- Use price RANGES and market trends, not exact fake numbers.
- Include region-specific regulations, compliance requirements, and trade policies.
- Reference real industry standards (BIS, ISO, ASTM, etc.) relevant to the category.
- Write in an authoritative enterprise B2B tone — not marketing fluff.
- Include HTML tables for price comparisons or data where relevant.
- Use <h2> and <h3> tags for sections, <ul>/<ol> for lists, <table> for data.
- Include 1500-2000 words of substantive content.
- Add internal links using these exact paths: /post-rfq, /categories, /how-to-post-rfq-online, /find-verified-b2b-suppliers
- End with a strong CTA section linking to /post-rfq
- Include an "AI Demand-Feed Notice" at the very end.
- Use "Illustrative Scenario" framework — no guarantees or hard savings claims.
- Output ONLY the HTML content inside an <article> tag. No markdown.`;

    const userPrompt = custom_topic
      ? `Write a comprehensive procurement blog about: "${custom_topic}"
Context: ${category} industry, ${country} market, ${trade_type} trade.
${tradeContext}
Year: ${currentYear}`
      : `Write a comprehensive procurement blog about ${category} procurement focused on ${tradeContext}.

The blog must cover ALL of these sections with unique, researched content:

1. **Market Overview for ${currentYear}** — Current state of ${category.toLowerCase()} market in ${country}, supply-demand dynamics, price trajectory
2. **Pricing Trends & Benchmarks** — Price ranges by grade/type, seasonal patterns, factors driving cost changes (use HTML table for comparison)
3. **Key Buyer Challenges** — Specific pain points for ${category.toLowerCase()} procurement (quality variance, supplier reliability, lead times)
4. **Regulatory & Compliance Landscape** — Relevant standards, certifications, government policies affecting ${category.toLowerCase()} ${trade_type === 'Domestic' ? 'in ' + country : trade_type === 'Export' ? 'exports from ' + country : 'imports to ' + country}
5. **${trade_type === 'Domestic' ? 'Regional Sourcing Hubs' : trade_type === 'Export' ? 'Export Markets & Documentation' : 'Import Sources & Duty Structure'}** — Specific to trade type
6. **Supplier Risk Assessment** — How to evaluate ${category.toLowerCase()} suppliers, red flags, verification checklist
7. **How AI-Powered Procurement Reduces Cost** — Role of AI in multi-supplier bidding, price intelligence, supplier verification (link to ProcureSaathi features)
8. **${currentYear} Outlook & Recommendations** — Forward-looking insights and actionable next steps

Generate a UNIQUE, non-repetitive SEO title that includes the category, a specific angle (e.g., price trends, compliance, cost reduction), and the year. Do NOT use the generic format "Category Procurement in Country: Sourcing Guide Year".

Examples of good titles:
- "${category}: Price Trends, Supplier Risks & Cost Reduction Strategies in ${country} (${currentYear})"
- "${trade_type === 'Export' ? 'Exporting' : trade_type === 'Import' ? 'Importing' : 'Sourcing'} ${category} in ${country}: Compliance, Pricing & Market Analysis ${currentYear}"
- "${category} Procurement Intelligence: ${country} Market Outlook & Buyer Strategies for ${currentYear}"`;

    // Call Lovable AI for content generation
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
                title: { type: 'string', description: 'SEO-optimized H1 title, unique and specific to the topic. 50-70 characters.' },
                meta_title: { type: 'string', description: 'Meta title for search engines, under 60 characters' },
                meta_description: { type: 'string', description: 'Meta description for search engines, 120-160 characters, includes primary keyword' },
                excerpt: { type: 'string', description: 'Blog excerpt/summary, 150-200 characters' },
                content: { type: 'string', description: 'Full blog HTML content inside <article> tags. 1500-2000 words. Must include h2/h3 headings, tables, lists, internal links, CTA, and AI demand-feed notice.' },
                seo_keywords: { type: 'string', description: 'Comma-separated SEO keywords for the blog' },
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
      throw new Error('AI did not return structured blog content');
    }

    const blogData = JSON.parse(toolCall.function.arguments);

    // Generate slug from title
    const slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);

    // Generate contextual image URLs using Unsplash for reliable, high-quality images
    const imageKeywords = getImageKeywords(category, country, trade_type);
    const coverImage = `https://images.unsplash.com/photo-${getUnsplashId(category, 'cover')}?w=1200&h=600&fit=crop&auto=format`;
    const inlineImages = imageKeywords.map((kw, i) => 
      `https://source.unsplash.com/800x400/?${encodeURIComponent(kw)}`
    );

    // Inject images into content
    let contentWithImages = blogData.content;
    const h2Matches = [...contentWithImages.matchAll(/<\/h2>/g)];
    
    // Insert inline images after every other h2
    let insertOffset = 0;
    for (let i = 0; i < Math.min(inlineImages.length, h2Matches.length); i++) {
      if (i % 1 === 0 && h2Matches[i + 1]) { // After first paragraph of each section
        const insertPos = contentWithImages.indexOf('</p>', h2Matches[i].index + insertOffset) + 4;
        if (insertPos > 4) {
          const imgTag = `\n<figure class="blog-inline-image my-6"><img src="${inlineImages[i]}" alt="${imageKeywords[i]} - ProcureSaathi procurement insights" width="800" height="400" loading="lazy" class="rounded-lg w-full" /><figcaption class="text-sm text-center text-gray-500 mt-2">${imageKeywords[i]}</figcaption></figure>\n`;
          contentWithImages = contentWithImages.slice(0, insertPos) + imgTag + contentWithImages.slice(insertPos);
          insertOffset += imgTag.length;
        }
      }
    }

    return new Response(JSON.stringify({
      blog: {
        title: blogData.title,
        slug,
        excerpt: blogData.excerpt,
        content: contentWithImages,
        meta_title: blogData.meta_title,
        meta_description: blogData.meta_description,
        seo_keywords: blogData.seo_keywords,
        cover_image: coverImage,
        inline_images: inlineImages,
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

function getImageKeywords(category: string, country: string, tradeType: string): string[] {
  const cat = category.toLowerCase();
  const base = [
    `${cat} manufacturing ${country}`,
    `${cat} supply chain warehouse`,
    `${cat} quality inspection industrial`,
    `B2B procurement logistics ${country}`,
    `${tradeType === 'Export' ? 'export shipping container port' : tradeType === 'Import' ? 'import customs clearance' : 'industrial warehouse storage'}`,
  ];
  return base;
}

function getUnsplashId(category: string, type: string): string {
  // Map categories to relevant Unsplash photo IDs for consistent, high-quality covers
  const coverMap: Record<string, string> = {
    'steel': '1504328345606-18bbc8c9d7d1',
    'chemical': '1532187863486-abf9dbad1b69',
    'polymer': '1558618666-fcd25c85f82e',
    'plastic': '1558618666-fcd25c85f82e',
    'construction': '1504307651254-35680f356dfd',
    'textile': '1558171813-4c2e8f2ad057',
    'food': '1556909114-f6e7ad7d3136',
    'agriculture': '1500595046743-cd271d694d30',
    'packaging': '1586528116311-ad8dd3c8310d',
    'mineral': '1518611012118-696072aa579a',
    'mining': '1518611012118-696072aa579a',
    'industrial': '1581091226825-a6a2a5aee158',
    'pulses': '1556909114-f6e7ad7d3136',
    'spices': '1596040033229-a9821ebd058d',
  };
  
  const catLower = category.toLowerCase();
  for (const [key, id] of Object.entries(coverMap)) {
    if (catLower.includes(key)) return id;
  }
  return '1581091226825-a6a2a5aee158'; // Default industrial image
}
