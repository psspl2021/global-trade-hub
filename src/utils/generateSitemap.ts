import { industrialProducts } from "@/data/industrialProducts";

export function generateSitemapUrls(): string[] {
  const base = "https://www.procuresaathi.com";

  const productUrls = industrialProducts
    .filter(p => p.isActivated)
    .map(p => `${base}/demand/${p.slug}`);

  const industryUrls = [
    `${base}/industries`,
    `${base}/industries/metals`,
    `${base}/industries/metals/ferrous`,
    `${base}/industries/metals/non-ferrous`,
    `${base}/industries/polymers`,
    `${base}/industries/industrial-supplies`,
  ];

  return [...industryUrls, ...productUrls];
}

export function generateSitemapXml(): string {
  const base = "https://www.procuresaathi.com";

  const urls = [
    `${base}/industries`,
    `${base}/industries/metals`,
    `${base}/industries/metals/ferrous`,
    `${base}/industries/metals/non-ferrous`,
    `${base}/industries/polymers`,
    `${base}/industries/industrial-supplies`,
    ...industrialProducts
      .filter(p => p.isActivated)
      .map(p => `${base}/demand/${p.slug}`)
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
      <url>
        <loc>${url}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
      </url>`).join("")}
  </urlset>`;
}
