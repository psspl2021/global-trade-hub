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

    const topic = custom_topic || `${category} procurement in ${country} - ${trade_type} sourcing guide`;
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);

    const currentYear = new Date().getFullYear();

    // Generate blog content using structured rules-based approach
    const title = custom_topic 
      ? `${custom_topic} — ${currentYear} Buyer's Guide`
      : `${category} Procurement in ${country}: ${trade_type} Sourcing Guide ${currentYear}`;

    const excerpt = `Complete ${currentYear} guide to ${category.toLowerCase()} procurement in ${country}. Covers pricing trends, sourcing risks, compliance requirements, and how AI-powered procurement reduces costs by 8-15%.`;

    const content = generateBlogHTML(category, country, trade_type, currentYear, custom_topic);

    return new Response(JSON.stringify({
      blog: { title, slug, excerpt, content }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateBlogHTML(category: string, country: string, tradeType: string, year: number, customTopic?: string): string {
  const h1 = customTopic 
    ? `${customTopic} — Complete ${year} Analysis`
    : `${category} Procurement in ${country}: ${tradeType} Guide for ${year}`;

  return `
<article>
<p><strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that connects verified buyers with pre-qualified suppliers. We manage supplier selection, pricing negotiation, and fulfillment — so procurement teams can focus on strategy, not chasing quotes.</p>

<h1>${h1}</h1>

<p>Procurement leaders — CFOs, Purchase Heads, and Factory Owners — face increasing pressure to reduce material costs while maintaining quality and compliance. This guide covers the key factors affecting ${category.toLowerCase()} sourcing in ${country} for ${year}.</p>

<h2>Current Market Pricing Trends</h2>
<p>The ${category.toLowerCase()} market in ${country} has seen significant volatility. Key pricing factors include:</p>
<ul>
<li>Raw material input cost fluctuations</li>
<li>International freight and logistics rates</li>
<li>Currency exchange movements (${tradeType === 'Domestic' ? 'INR stability' : 'forex hedging costs'})</li>
<li>Government tariffs and trade policies</li>
</ul>

<p><em><strong>Illustrative Scenario:</strong> A mid-size manufacturer procuring ${category.toLowerCase()} through ProcureSaathi's managed platform could see cost reductions through competitive multi-supplier bidding, AI-verified pricing, and consolidated logistics.</em></p>

<p><em>This is an illustrative scenario for educational purposes. Actual outcomes depend on specific requirements, market conditions, and supplier availability.</em></p>

<h2>Top Procurement Risks in ${year}</h2>
<ol>
<li><strong>Price volatility:</strong> Raw material prices can swing significantly within quarters</li>
<li><strong>Quality inconsistency:</strong> Without verified suppliers, quality variance increases rejection rates</li>
<li><strong>Compliance gaps:</strong> ${tradeType !== 'Domestic' ? 'International trade requires specific certifications, customs documentation, and regulatory compliance' : 'BIS certifications, ISI marks, and industry standards must be verified'}</li>
<li><strong>Supply chain disruptions:</strong> Single-source dependency creates risk</li>
</ol>

<h2>Common Procurement Mistakes</h2>
<ul>
<li>Relying on a single supplier without competitive benchmarking</li>
<li>Not verifying supplier certifications before placing orders</li>
<li>Ignoring logistics costs in total cost of ownership calculations</li>
<li>Manual RFQ processes that delay decision-making by weeks</li>
</ul>

<h2>How AI-Powered Sourcing Reduces Costs</h2>
<p>Modern procurement platforms use AI to:</p>
<ul>
<li><strong>Multi-supplier bidding:</strong> Automated RFQ distribution to verified suppliers</li>
<li><strong>Price intelligence:</strong> Market benchmark comparison for every quote</li>
<li><strong>Supplier verification:</strong> AI-driven trust scoring and document verification</li>
<li><strong>Logistics optimization:</strong> Integrated freight comparison and booking</li>
</ul>

<h2>Get Live Pricing for Your Requirement</h2>
<p>Stop spending hours collecting quotes manually. Post your ${category.toLowerCase()} requirement on ProcureSaathi and receive competitive quotes from verified suppliers within 24 hours.</p>

<p><strong><a href="/post-rfq">→ Post your requirement for live pricing</a></strong></p>

<hr />

<h3>Related Resources</h3>
<ul>
<li><a href="/categories">Browse all procurement categories</a></li>
<li><a href="/how-to-post-rfq-online">How to post an RFQ online</a></li>
<li><a href="/find-verified-b2b-suppliers">Find verified B2B suppliers</a></li>
<li><a href="/enterprise-procurement-guide">Enterprise procurement guide</a></li>
</ul>

<hr />
<p><em><strong>AI Demand-Feed Notice:</strong> This content feeds ProcureSaathi's AI demand models to improve procurement matching accuracy. It is generated for educational and procurement planning purposes.</em></p>
</article>`;
}
