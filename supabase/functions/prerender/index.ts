import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Prerender Edge Function
 * 
 * Detects bot user agents and returns pre-rendered HTML snapshots
 * for SEO pages. Humans receive a redirect to the SPA.
 * 
 * Usage: Route bot traffic through this function via hosting config
 * or use as a Prerender.io-compatible endpoint.
 * 
 * Query params:
 *   ?url=/procurement/structural-steel-infrastructure
 *   ?url=/buy-chemicals-raw-materials
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN = 'https://procuresaathi.com';

const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandex', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'whatsapp', 'applebot', 'adsbot', 'mediapartners-google',
  'pinterest', 'slackbot', 'embedly', 'crawler', 'spider', 'bot',
  'prerender', 'headlesschrome',
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  if (!lower) return true;
  return BOT_PATTERNS.some(p => lower.includes(p));
}

// Generate static HTML for a given path
async function generateHTML(path: string): Promise<string> {
  const cleanPath = path.replace(/\/+$/, '') || '/';
  const canonicalUrl = `${DOMAIN}${cleanPath}`;
  
  // Determine page type and content
  let title = 'ProcureSaathi | AI-Powered B2B Procurement Platform';
  let description = 'AI-powered B2B procurement and sourcing platform for verified buyers and suppliers.';
  let h1 = 'AI-Powered B2B Procurement Platform';
  let bodyContent = '';
  
  // Procurement signal pages
  const procMatch = cleanPath.match(/^(?:\/[^/]+)?\/procurement\/(.+)$/);
  if (procMatch) {
    const slug = procMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = `${readable} Procurement | ProcureSaathi`;
    description = `Source ${readable} from verified suppliers on ProcureSaathi. Post RFQ, compare quotes, and close deals with AI-powered procurement.`;
    h1 = `${readable} – AI-Powered Procurement`;
    
    // Try to fetch from DB
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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
  
  // Buy pages: /buy-{slug}
  const buyMatch = cleanPath.match(/^\/buy-(.+)$/);
  if (buyMatch) {
    const slug = buyMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = `Buy ${readable} from Verified Suppliers | ProcureSaathi`;
    description = `Source verified ${readable} suppliers on ProcureSaathi. Post RFQ and receive competitive quotes.`;
    h1 = `Buy ${readable} from Verified Suppliers`;
  }
  
  // Supplier pages: /{slug}-suppliers
  const supplierMatch = cleanPath.match(/^\/(.+)-suppliers$/);
  if (supplierMatch) {
    const slug = supplierMatch[1];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = `${readable} Suppliers & Manufacturers | ProcureSaathi`;
    description = `Join ProcureSaathi as a ${readable} supplier. AI detects buyer demand and matches procurement opportunities.`;
    h1 = `${readable} Suppliers & Manufacturers`;
  }
  
  // Category pages: /category/{slug}
  const catMatch = cleanPath.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const slug = catMatch[1].split('/')[0];
    const readable = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = `${readable} B2B Marketplace | ProcureSaathi`;
    description = `Explore ${readable} suppliers and buyers on ProcureSaathi AI-powered B2B procurement platform.`;
    h1 = `${readable} – B2B Marketplace`;
  }

  // Blog pages: /blogs/{slug}
  const blogMatch = cleanPath.match(/^\/blogs\/(.+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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
        // Include first 500 chars of content for crawlers
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
      that connects verified buyers and suppliers using demand intelligence. Our AI tracks live buyer 
      intent across industries and converts it into actionable procurement opportunities.</p>
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

    // Generate pre-rendered HTML for bot
    const html = await generateHTML(targetPath);

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
