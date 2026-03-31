/**
 * Utility to extract top missing slugs from localStorage.
 * Used by admin dashboards to identify high-demand SEO gaps.
 */
export function getTopMissingSlugs(limit = 10): Array<[string, number]> {
  if (typeof window === 'undefined') return [];
  try {
    const stored: Record<string, number> = JSON.parse(
      localStorage.getItem('ps_missing_slugs') || '{}'
    );
    return Object.entries(stored)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  } catch {
    return [];
  }
}
