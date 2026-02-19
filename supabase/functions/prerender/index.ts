import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Prerender Edge Function
 * 
 * Detects bot user agents and returns pre-rendered HTML snapshots
 * for SEO pages. Humans receive a redirect to the SPA.
 * 
 * Now includes FULL /demand/ corridor prerendering with DB data + JSON-LD.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN = 'https://www.procuresaathi.com';

const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandex', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'applebot', 'adsbot', 'mediapartners-google',
  'pinterest', 'slackbot', 'embedly', 'crawler', 'spider', 'bot',
  'prerender', 'headlesschrome',
];

// Priority corridors for deep prerender
const PRIORITY_CORRIDORS: Record<string, { country: string; countryCode: string; category: string }> = {
  'in-metals-ferrous-steel-iron': { country: 'India', countryCode: 'IN', category: 'Metals – Ferrous (Steel & Iron)' },
  'sa-metals-ferrous-steel-iron': { country: 'Saudi Arabia', countryCode: 'SA', category: 'Metals – Ferrous (Steel & Iron)' },
  'ae-polymers-resins': { country: 'UAE', countryCode: 'AE', category: 'Polymers & Resins' },
  'de-chemicals-raw-materials': { country: 'Germany', countryCode: 'DE', category: 'Chemicals & Raw Materials' },
  'us-machinery-equipment': { country: 'United States', countryCode: 'US', category: 'Machinery & Equipment' },
  'gb-textiles-fabrics': { country: 'United Kingdom', countryCode: 'GB', category: 'Textiles & Fabrics' },
  'qa-pipes-tubes': { country: 'Qatar', countryCode: 'QA', category: 'Pipes & Tubes' },
  'ng-food-beverages': { country: 'Nigeria', countryCode: 'NG', category: 'Food & Beverages' },
  'sg-electronic-components': { country: 'Singapore', countryCode: 'SG', category: 'Electronic Components' },
  'ke-pharmaceuticals-drugs': { country: 'Kenya', countryCode: 'KE', category: 'Pharmaceuticals & Drugs' },
};

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  if (!lower) return true;
  return BOT_PATTERNS.some(p => lower.includes(p));
}

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// Generate demand page HTML with REAL DB data — no hydration gap
async function generateDemandHTML(slug: string): Promise<string> {
  const parts = slug.split('-');
  const countryCode = parts[0]?.toUpperCase() || '';
  const categorySlug = parts.slice(1).join('-');
  const corridor = PRIORITY_CORRIDORS[slug];
  const categoryDisplay = corridor?.category || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const countryDisplay = corridor?.country || countryCode;
  const canonicalUrl = `${DOMAIN}/demand/${slug}`;

  const supabase = getSupabase();

  // Fetch real data
  const [signalRes, contractRes, auditRes] = await Promise.all([
    supabase.from('demand_intelligence_signals')
      .select('intent_score')
      .ilike('country', `%${countryCode}%`)
      .ilike('category', `%${categorySlug.replace(/-/g, '%')}%`)
      .limit(10),
    supabase.from('contract_summaries')
      .select('total_value')
      .eq('approval_status', 'approved')
      .ilike('category', `%${categorySlug.replace(/-/g, '%')}%`)
      .limit(20),
    supabase.from('audit_ledger')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', 'contract'),
  ]);

  const signals = signalRes.data || [];
  const contracts = contractRes.data || [];
  const auditCount = auditRes.count || 0;
  const avgIntent = signals.length > 0
    ? (signals.reduce((s: number, x: any) => s + (x.intent_score || 0), 0) / signals.length).toFixed(1)
    : null;
  const values = contracts.map((c: any) => c.total_value || 0).filter((v: number) => v > 0);
  const avgPrice = values.length > 0
    ? (values.reduce((s: number, v: number) => s + v, 0) / values.length)
    : null;

  const title = `Buy ${categoryDisplay} in ${countryDisplay} — AI Verified Suppliers & Live Rates | ProcureSaathi`;
  const description = `Source ${categoryDisplay} in ${countryDisplay} with AI-verified suppliers. ${avgIntent ? `Intent Score: ${avgIntent}/10.` : 'Submit RFQ to activate.'} Managed procurement with transparent pricing.`;

  // Build JSON-LD
  const schemaData: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Service",
    "name": `Industrial ${categoryDisplay} Procurement in ${countryDisplay}`,
    "description": `AI-driven procurement with demand score ${avgIntent || 'N/A'}/10.`,
    "areaServed": countryDisplay,
    "provider": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": DOMAIN
    },
  };
  if (values.length > 0) {
    (schemaData as any).offers = {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": Math.min(...values),
      "highPrice": Math.max(...values),
      "offerCount": values.length,
    };
  }

  // Data sections HTML
  let dataHTML = '';
  if (signals.length > 0 || contracts.length > 0) {
    dataHTML = `
      <section style="margin-top:32px;">
        <h2 style="font-size:22px;font-weight:600;">Demand Intelligence</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;">
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Intent Score</p>
            <p style="font-size:28px;font-weight:700;">${avgIntent || '—'}/10</p>
          </div>
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Approved Contracts</p>
            <p style="font-size:28px;font-weight:700;">${contracts.length}</p>
          </div>
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Audit Entries</p>
            <p style="font-size:28px;font-weight:700;">${auditCount.toLocaleString()}</p>
          </div>
        </div>
      </section>`;

    if (values.length > 0) {
      dataHTML += `
      <section style="margin-top:24px;">
        <h2 style="font-size:22px;font-weight:600;">AI Pricing Signal</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;">
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Avg Approved Value</p>
            <p style="font-size:24px;font-weight:700;">₹${avgPrice ? (avgPrice / 100000).toFixed(1) + 'L' : '—'}</p>
          </div>
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Price Range</p>
            <p style="font-size:24px;font-weight:700;">₹${(Math.min(...values) / 100000).toFixed(1)}L – ₹${(Math.max(...values) / 100000).toFixed(1)}L</p>
          </div>
          <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#6B7280;font-size:14px;">Total Contracts</p>
            <p style="font-size:24px;font-weight:700;">${values.length}</p>
          </div>
        </div>
      </section>`;
    }
  } else {
    // Global fallback — NO THIN PAGES
    dataHTML = `
      <section style="margin-top:32px;padding:24px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
        <h2 style="font-size:22px;font-weight:600;">Global Market Projection</h2>
        <p style="color:#4B5563;margin-top:12px;line-height:1.7;">
          Based on verified global contracts and AI demand signals across 196 countries,
          ProcureSaathi projects growing procurement activity for ${escapeHtml(categoryDisplay)} in ${escapeHtml(countryDisplay)}.
          Early corridor intelligence is being aggregated from cross-border trade flows, supplier registrations,
          and buyer intent signals detected across our platform.
        </p>
        <p style="color:#4B5563;margin-top:12px;line-height:1.7;">
          Submit an RFQ to signal demand and unlock AI-driven supplier matching, real-time pricing intelligence,
          and managed procurement support for this corridor.
        </p>
      </section>`;
  }

  // Authority section — always present
  const authorityHTML = `
    <section style="margin-top:32px;">
      <h2 style="font-size:22px;font-weight:600;">Why Source ${escapeHtml(categoryDisplay)} via ProcureSaathi?</h2>
      <ul style="margin-top:16px;line-height:2.2;color:#4B5563;">
        <li>✓ AI-driven supplier ranking based on performance, pricing, and delivery reliability</li>
        <li>✓ Immutable audit ledger with blockchain-grade governance for every transaction</li>
        <li>✓ Trade finance enabled — credit facilities for qualified procurement</li>
        <li>✓ Governed procurement workflow with sealed bidding and transparent award logic</li>
        <li>✓ End-to-end managed logistics with real-time tracking and quality assurance</li>
        <li>✓ Cross-border export desk supporting documentation, customs, and compliance</li>
      </ul>
    </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ProcureSaathi">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${DOMAIN}/apple-touch-icon.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <script type="application/ld+json">${JSON.stringify(schemaData)}</script>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;color:#111827;">
  <header style="border-bottom:1px solid #e5e7eb;padding:16px 24px;">
    <a href="/" style="font-size:20px;font-weight:700;color:#1F3A8A;text-decoration:none;">ProcureSaathi</a>
    <nav style="display:inline;margin-left:32px;">
      <a href="/buyer" style="margin-right:16px;color:#374151;text-decoration:none;">For Buyers</a>
      <a href="/seller" style="margin-right:16px;color:#374151;text-decoration:none;">For Suppliers</a>
      <a href="/categories" style="margin-right:16px;color:#374151;text-decoration:none;">Categories</a>
      <a href="/explore" style="margin-right:16px;color:#374151;text-decoration:none;">Explore</a>
      <a href="/post-rfq" style="color:#374151;text-decoration:none;">Post RFQ</a>
    </nav>
  </header>

  <main style="max-width:1200px;margin:0 auto;padding:48px 24px;">
    <nav style="font-size:14px;color:#6B7280;margin-bottom:24px;">
      <a href="/" style="color:#1F3A8A;">Home</a> → 
      <a href="/explore" style="color:#1F3A8A;">Explore</a> → 
      <a href="/explore/asia/${countryCode.toLowerCase()}" style="color:#1F3A8A;">${escapeHtml(countryDisplay)}</a> → 
      ${escapeHtml(categoryDisplay)}
    </nav>

    <h1 style="font-size:32px;font-weight:700;">Buy ${escapeHtml(categoryDisplay)} in ${escapeHtml(countryDisplay)} — AI Verified Suppliers &amp; Live Market Rates</h1>
    <p style="font-size:18px;color:#4B5563;margin-top:16px;line-height:1.7;">
      Access real-time procurement intelligence for ${escapeHtml(categoryDisplay)} sourcing in ${escapeHtml(countryDisplay)}. Data-driven insights from verified trade corridors.
    </p>

    ${dataHTML}
    ${authorityHTML}

    <div style="margin-top:32px;text-align:center;">
      <a href="/post-rfq" style="display:inline-block;padding:16px 32px;background:#1F3A8A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:18px;">Submit RFQ for ${escapeHtml(categoryDisplay)}</a>
      <p style="margin-top:8px;color:#6B7280;font-size:14px;">AI-matched with verified suppliers in ${escapeHtml(countryDisplay)}</p>
    </div>

    <section style="margin-top:40px;">
      <h2 style="font-size:22px;font-weight:600;">Explore Procurement Corridors</h2>
      <ul style="margin-top:12px;columns:2;line-height:2;">
        <li><a href="/demand/in-metals-ferrous-steel-iron" style="color:#1F3A8A;">Steel in India</a></li>
        <li><a href="/demand/sa-metals-ferrous-steel-iron" style="color:#1F3A8A;">Steel in Saudi Arabia</a></li>
        <li><a href="/demand/ae-polymers-resins" style="color:#1F3A8A;">Polymers in UAE</a></li>
        <li><a href="/demand/de-chemicals-raw-materials" style="color:#1F3A8A;">Chemicals in Germany</a></li>
        <li><a href="/demand/us-machinery-equipment" style="color:#1F3A8A;">Machinery in USA</a></li>
        <li><a href="/demand/gb-textiles-fabrics" style="color:#1F3A8A;">Textiles in UK</a></li>
        <li><a href="/demand/qa-pipes-tubes" style="color:#1F3A8A;">Pipes in Qatar</a></li>
        <li><a href="/demand/ng-food-beverages" style="color:#1F3A8A;">Food in Nigeria</a></li>
        <li><a href="/demand/sg-electronic-components" style="color:#1F3A8A;">Electronics in Singapore</a></li>
        <li><a href="/demand/ke-pharmaceuticals-drugs" style="color:#1F3A8A;">Pharma in Kenya</a></li>
      </ul>
    </section>
  </main>

  <footer style="border-top:1px solid #e5e7eb;padding:24px;text-align:center;color:#6B7280;font-size:14px;">
    <p>&copy; 2025 ProcureSaathi. AI-Powered B2B Procurement Platform.</p>
  </footer>
</body>
</html>`;
}

