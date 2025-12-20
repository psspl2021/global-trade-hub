import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, Download, ExternalLink, CheckCircle, 
  AlertTriangle, Globe, FileCode, Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

export const SitemapManager = () => {
  const [loading, setLoading] = useState(false);
  const [sitemapUrls, setSitemapUrls] = useState<SitemapUrl[]>([]);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    blogs: 0,
    categories: 0,
  });

  useEffect(() => {
    fetchSitemapData();
  }, []);

  const fetchSitemapData = async () => {
    setLoading(true);
    try {
      // Fetch from edge function or static sitemap
      const response = await fetch('/sitemap.xml');
      const text = await response.text();
      
      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const urlElements = xmlDoc.querySelectorAll('url');
      
      const urls: SitemapUrl[] = [];
      urlElements.forEach(urlEl => {
        const loc = urlEl.querySelector('loc')?.textContent || '';
        const lastmod = urlEl.querySelector('lastmod')?.textContent || '';
        const changefreq = urlEl.querySelector('changefreq')?.textContent || 'weekly';
        const priority = parseFloat(urlEl.querySelector('priority')?.textContent || '0.5');
        
        urls.push({ loc, lastmod, changefreq, priority });
      });

      setSitemapUrls(urls);
      setLastGenerated(new Date());
      
      // Calculate stats
      setStats({
        total: urls.length,
        highPriority: urls.filter(u => u.priority >= 0.8).length,
        blogs: urls.filter(u => u.loc.includes('/blogs/')).length,
        categories: urls.filter(u => u.loc.includes('/category/')).length,
      });

    } catch (error) {
      console.error('Error fetching sitemap:', error);
      toast.error('Failed to fetch sitemap');
    } finally {
      setLoading(false);
    }
  };

  const regenerateSitemap = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap');
      
      if (error) throw error;
      
      toast.success('Sitemap regenerated successfully');
      await fetchSitemapData();
    } catch (error) {
      console.error('Error regenerating sitemap:', error);
      toast.error('Failed to regenerate sitemap');
    } finally {
      setLoading(false);
    }
  };

  const downloadSitemap = () => {
    window.open('/sitemap.xml', '_blank');
  };

  const filteredUrls = sitemapUrls.filter(url => 
    url.loc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.9) return 'bg-success';
    if (priority >= 0.7) return 'bg-primary';
    if (priority >= 0.5) return 'bg-warning';
    return 'bg-muted';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sitemap Manager</h2>
          <p className="text-muted-foreground">Manage your XML sitemap for search engine indexing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadSitemap}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={regenerateSitemap} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerate
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total URLs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highPriority}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <FileCode className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.blogs}</p>
                <p className="text-xs text-muted-foreground">Blog Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.categories}</p>
                <p className="text-xs text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* URL List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Indexed URLs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {lastGenerated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastGenerated.toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUrls.slice(0, 50).map((url, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs max-w-[400px] truncate">
                      {url.loc.replace('https://procuresaathi.com', '')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {url.lastmod}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {url.changefreq}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(url.priority)}`} />
                        <span className="text-sm">{url.priority}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" asChild>
                        <a href={url.loc} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredUrls.length > 50 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing 50 of {filteredUrls.length} URLs
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submission Links */}
      <Card>
        <CardHeader>
          <CardTitle>Submit to Search Engines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              <div>
                <p className="font-medium">Google Search Console</p>
                <p className="text-xs text-muted-foreground">Submit sitemap</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
            <a
              href="https://www.bing.com/webmasters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <img src="https://www.bing.com/favicon.ico" alt="Bing" className="w-6 h-6" />
              <div>
                <p className="font-medium">Bing Webmaster Tools</p>
                <p className="text-xs text-muted-foreground">Submit sitemap</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
            <a
              href="https://webmaster.yandex.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <img src="https://yandex.com/favicon.ico" alt="Yandex" className="w-6 h-6" />
              <div>
                <p className="font-medium">Yandex Webmaster</p>
                <p className="text-xs text-muted-foreground">Submit sitemap</p>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SitemapManager;
