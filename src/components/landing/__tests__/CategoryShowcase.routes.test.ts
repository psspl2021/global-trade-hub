/**
 * Page test: every homepage CategoryShowcase tile must resolve to a real
 * /category/:slug route (i.e. no 404 from CategoryLanding).
 *
 * CategoryLanding renders <NotFound /> when no entry in categoriesData has
 * nameToSlug(name) === categorySlug. We mirror that exact check here so the
 * test fails the moment a tile slug drifts from the canonical taxonomy.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { categoriesData } from '@/data/categories';
import { nameToSlug } from '@/pages/CategoryLanding';

function extractTileSlugs(): string[] {
  const src = readFileSync(
    join(process.cwd(), 'src/components/landing/CategoryShowcase.tsx'),
    'utf8'
  );
  const slugs: string[] = [];
  const re = /slug:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) slugs.push(m[1]);
  return slugs;
}

describe('Homepage CategoryShowcase tiles', () => {
  const tileSlugs = extractTileSlugs();
  const validSlugs = new Set(categoriesData.map((c) => nameToSlug(c.name)));

  it('extracts at least one tile slug', () => {
    expect(tileSlugs.length).toBeGreaterThan(0);
  });

  it.each(tileSlugs)('slug "%s" resolves to a real category (no 404)', (slug) => {
    expect(validSlugs.has(slug)).toBe(true);
  });
});
