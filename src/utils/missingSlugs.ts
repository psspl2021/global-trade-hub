/**
 * Utility to extract top missing slugs from localStorage.
 * Used by admin dashboards to identify high-demand SEO gaps.
 */

type SlugEntry = { count: number; lastSeen: number };

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Metals: ['steel', 'tmt', 'iron', 'aluminium', 'copper', 'zinc', 'brass', 'alloy'],
  Pipes: ['pipe', 'tube', 'fitting', 'valve', 'flange'],
  Construction: ['roof', 'cement', 'concrete', 'brick', 'tile', 'rebar'],
  Chemicals: ['chemical', 'acid', 'solvent', 'resin', 'polymer'],
  Packaging: ['packaging', 'carton', 'corrugat', 'wrap', 'container'],
  Electrical: ['wire', 'cable', 'switch', 'panel', 'transformer'],
};

export function inferCategory(slug: string): string {
  const lower = slug.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'Other';
}

export interface MissingSlugInsight {
  slug: string;
  count: number;
  lastSeen: number;
  category: string;
}

export function getTopMissingSlugs(limit = 10): MissingSlugInsight[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored: Record<string, SlugEntry | number> = JSON.parse(
      localStorage.getItem('ps_missing_slugs') || '{}'
    );
    return Object.entries(stored)
      .map(([slug, data]) => {
        // Handle legacy numeric format gracefully
        const entry = typeof data === 'number'
          ? { count: data, lastSeen: 0 }
          : data as SlugEntry;
        return {
          slug,
          count: entry.count,
          lastSeen: entry.lastSeen,
          category: inferCategory(slug),
        };
      })
      .sort((a, b) => {
        const scoreA = a.count * 2 + a.lastSeen / 1e10;
        const scoreB = b.count * 2 + b.lastSeen / 1e10;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}
