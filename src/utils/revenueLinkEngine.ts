import { getPriorityScore, skuPriorityData } from "@/data/skuPriority";
import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";
import { generateAllImportSlugs } from "@/utils/corridorLinkEngine";
import { createDampeningTracker } from "@/utils/revenueDynamicEngine";

export function getWeightedLinks() {
  const allPages = [
    // Demand pages — commercial core
    ...skuPriorityData.map(sku => ({
      slug: sku.slug,
      demandSlug: sku.slug,
      url: `/demand/${sku.slug}`,
      label: sku.slug.replace(/-/g, " "),
    })),
    // Comparison pages
    ...comparisonPagesData.map(p => ({
      slug: p.slug,
      demandSlug: p.relatedDemandSlug,
      url: `/compare/${p.slug}`,
      label: `${p.gradeA} vs ${p.gradeB}`,
    })),
    // Use-case pages
    ...useCasePagesData.map(p => ({
      slug: p.slug,
      demandSlug: p.relatedDemandSlug,
      url: `/use-case/${p.slug}`,
      label: p.title.split("–")[0].trim(),
    })),
    // Auto-generated import corridor pages
    ...generateAllImportSlugs().map(c => ({
      slug: c.slug,
      demandSlug: c.skuSlug,
      url: `/import/${c.slug}`,
      label: `${c.skuLabel} from ${c.country}`,
    })),
  ];

  // Score and apply authority dampening by demandSlug
  const tracker = createDampeningTracker();

  return allPages
    .map(p => ({
      ...p,
      rawScore: getPriorityScore(p.demandSlug),
    }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .map(p => ({
      ...p,
      score: tracker.apply(p.demandSlug, p.rawScore),
    }))
    .sort((a, b) => b.score - a.score);
}

export function getTopRevenueLinks(limit = 7) {
  return getWeightedLinks().slice(0, limit);
}
