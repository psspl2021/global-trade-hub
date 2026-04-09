/**
 * SEO Pipeline — auto-publish + internal linking engine.
 * Generates AI-powered demand pages via edge function,
 * then injects bidirectional internal links.
 */

import { supabase } from '@/integrations/supabase/client';
import { highIntentPages } from '@/data/highIntentPages';

function keywordToSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export interface PipelineResult {
  keyword: string;
  slug: string;
  success: boolean;
  message: string;
}

/**
 * Generate and publish a single page via the edge function.
 */
export async function generateAndPublishPage(keyword: string): Promise<PipelineResult> {
  const slug = keywordToSlug(keyword);
  try {
    const { data, error } = await supabase.functions.invoke('generate-demand-page', {
      body: { slug },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { keyword, slug, success: true, message: data?.message || 'Published' };
  } catch (err: any) {
    console.error(`❌ Failed: ${keyword}`, err);
    return { keyword, slug, success: false, message: err?.message || 'Unknown error' };
  }
}

/**
 * Inject internal links for a given slug based on category + top performers.
 */
export async function injectInternalLinks(slug: string, categorySlug: string): Promise<void> {
  try {
    // Get related pages from same category
    const { data: related } = await supabase
      .from('demand_generated')
      .select('slug')
      .eq('category_slug', categorySlug)
      .eq('status', 'active')
      .neq('slug', slug)
      .limit(5);

    const relatedSlugs = (related || []).map(r => r.slug);

    // Update the page with related links
    if (relatedSlugs.length > 0) {
      await supabase
        .from('demand_generated')
        .update({ related_slugs: relatedSlugs })
        .eq('slug', slug);
    }
  } catch (err) {
    console.error(`Link injection failed for ${slug}:`, err);
  }
}

/**
 * Run the full pipeline for all 100 high-intent keywords.
 * Returns results as they complete via callback.
 */
export async function runFullSEOPipeline(
  onProgress?: (result: PipelineResult, index: number, total: number) => void,
  delayMs = 1200
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];
  const keywords = highIntentPages.map(p => p.keyword);

  for (let i = 0; i < keywords.length; i++) {
    const result = await generateAndPublishPage(keywords[i]);
    results.push(result);
    onProgress?.(result, i + 1, keywords.length);

    // Post-publish: inject internal links
    if (result.success) {
      const page = highIntentPages.find(p => p.keyword === keywords[i]);
      if (page) {
        await injectInternalLinks(result.slug, page.categorySlug);
      }
    }

    // Rate-limit delay
    if (i < keywords.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Run pipeline for a specific category only.
 */
export async function runCategoryPipeline(
  categorySlug: string,
  onProgress?: (result: PipelineResult, index: number, total: number) => void,
  delayMs = 1200
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];
  const pages = highIntentPages.filter(p => p.categorySlug === categorySlug);

  for (let i = 0; i < pages.length; i++) {
    const result = await generateAndPublishPage(pages[i].keyword);
    results.push(result);
    onProgress?.(result, i + 1, pages.length);

    if (result.success) {
      await injectInternalLinks(result.slug, categorySlug);
    }

    if (i < pages.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}
