import { industrialProducts } from "@/data/industrialProducts";
import { demandProducts } from "@/data/demandProducts";

export function generateSitemapUrls(): string[] {
  const base = "https://www.procuresaathi.com";

  const productUrls = industrialProducts
    .filter(p => p.isActivated)
    .map(p => `${base}/demand/${p.slug}`);

  const demandUrls = demandProducts.map(p => `${base}/demand/${p.slug}`);

  const industryUrls = [
    `${base}/industries`,
    `${base}/industries/metals`,
    `${base}/industries/metals/ferrous`,
    `${base}/industries/metals/non-ferrous`,
    `${base}/industries/polymers`,
    `${base}/industries/industrial-supplies`,
  ];

  // Deduplicate
  return [...new Set([...industryUrls, ...productUrls, ...demandUrls])];
}

export function generateSitemapXml(): string {
  const base = "https://www.procuresaathi.com";
  const lastmod = new Date().toISOString().split('T')[0];

  // High-priority: demand pages (commercial core)
  const demandUrls = [
    ...new Set([
      ...industrialProducts.filter(p => p.isActivated).map(p => p.slug),
      ...demandProducts.map(p => p.slug),
    ])
  ].map(slug => ({
    url: `${base}/demand/${slug}`,
    priority: 0.9,
  }));

  // Medium-priority: industry taxonomy
  const industryUrls = [
    `${base}/industries`,
    `${base}/industries/metals`,
    `${base}/industries/metals/ferrous`,
    `${base}/industries/metals/non-ferrous`,
    `${base}/industries/polymers`,
    `${base}/industries/industrial-supplies`,
  ].map(url => ({ url, priority: 0.8 }));

  // Core pages
  const coreUrls = [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/demand`, priority: 0.9 },
    { url: `${base}/blogs`, priority: 0.7 },
  ];

  const allUrls = [...coreUrls, ...industryUrls, ...demandUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allUrls.map(({ url, priority }) => `
      <url>
        <loc>${url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority}</priority>
      </url>`).join("")}
  </urlset>`;
}
