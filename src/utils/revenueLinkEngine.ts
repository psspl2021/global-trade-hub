import { getPriorityScore } from "@/data/skuPriority";
import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";

export function getWeightedLinks() {
  const allPages = [
    ...comparisonPagesData.map(p => ({
      slug: p.slug,
      url: `/compare/${p.slug}`,
      label: `${p.gradeA} vs ${p.gradeB}`,
    })),
    ...useCasePagesData.map(p => ({
      slug: p.slug,
      url: `/use-case/${p.slug}`,
      label: p.title.split("–")[0].trim(),
    })),
  ];

  return allPages
    .map(p => ({
      ...p,
      score: getPriorityScore(p.slug),
    }))
    .sort((a, b) => b.score - a.score);
}

export function getTopRevenueLinks(limit = 7) {
  return getWeightedLinks().slice(0, limit);
}
