import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";

export function getRelatedComparisons(currentSlug: string, limit = 3) {
  return comparisonPagesData
    .filter(p => p.slug !== currentSlug)
    .slice(0, limit);
}

export function getRelatedUseCases(currentSlug: string, limit = 3) {
  return useCasePagesData
    .filter(p => p.slug !== currentSlug)
    .slice(0, limit);
}

export function getUseCasesForComparison(comparisonSlug: string) {
  return useCasePagesData.filter(uc =>
    uc.relatedComparisonSlugs.includes(comparisonSlug)
  );
}

export function getComparisonsForUseCase(useCaseSlug: string) {
  const useCase = useCasePagesData.find(p => p.slug === useCaseSlug);
  if (!useCase) return [];
  return comparisonPagesData.filter(c =>
    useCase.relatedComparisonSlugs.includes(c.slug)
  );
}
