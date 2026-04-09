/**
 * Blog Content Pipeline — auto-generates SEO blogs via AI edge function,
 * with internal links to /solutions/ conversion pages.
 */

import { supabase } from '@/integrations/supabase/client';
import { highIntentBlogs, type BlogKeyword } from '@/data/highIntentBlogs';

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface BlogPipelineResult {
  keyword: string;
  slug: string;
  success: boolean;
  message: string;
}

/**
 * Generate and publish a single blog via the existing generate-blog edge function.
 */
export async function generateAndPublishBlog(entry: BlogKeyword): Promise<BlogPipelineResult> {
  const slug = slugify(entry.keyword);
  try {
    const { data, error } = await supabase.functions.invoke('generate-blog', {
      body: {
        category: entry.category,
        country: 'India',
        trade_type: entry.tradeType,
        custom_topic: entry.keyword,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    // After publishing, inject internal link to the matching solution page
    await injectSolutionLink(slug, entry.linkedSolutionSlug);

    return { keyword: entry.keyword, slug, success: true, message: data?.message || 'Published' };
  } catch (err: any) {
    console.error(`❌ Blog failed: ${entry.keyword}`, err);
    return { keyword: entry.keyword, slug, success: false, message: err?.message || 'Unknown error' };
  }
}

/**
 * Append an internal link CTA to the blog content pointing to the matching solution page.
 */
async function injectSolutionLink(blogSlug: string, solutionSlug: string): Promise<void> {
  try {
    const { data: blog } = await supabase
      .from('blogs')
      .select('id, content')
      .eq('slug', blogSlug)
      .single();

    if (!blog) return;

    const linkBlock = `
<div style="margin-top:2rem;padding:1.5rem;border:1px solid #e5e7eb;border-radius:12px;background:#f0fdf4;">
  <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">Ready to Save on Procurement?</h3>
  <p style="margin-bottom:1rem;">Compare verified suppliers and get the lowest price via reverse auction.</p>
  <a href="/solutions/${solutionSlug}" style="display:inline-block;padding:0.75rem 1.5rem;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Start Reverse Auction →</a>
</div>`;

    // Only inject if not already present
    if (!blog.content.includes(`/solutions/${solutionSlug}`)) {
      await supabase
        .from('blogs')
        .update({ content: blog.content + linkBlock })
        .eq('id', blog.id);
    }
  } catch (err) {
    console.error(`Link injection failed for blog ${blogSlug}:`, err);
  }
}

/**
 * Run the full blog pipeline for all high-intent keywords.
 */
export async function runFullBlogPipeline(
  onProgress?: (result: BlogPipelineResult, index: number, total: number) => void,
  delayMs = 2000
): Promise<BlogPipelineResult[]> {
  const results: BlogPipelineResult[] = [];

  for (let i = 0; i < highIntentBlogs.length; i++) {
    const result = await generateAndPublishBlog(highIntentBlogs[i]);
    results.push(result);
    onProgress?.(result, i + 1, highIntentBlogs.length);

    if (i < highIntentBlogs.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Run pipeline for a specific category only.
 */
export async function runCategoryBlogPipeline(
  category: string,
  onProgress?: (result: BlogPipelineResult, index: number, total: number) => void,
  delayMs = 2000
): Promise<BlogPipelineResult[]> {
  const results: BlogPipelineResult[] = [];
  const entries = highIntentBlogs.filter(b => b.category === category);

  for (let i = 0; i < entries.length; i++) {
    const result = await generateAndPublishBlog(entries[i]);
    results.push(result);
    onProgress?.(result, i + 1, entries.length);

    if (i < entries.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}
