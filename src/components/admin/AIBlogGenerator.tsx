/**
 * AI Blog Generator — Admin Tool
 * Generates buyer-intent SEO blogs using Lovable AI
 * Inputs: category, country, trade_type
 * Outputs: SEO title, buyer-intent content, CTA blocks
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Save, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Steel & Metals', 'Chemicals & Solvents', 'Polymers & Plastics',
  'Construction Materials', 'Textiles & Fabrics', 'Food & Agriculture',
  'Pulses & Spices', 'Industrial Supplies', 'Packaging Materials',
  'Minerals & Mining'
];

const COUNTRIES = ['India', 'UAE', 'Saudi Arabia', 'USA', 'UK', 'Germany', 'Singapore', 'South Africa'];
const TRADE_TYPES = ['Domestic', 'Import', 'Export'];

export function AIBlogGenerator() {
  const [form, setForm] = useState({ category: '', country: 'India', trade_type: 'Domestic', custom_topic: '' });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ title: string; slug: string; excerpt: string; content: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!form.category) {
      toast.error('Select a category');
      return;
    }

    setGenerating(true);
    setGenerated(null);

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
        toast.success('Blog generated! Review and save.');
      }
    } catch (err: any) {
      console.error('Blog gen error:', err);
      toast.error(err.message || 'Failed to generate blog');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!generated) return;
    setSaving(true);

    try {
      const { error } = await supabase.from('blogs').insert({
        title: generated.title,
        slug: generated.slug,
        excerpt: generated.excerpt,
        content: generated.content,
        category: form.category.includes('Steel') ? 'Industry News' :
                  form.category.includes('Chemical') ? 'Procurement Tips' : 'Buyer Guide',
        author_name: 'ProcureSaathi AI',
        is_published: publish,
        published_at: publish ? new Date().toISOString() : null,
      });

      if (error) throw error;
      toast.success(publish ? 'Blog published!' : 'Blog saved as draft');
      setGenerated(null);
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
            <Badge variant="secondary" className="text-xs">Buyer-Intent SEO</Badge>
          </CardTitle>
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
            <Label>Custom Topic (optional)</Label>
            <Input
              value={form.custom_topic}
              onChange={e => setForm(p => ({ ...p, custom_topic: e.target.value }))}
              placeholder="e.g. MS Plate price per ton in India 2026"
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !form.category} className="gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate Blog with AI'}
          </Button>
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
            <div>
              <Label className="text-xs text-muted-foreground">Content</Label>
              <div 
                className="prose prose-sm max-w-none mt-2 border rounded-lg p-4 max-h-[400px] overflow-y-auto bg-muted/20"
                dangerouslySetInnerHTML={{ __html: generated.content }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Publish Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
