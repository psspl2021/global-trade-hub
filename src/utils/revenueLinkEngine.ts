import { getPriorityScore, skuPriorityData } from "@/data/skuPriority";
import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";

export function getWeightedLinks() {
  const allPages = [
    // Demand pages are the commercial core — always included with a boost
    ...skuPriorityData.map(sku => ({
      slug: sku.slug,
      demandSlug: sku.slug,
      url: `/demand/${sku.slug}`,
      label: sku.slug.replace(/-/g, " "),
    })),
    ...comparisonPagesData.map(p => ({
      slug: p.slug,
      demandSlug: p.relatedDemandSlug,
      url: `/compare/${p.slug}`,
      label: `${p.gradeA} vs ${p.gradeB}`,
    })),
    ...useCasePagesData.map(p => ({
      slug: p.slug,
      demandSlug: p.relatedDemandSlug,
      url: `/use-case/${p.slug}`,
      label: p.title.split("–")[0].trim(),
    })),
  ];

  return allPages
    .map(p => ({
      ...p,
      score: getPriorityScore(p.demandSlug),
    }))
    .sort((a, b) => b.score - a.score);
}

export function getTopRevenueLinks(limit = 7) {
  return getWeightedLinks().slice(0, limit);
}
