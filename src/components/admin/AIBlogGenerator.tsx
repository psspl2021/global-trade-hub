/**
 * AI Blog Generator — Admin Tool (Upgraded)
 * Uses Lovable AI to generate research-backed, image-rich, SEO-optimized procurement blogs
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Save, Eye, FileText, Image, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Steel & Metals', 'Chemicals & Solvents', 'Polymers & Plastics',
  'Construction Materials', 'Textiles & Fabrics', 'Food & Agriculture',
  'Pulses & Spices', 'Industrial Supplies', 'Packaging Materials',
  'Minerals & Mining', 'Rubber Products', 'Auto Components',
  'Electrical Equipment', 'Paper & Board'
];

const COUNTRIES = [
  'India', 'UAE', 'Saudi Arabia', 'USA', 'UK', 'Germany',
  'Singapore', 'South Africa', 'Turkey', 'Vietnam', 'Indonesia',
  'Bangladesh', 'Kenya', 'Nigeria', 'Brazil'
];

const TRADE_TYPES = ['Domestic', 'Import', 'Export'];

interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  seo_keywords?: string;
  cover_image?: string;
  inline_images?: string[];
}

const LOADING_MESSAGES = [
  'AI researching market data…',
  'Analyzing pricing trends…',
  'Reviewing compliance requirements…',
  'Structuring buyer-intent content…',
  'Generating SEO-optimized blog…',
];

export function AIBlogGenerator() {
  const [form, setForm] = useState({ category: '', country: 'India', trade_type: 'Domestic', custom_topic: '' });
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [generated, setGenerated] = useState<GeneratedBlog | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastGenKey, setLastGenKey] = useState('');

  const getGenKey = useCallback(() => {
    return `${form.category}|${form.country}|${form.trade_type}|${form.custom_topic}`;
  }, [form]);

  const handleGenerate = async () => {
    if (!form.category) {
      toast.error('Select a category');
      return;
    }

    const genKey = getGenKey();
    if (genKey === lastGenKey && generated) {
      toast.warning('Same parameters — change category, country, or trade type for a unique blog');
      return;
    }

    setGenerating(true);
    setGenerated(null);

    // Rotate loading messages
    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-blog', {
        body: {
          category: form.category,
          country: form.country,
          trade_type: form.trade_type,
          custom_topic: form.custom_topic || null,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.blog) {
        setGenerated(data.blog);
        setLastGenKey(genKey);
        toast.success('Blog generated with AI research! Review and publish.');
      }
    } catch (err: any) {
      console.error('Blog gen error:', err);
      toast.error(err.message || 'Failed to generate blog');
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setLoadingMsg('');
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!generated) return;
    setSaving(true);

    try {
      // Check for duplicate slug
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', generated.slug)
        .maybeSingle();

      if (existing) {
        toast.error('A blog with this slug already exists. Try a different topic or modify the title.');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('blogs').insert({
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: generated.content,
        cover_image: generated.cover_image || null,
        category: form.category.includes('Steel') ? 'Industry News' :
                  form.category.includes('Chemical') ? 'Procurement Tips' :
                  form.trade_type === 'Export' ? 'Export Guide' :
                  form.trade_type === 'Import' ? 'Import Guide' : 'Buyer Guide',
        author_name: 'ProcureSaathi AI',
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      });

      if (error) throw error;
      toast.success(publish ? 'Blog published successfully!' : 'Blog saved as draft');
      setGenerated(null);
      setLastGenKey('');
      setForm(p => ({ ...p, custom_topic: '' }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Blog Generator
            <Badge variant="secondary" className="text-xs">AI-Powered Research</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generates unique, research-backed procurement blogs with images, SEO metadata, and buyer-intent CTAs.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Country / Region</Label>
              <Select value={form.country} onValueChange={v => setForm(p => ({ ...p, country: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Trade Type</Label>
              <Select value={form.trade_type} onValueChange={v => setForm(p => ({ ...p, trade_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRADE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Custom Topic (optional — overrides default angle)</Label>
            <Input
              value={form.custom_topic}
              onChange={e => setForm(p => ({ ...p, custom_topic: e.target.value }))}
              placeholder="e.g. MS Plate price per ton in India 2026, DGFT export incentives for chemicals"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating || !form.category} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {generating ? 'Generating…' : 'Generate Blog with AI'}
            </Button>
            {form.category && form.country && (
              <span className="text-xs text-muted-foreground">
                → {form.category} × {form.country} × {form.trade_type}
              </span>
            )}
          </div>

          {generating && loadingMsg && (
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingMsg}
            </div>
          )}
        </CardContent>
      </Card>

      {generated && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Generated Blog Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image Preview */}
            {generated.cover_image && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" /> Cover Image
                </Label>
                <img
                  src={generated.cover_image}
                  alt={`Cover: ${generated.title}`}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            {/* SEO Metadata */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <Label className="text-xs text-muted-foreground font-semibold">SEO Metadata</Label>
              {generated.meta_title && (
                <div>
                  <span className="text-xs text-muted-foreground">Meta Title: </span>
                  <span className="text-sm font-medium text-primary">{generated.meta_title}</span>
                  <span className="text-xs text-muted-foreground ml-1">({generated.meta_title.length} chars)</span>
                </div>
              )}
              {generated.meta_description && (
                <div>
                  <span className="text-xs text-muted-foreground">Meta Description: </span>
                  <span className="text-sm">{generated.meta_description}</span>
                  <span className="text-xs text-muted-foreground ml-1">({generated.meta_description.length} chars)</span>
                </div>
              )}
              {generated.seo_keywords && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {generated.seo_keywords.split(',').map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <h2 className="text-xl font-bold">{generated.title}</h2>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Slug</Label>
              <p className="text-sm text-muted-foreground font-mono">/{generated.slug}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Excerpt</Label>
              <p className="text-sm">{generated.excerpt}</p>
            </div>

            {/* Inline Images Count */}
            {generated.inline_images && generated.inline_images.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="h-4 w-4" />
                {generated.inline_images.length} contextual images embedded in content
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Content Preview</Label>
              <div
                className="prose prose-sm max-w-none mt-2 border rounded-lg p-4 max-h-[500px] overflow-y-auto bg-muted/20
                  prose-img:rounded-lg prose-img:shadow-md prose-figure:my-4
                  prose-table:border prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border"
                dangerouslySetInnerHTML={{ __html: generated.content }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Publish Now
              </Button>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/50 border border-accent rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
              <p>Review content before publishing. AI-generated blogs should be fact-checked for accuracy. All pricing references are illustrative ranges.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