// Generate static HTML for non-demand pages (existing logic)
async function generateHTML(path: string): Promise<string> {
  const cleanPath = path.replace(/\/+$/, '') || '/';
  const canonicalUrl = `${DOMAIN}${cleanPath}`;
  
  let title = 'ProcureSaathi | AI-Powered B2B Procurement Platform';
  let description = 'AI-powered B2B procurement and sourcing platform for verified buyers and suppliers.';
  let h1 = 'AI-Powered B2B Procurement Platform';
  let bodyContent = '';
  
  // Procurement signal pages
  const procMatch = cleanPath.match(/^(?:\/[^/]+)?\/procurement\/(.+)$/);
  if (procMatch) {
    const slug = procMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    title = `${readable} Procurement | ProcureSaathi`;
    description = `Source ${readable} from verified suppliers on ProcureSaathi. Post RFQ, compare quotes, and close deals with AI-powered procurement.`;
    h1 = `${readable} – AI-Powered Procurement`;
    
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('admin_signal_pages')
        .select('headline, subheadline, category, subcategory')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (data) {
        h1 = data.headline;
        description = data.subheadline || description;
        bodyContent = `<p style="color:#4B5563;margin-top:16px;line-height:1.7;">
          Source verified ${data.category} – ${data.subcategory} suppliers on ProcureSaathi. 
          Our AI demand intelligence tracks buyer intent and matches you with the best suppliers.
        </p>`;
      }
    } catch (e) {
      console.error('[prerender] DB fetch error:', e);
    }
  }
  
  // Buy pages
  const buyMatch = cleanPath.match(/^\/buy-(.+)$/);
  if (buyMatch) {
    const slug = buyMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    title = `Buy ${readable} from Verified Suppliers | ProcureSaathi`;
    description = `Source verified ${readable} suppliers on ProcureSaathi. Post RFQ and receive competitive quotes.`;
    h1 = `Buy ${readable} from Verified Suppliers`;
  }
  
  // Supplier pages
  const supplierMatch = cleanPath.match(/^\/(.+)-suppliers$/);
  if (supplierMatch) {
    const slug = supplierMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    title = `${readable} Suppliers & Manufacturers | ProcureSaathi`;
    description = `Join ProcureSaathi as a ${readable} supplier. AI detects buyer demand and matches procurement opportunities.`;
    h1 = `${readable} Suppliers & Manufacturers`;
  }
  
  // Category pages
  const catMatch = cleanPath.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const slug = catMatch[1].split('/')[0];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    title = `${readable} B2B Marketplace | ProcureSaathi`;
    description = `Explore ${readable} suppliers and buyers on ProcureSaathi AI-powered B2B procurement platform.`;
    h1 = `${readable} – B2B Marketplace`;
  }

  // Blog pages
  const blogMatch = cleanPath.match(/^\/blogs\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('blogs')
        .select('title, excerpt, content')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (data) {
        title = `${data.title} | ProcureSaathi Blog`;
        description = data.excerpt || description;
        h1 = data.title;
        const plainContent = data.content.replace(/<[^>]+>/g, '').substring(0, 500);
        bodyContent = `<article style="margin-top:16px;color:#4B5563;line-height:1.8;">${plainContent}...</article>`;
      }
    } catch (e) {
      console.error('[prerender] Blog fetch error:', e);
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ProcureSaathi">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${DOMAIN}/apple-touch-icon.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "${escapeJson(title)}",
    "description": "${escapeJson(description)}",
    "url": "${canonicalUrl}",
    "publisher": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "${DOMAIN}"
    }
  }
  </script>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;color:#111827;">
  <header style="border-bottom:1px solid #e5e7eb;padding:16px 24px;">
    <a href="/" style="font-size:20px;font-weight:700;color:#1F3A8A;text-decoration:none;">ProcureSaathi</a>
    <nav style="display:inline;margin-left:32px;">
      <a href="/buyer" style="margin-right:16px;color:#374151;text-decoration:none;">For Buyers</a>
      <a href="/seller" style="margin-right:16px;color:#374151;text-decoration:none;">For Suppliers</a>
      <a href="/categories" style="margin-right:16px;color:#374151;text-decoration:none;">Categories</a>
      <a href="/post-rfq" style="color:#374151;text-decoration:none;">Post RFQ</a>
    </nav>
  </header>

  <main style="max-width:1200px;margin:0 auto;padding:48px 24px;">
    <h1 style="font-size:32px;font-weight:700;">${escapeHtml(h1)}</h1>
    <p style="font-size:18px;color:#4B5563;margin-top:16px;line-height:1.7;">${escapeHtml(description)}</p>
    ${bodyContent}
    
    <section style="margin-top:32px;padding:20px;background:#f3f4f6;border-radius:8px;">
      <p><strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform 
      that connects verified buyers and suppliers using demand intelligence.</p>
    </section>
    
    <div style="margin-top:24px;">
      <a href="/post-rfq" style="display:inline-block;padding:12px 28px;background:#1F3A8A;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Post RFQ – Free</a>
      <a href="/categories" style="display:inline-block;margin-left:12px;padding:12px 28px;border:1px solid #d1d5db;border-radius:6px;text-decoration:none;color:#374151;">Browse Categories</a>
    </div>

    <section style="margin-top:40px;">
      <h2 style="font-size:22px;font-weight:600;">Explore Categories</h2>
      <ul style="margin-top:12px;columns:2;line-height:2;">
        <li><a href="/category/metals-ferrous-steel-iron" style="color:#1F3A8A;">Metals &amp; Steel</a></li>
        <li><a href="/category/chemicals-raw-materials" style="color:#1F3A8A;">Chemicals</a></li>
        <li><a href="/category/building-construction" style="color:#1F3A8A;">Construction</a></li>
        <li><a href="/category/machinery-equipment" style="color:#1F3A8A;">Machinery</a></li>
        <li><a href="/category/food-beverages" style="color:#1F3A8A;">Food &amp; Beverages</a></li>
        <li><a href="/category/textiles-fabrics" style="color:#1F3A8A;">Textiles</a></li>
      </ul>
    </section>
  </main>

  <footer style="border-top:1px solid #e5e7eb;padding:24px;text-align:center;color:#6B7280;font-size:14px;">
    <p>&copy; 2025 ProcureSaathi. AI-Powered B2B Procurement Platform.</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJson(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetPath = url.searchParams.get('url') || '/';
    const userAgent = req.headers.get('user-agent') || '';

    console.log(`[prerender] UA: ${userAgent.substring(0, 80)}, path: ${targetPath}`);

    // If not a bot, redirect to SPA
    if (!isBot(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': `${DOMAIN}${targetPath}` },
      });
    }

    // Check if this is a /demand/ page — use deep prerender
    const demandMatch = targetPath.match(/^\/demand\/(.+)$/);
    let html: string;
    if (demandMatch) {
      html = await generateDemandHTML(demandMatch[1]);
    } else {
      html = await generateHTML(targetPath);
    }

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Robots-Tag': 'index, follow',
      },
    });
  } catch (error) {
    console.error('[prerender] Error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});
