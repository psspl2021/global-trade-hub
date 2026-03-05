/**
 * Dynamic Sitemap Generator
 * Adjusts priority based on revenue score
 */
import { industrialProducts } from "@/data/industrialProducts";
import { getWeightedLinks } from "@/utils/revenueLinkEngine";

export function generateDynamicSitemapXml(): string {
  const base = "https://www.procuresaathi.com";

  // Get revenue-weighted pages
  const weightedLinks = getWeightedLinks();
  const maxScore = Math.max(...weightedLinks.map(l => l.score), 1);

  // Static high-priority pages
  const lastmod = new Date().toISOString().split('T')[0];

  // Static high-priority pages
  const staticPages = [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/industries`, priority: 0.9 },
    { url: `${base}/global-sourcing-countries`, priority: 0.9 },
    { url: `${base}/steel-comparisons`, priority: 0.85 },
    { url: `${base}/industrial-use-cases`, priority: 0.85 },
    { url: `${base}/industries/metals`, priority: 0.8 },
    { url: `${base}/industries/metals/ferrous`, priority: 0.8 },
    { url: `${base}/industries/metals/non-ferrous`, priority: 0.8 },
    { url: `${base}/industries/polymers`, priority: 0.8 },
    { url: `${base}/industries/industrial-supplies`, priority: 0.8 },
    { url: `${base}/favicon.ico`, priority: 0.1 },
  ];

  // Dynamic priority from revenue score (0.5 to 1.0 range)
  const dynamicPages = weightedLinks.map(link => ({
    url: `${base}${link.url}`,
    priority: Math.round((0.5 + (link.score / maxScore) * 0.5) * 100) / 100,
  }));

  // Activated product pages not in weighted links
  const weightedSlugs = new Set(weightedLinks.map(l => l.slug));
  const productPages = industrialProducts
    .filter(p => p.isActivated && !weightedSlugs.has(p.slug))
    .map(p => ({
      url: `${base}/demand/${p.slug}`,
      priority: 0.7,
    }));

  const allPages = [...staticPages, ...dynamicPages, ...productPages];

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniquePages = allPages.filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${uniquePages.map(page => `
      <url>
        <loc>${page.url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${page.priority >= 0.9 ? 'daily' : 'weekly'}</changefreq>
        <priority>${page.priority}</priority>
      </url>`).join("")}
  </urlset>`;
}
