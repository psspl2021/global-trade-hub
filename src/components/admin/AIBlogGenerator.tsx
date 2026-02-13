/**
 * AI Blog Generator — SEO Research Engine
 * Generates unique, research-backed, image-rich procurement blogs
 * Now powered by live demand intelligence + trending market data
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Save, Eye, FileText, Image, Search, AlertTriangle, CheckCircle2, TrendingUp, Flame, Globe, Zap } from 'lucide-react';
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
  intent?: string;
}

interface TrendingTopic {
  title: string;
  category: string;
  country: string;
  trade_type: string;
  reason: string;
  topic_type: 'price' | 'policy' | 'hotspot';
  heat_score: number;
}

const LOADING_MESSAGES = [
  'Scanning live demand signals…',
  'Analyzing trending market conditions…',
  'AI researching market data…',
  'Analyzing pricing trends & benchmarks…',
  'Reviewing compliance & regulatory landscape…',
  'Evaluating supplier risk factors…',
  'Structuring buyer-intent content…',
  'Injecting contextual images…',
  'Optimizing SEO metadata…',
  'Generating research-backed blog…',
];

const TOPIC_TYPE_CONFIG = {
  price: { icon: TrendingUp, label: 'Price Movement', color: 'text-emerald-600' },
  policy: { icon: Globe, label: 'Policy Change', color: 'text-blue-600' },
  hotspot: { icon: Flame, label: 'Demand Hotspot', color: 'text-orange-600' },
};

export function AIBlogGenerator() {
  const [form, setForm] = useState({ category: '', country: 'India', trade_type: 'Domestic', custom_topic: '' });
  const [generating, setGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [generated, setGenerated] = useState<GeneratedBlog | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<Set<string>>(new Set());

  // Trending topics state
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [fetchingTrending, setFetchingTrending] = useState(false);
  const [trendingMeta, setTrendingMeta] = useState<{ signal_count: number; rfq_count: number } | null>(null);
  const [selectedTrending, setSelectedTrending] = useState<TrendingTopic | null>(null);

  const getGenKey = useCallback(() => {
    return `${form.category}|${form.country}|${form.trade_type}|${form.custom_topic}`.toLowerCase();
  }, [form]);

  const fetchTrendingTopics = async () => {
    setFetchingTrending(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trending-topics', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTrendingTopics(data.topics || []);
      setTrendingMeta({ signal_count: data.signal_count, rfq_count: data.rfq_count });
      toast.success(`Found ${data.topics?.length || 0} trending topics from ${data.signal_count} demand signals`);
    } catch (err: any) {
      console.error('Trending topics error:', err);
      toast.error(err.message || 'Failed to fetch trending topics');
    } finally {
      setFetchingTrending(false);
    }
  };

  const selectTrendingTopic = (topic: TrendingTopic) => {
    setSelectedTrending(topic);
    setForm({
      category: topic.category,
      country: topic.country,
      trade_type: topic.trade_type,
      custom_topic: topic.title,
    });
    toast.info(`Topic loaded: "${topic.title}"`);
  };

  const handleGenerate = async () => {
    if (!form.category) {
      toast.error('Select a category');
      return;
    }

    const genKey = getGenKey();
    if (generatedKeys.has(genKey)) {
      toast.warning('Blog already generated for these exact parameters. Change category, country, trade type, or add a custom topic.');
      return;
    }

    setGenerating(true);
    setGenerated(null);

    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2500);

    try {
      const payload: Record<string, string> = {
        category: form.category,
        country: form.country,
        trade_type: form.trade_type,
        custom_topic: form.custom_topic || '',
      };

      // If generated from a trending topic, pass the reason as context
      if (selectedTrending && form.custom_topic === selectedTrending.title) {
        payload.trending_context = `This topic was identified as trending (heat score: ${selectedTrending.heat_score}/10, type: ${selectedTrending.topic_type}). Reason: ${selectedTrending.reason}`;
      }

      console.log('Sending to generate-blog:', payload);

      const { data, error } = await supabase.functions.invoke('generate-blog', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.blog) {
        setGenerated(data.blog);
        setGeneratedKeys(prev => new Set(prev).add(genKey));
        toast.success('Blog generated with live market intelligence! Review before publishing.');
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
      const { data: existing } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', generated.slug)
        .maybeSingle();

      if (existing) {
        toast.error('A blog with this slug already exists. Modify the title or topic.');
        setSaving(false);
        return;
      }

      const categoryLabel = form.trade_type === 'Export' ? 'Export Guide' :
                            form.trade_type === 'Import' ? 'Import Guide' :
                            form.category.includes('Steel') ? 'Industry News' :
                            form.category.includes('Chemical') ? 'Procurement Tips' : 'Buyer Guide';

      const { error } = await supabase.from('blogs').insert({
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: generated.content,
        cover_image: generated.cover_image || null,
        category: categoryLabel,
        author_name: 'ProcureSaathi AI',
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      });

      if (error) throw error;
      toast.success(publish ? 'Blog published successfully!' : 'Blog saved as draft');
      setGenerated(null);
      setSelectedTrending(null);
      setForm(p => ({ ...p, custom_topic: '' }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trending Topics Panel */}
      <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Market Topics
            <Badge variant="secondary" className="text-xs">Live Demand Intelligence</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            AI analyzes your platform's demand signals + RFQ activity to suggest high-impact blog topics grounded in real market conditions.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchTrendingTopics}
              disabled={fetchingTrending}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {fetchingTrending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {fetchingTrending ? 'Scanning signals…' : 'Fetch Trending Topics'}
            </Button>
            {trendingMeta && (
              <span className="text-xs text-muted-foreground">
                Based on {trendingMeta.signal_count} demand signals & {trendingMeta.rfq_count} RFQs (last 30 days)
              </span>
            )}
          </div>

          {trendingTopics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
              {trendingTopics.map((topic, idx) => {
                const typeConfig = TOPIC_TYPE_CONFIG[topic.topic_type] || TOPIC_TYPE_CONFIG.hotspot;
                const TypeIcon = typeConfig.icon;
                const isSelected = selectedTrending?.title === topic.title;

                return (
                  <button
                    key={idx}
                    onClick={() => selectTrendingTopic(topic)}
                    className={`text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <TypeIcon className={`h-4 w-4 mt-0.5 shrink-0 ${typeConfig.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight line-clamp-2">{topic.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] h-5">{topic.category}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5">{topic.country}</Badge>
                          <Badge variant="outline" className="text-[10px] h-5">{topic.trade_type}</Badge>
                          <span className="text-[10px] text-orange-600 font-semibold">🔥 {topic.heat_score}/10</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{topic.reason}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            AI Blog Generator
            <Badge variant="secondary" className="text-xs">SEO Research Engine + Live Data</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generates unique, research-backed blogs powered by live demand intelligence, pricing tables, and buyer/supplier-intent CTAs.
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

          {/* Intent indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={form.trade_type === 'Export' ? 'default' : 'secondary'} className="text-xs">
              {form.trade_type === 'Export' ? '🏭 Supplier Intent' : '🛒 Buyer Intent'}
            </Badge>
            <span className="text-muted-foreground">
              {form.trade_type === 'Domestic' && '→ Pricing, compliance, GST, regional suppliers'}
              {form.trade_type === 'Import' && '→ Duties, HS codes, landed cost, forex'}
              {form.trade_type === 'Export' && '→ Demand trends, DGFT, documentation, FOB/CIF'}
            </span>
            {selectedTrending && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                🔥 Trending Topic Selected
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <Label>Custom Topic / Trending Topic</Label>
            <Input
              value={form.custom_topic}
              onChange={e => {
                setForm(p => ({ ...p, custom_topic: e.target.value }));
                if (selectedTrending && e.target.value !== selectedTrending.title) {
                  setSelectedTrending(null);
                }
              }}
              placeholder="e.g. MS Plate price trends Q2 2026, or click a trending topic above"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={generating || !form.category} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {generating ? 'Researching…' : 'Generate Blog with AI'}
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
              {generated.intent && (
                <Badge variant="outline" className="text-xs ml-2">
                  {generated.intent === 'supplier' ? '🏭 Supplier' : '🛒 Buyer'} Intent
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
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
                  <span className={`text-xs ml-1 ${generated.meta_title.length <= 60 ? 'text-green-600' : 'text-red-500'}`}>
                    ({generated.meta_title.length}/60)
                  </span>
                </div>
              )}
              {generated.meta_description && (
                <div>
                  <span className="text-xs text-muted-foreground">Meta Desc: </span>
                  <span className="text-sm">{generated.meta_description}</span>
                  <span className={`text-xs ml-1 ${generated.meta_description.length <= 160 ? 'text-green-600' : 'text-red-500'}`}>
                    ({generated.meta_description.length}/160)
                  </span>
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

            {/* Quality checks */}
            <div className="flex flex-wrap gap-3 text-xs">
              {generated.inline_images && generated.inline_images.length > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> {generated.inline_images.length} inline images
                </span>
              )}
              {generated.cover_image && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Cover image
                </span>
              )}
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                ~{Math.round(generated.content.replace(/<[^>]*>/g, '').split(/\s+/).length)} words
              </span>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Content Preview</Label>
              <div
                className="prose prose-sm max-w-none mt-2 border rounded-lg p-4 max-h-[500px] overflow-y-auto bg-background
                  [&_figure.blog-image]:my-6 [&_figure.blog-image_img]:rounded-lg [&_figure.blog-image_img]:w-full [&_figure.blog-image_img]:h-auto
                  [&_table]:w-full [&_table]:border-collapse [&_th]:bg-muted [&_th]:p-2 [&_th]:border [&_td]:p-2 [&_td]:border
                  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2"
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
              <p>Review content before publishing. All pricing references are illustrative ranges, not guarantees.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
