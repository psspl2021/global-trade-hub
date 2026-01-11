import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, Sparkles, ExternalLink, Eye, 
  TrendingUp, RefreshCw, Trash2, Edit 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LandingPage {
  id: string;
  category: string;
  country: string;
  slug: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  meta_title: string;
  meta_description: string;
  is_active: boolean;
  view_count: number;
  conversion_count: number;
  created_at: string;
}

export function AISalesLandingPages() {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState({
    category: '',
    country: '',
  });
  const [generatedPage, setGeneratedPage] = useState<Partial<LandingPage> | null>(null);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-landing', {
        body: { action: 'get_pages' },
      });

      if (response.error) throw response.error;
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      toast.error('Failed to load landing pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleGenerate = async () => {
    if (!generatorConfig.category || !generatorConfig.country) {
      toast.error('Please fill category and country');
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-landing', {
        body: { 
          action: 'generate_page',
          ...generatorConfig,
        },
      });

      if (response.error) throw response.error;
      setGeneratedPage(response.data.page);
      toast.success('Landing page content generated!');
    } catch (error) {
      console.error('Failed to generate page:', error);
      toast.error('Failed to generate page');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePage = async () => {
    if (!generatedPage) return;

    try {
      const response = await supabase.functions.invoke('ai-sales-landing', {
        body: { action: 'create_page', page: generatedPage },
      });

      if (response.error) throw response.error;
      toast.success('Landing page created!');
      setShowGenerator(false);
      setGeneratedPage(null);
      setGeneratorConfig({ category: '', country: '' });
      fetchPages();
    } catch (error) {
      console.error('Failed to save page:', error);
      toast.error('Failed to save page');
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const response = await supabase.functions.invoke('ai-sales-landing', {
        body: { action: 'toggle_active', id, is_active: !is_active },
      });

      if (response.error) throw response.error;
      toast.success(`Page ${!is_active ? 'activated' : 'deactivated'}`);
      fetchPages();
    } catch (error) {
      console.error('Failed to toggle page:', error);
      toast.error('Failed to update page');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this landing page?')) return;

    try {
      const response = await supabase.functions.invoke('ai-sales-landing', {
        body: { action: 'delete_page', id },
      });

      if (response.error) throw response.error;
      toast.success('Landing page deleted');
      fetchPages();
    } catch (error) {
      console.error('Failed to delete page:', error);
      toast.error('Failed to delete page');
    }
  };

  const getConversionRate = (views: number, conversions: number) => {
    if (views === 0) return '0%';
    return `${((conversions / views) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Landing Pages</h3>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerator(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Page
          </Button>
          <Button variant="outline" onClick={fetchPages}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{pages.length}</div>
          <div className="text-sm text-muted-foreground">Total Pages</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {pages.reduce((sum, p) => sum + (p.view_count || 0), 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Views</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {pages.reduce((sum, p) => sum + (p.conversion_count || 0), 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Conversions</div>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Conversions</TableHead>
                <TableHead className="text-center">Rate</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No landing pages yet. Create your first SEO page!
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="font-medium">{page.category}</div>
                      <div className="text-sm text-muted-foreground">{page.country}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        /{page.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" />
                        {page.view_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {page.conversion_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        Number(getConversionRate(page.view_count, page.conversion_count).replace('%', '')) > 5 
                          ? 'default' 
                          : 'secondary'
                      }>
                        {getConversionRate(page.view_count, page.conversion_count)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={page.is_active}
                        onCheckedChange={() => handleToggleActive(page.id, page.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleDelete(page.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generator Dialog */}
      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Create AI Landing Page
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Category</Label>
                <Input 
                  placeholder="e.g., Steel, Chemicals, Textiles"
                  value={generatorConfig.category}
                  onChange={(e) => setGeneratorConfig({...generatorConfig, category: e.target.value})}
                />
              </div>
              <div>
                <Label>Target Country</Label>
                <Input 
                  placeholder="e.g., UAE, USA, Germany"
                  value={generatorConfig.country}
                  onChange={(e) => setGeneratorConfig({...generatorConfig, country: e.target.value})}
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Page Content
                </>
              )}
            </Button>

            {generatedPage && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <h4 className="font-medium">Preview:</h4>
                
                <div className="bg-background rounded-lg p-6 text-center space-y-4">
                  <Badge variant="outline">/{generatedPage.slug}</Badge>
                  <h1 className="text-2xl font-bold">{generatedPage.headline}</h1>
                  <p className="text-muted-foreground">{generatedPage.subheadline}</p>
                  <Button size="lg">{generatedPage.cta_text}</Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Meta Title:</strong> {generatedPage.meta_title}</p>
                  <p><strong>Meta Description:</strong> {generatedPage.meta_description}</p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSavePage} className="flex-1">
                    Create Page
                  </Button>
                  <Button variant="outline" onClick={handleGenerate}>
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
