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
