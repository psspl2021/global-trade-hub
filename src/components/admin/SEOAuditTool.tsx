import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, CheckCircle, AlertTriangle, XCircle, 
  RefreshCw, FileText, Image, Link2, Globe,
  Zap, BarChart3, TrendingUp, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  category: string;
  message: string;
  recommendation?: string;
}

interface PageAudit {
  url: string;
  score: number;
  title: string;
  description: string;
  issues: SEOIssue[];
  metrics: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    imageAltMissing: number;
    wordCount: number;
    hasCanonical: boolean;
    hasStructuredData: boolean;
  };
}

const seoChecks = {
  title: {
    minLength: 30,
    maxLength: 60,
    getMessage: (length: number) => {
      if (length === 0) return { type: 'error', message: 'Missing title tag' };
      if (length < 30) return { type: 'warning', message: `Title too short (${length} chars). Aim for 30-60 characters.` };
      if (length > 60) return { type: 'warning', message: `Title too long (${length} chars). Keep under 60 characters.` };
      return { type: 'success', message: `Title length optimal (${length} chars)` };
    }
  },
  description: {
    minLength: 120,
    maxLength: 160,
    getMessage: (length: number) => {
      if (length === 0) return { type: 'error', message: 'Missing meta description' };
      if (length < 120) return { type: 'warning', message: `Description too short (${length} chars). Aim for 120-160 characters.` };
      if (length > 160) return { type: 'warning', message: `Description too long (${length} chars). Keep under 160 characters.` };
      return { type: 'success', message: `Description length optimal (${length} chars)` };
    }
  }
};

export const SEOAuditTool = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<PageAudit | null>(null);

  const runAudit = async () => {
    if (!url) {
      toast.error('Please enter a URL to audit');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate audit - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAudit: PageAudit = {
        url,
        score: 78,
        title: 'Sample Page Title | ProcureSaathi',
        description: 'This is a sample meta description for the page being audited.',
        issues: [
          { type: 'success', category: 'Title', message: 'Title tag present and optimized' },
          { type: 'success', category: 'Meta', message: 'Meta description present' },
          { type: 'warning', category: 'Images', message: '2 images missing alt attributes', recommendation: 'Add descriptive alt text to all images' },
          { type: 'success', category: 'Structure', message: 'Single H1 tag found' },
          { type: 'success', category: 'Schema', message: 'Structured data detected (Organization, BreadcrumbList)' },
          { type: 'warning', category: 'Content', message: 'Word count is 450 - consider adding more content', recommendation: 'Aim for 800+ words for comprehensive coverage' },
          { type: 'success', category: 'Technical', message: 'Canonical URL set correctly' },
        ],
        metrics: {
          titleLength: 35,
          descriptionLength: 142,
          h1Count: 1,
          imageAltMissing: 2,
          wordCount: 450,
          hasCanonical: true,
          hasStructuredData: true,
        }
      };

      setAudit(mockAudit);
      toast.success('Audit complete');
    } catch (error) {
      toast.error('Failed to run audit');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Audit Tool</h2>
          <p className="text-muted-foreground">Analyze pages for SEO optimization opportunities</p>
        </div>
      </div>

      {/* URL Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter page URL (e.g., /blogs/procurement-tips)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={runAudit} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Run Audit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {audit && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Score Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${getScoreColor(audit.score)}`}>
                  {audit.score}
                </div>
                <div className="flex-1">
                  <Progress value={audit.score} className={`h-3 ${getScoreBg(audit.score)}`} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {audit.score >= 80 ? 'Good' : audit.score >= 60 ? 'Needs Work' : 'Poor'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Title Length</span>
                <span>{audit.metrics.titleLength} chars</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span>{audit.metrics.descriptionLength} chars</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Word Count</span>
                <span>{audit.metrics.wordCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">H1 Tags</span>
                <span>{audit.metrics.h1Count}</span>
              </div>
            </CardContent>
          </Card>

          {/* Technical Checks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Technical</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Canonical URL</span>
                {audit.metrics.hasCanonical ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Structured Data</span>
                {audit.metrics.hasStructuredData ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Images with Alt</span>
                {audit.metrics.imageAltMissing === 0 ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Badge variant="outline" className="text-warning">
                    {audit.metrics.imageAltMissing} missing
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Issues */}
      {audit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({audit.issues.length})</TabsTrigger>
                <TabsTrigger value="errors">
                  Errors ({audit.issues.filter(i => i.type === 'error').length})
                </TabsTrigger>
                <TabsTrigger value="warnings">
                  Warnings ({audit.issues.filter(i => i.type === 'warning').length})
                </TabsTrigger>
                <TabsTrigger value="passed">
                  Passed ({audit.issues.filter(i => i.type === 'success').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {audit.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                          <span className="text-sm">{issue.message}</span>
                        </div>
                        {issue.recommendation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {issue.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="errors" className="mt-4">
                <div className="space-y-3">
                  {audit.issues.filter(i => i.type === 'error').map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                          <span className="text-sm">{issue.message}</span>
                        </div>
                        {issue.recommendation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {issue.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {audit.issues.filter(i => i.type === 'error').length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No errors found!</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="warnings" className="mt-4">
                <div className="space-y-3">
                  {audit.issues.filter(i => i.type === 'warning').map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-warning/10">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                          <span className="text-sm">{issue.message}</span>
                        </div>
                        {issue.recommendation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 {issue.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="passed" className="mt-4">
                <div className="space-y-3">
                  {audit.issues.filter(i => i.type === 'success').map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-success/10">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                          <span className="text-sm">{issue.message}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-warning" />
            Quick SEO Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Title Tags
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep between 30-60 characters</li>
                <li>• Include primary keyword near the beginning</li>
                <li>• Make each page title unique</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Meta Descriptions
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep between 120-160 characters</li>
                <li>• Include a clear call-to-action</li>
                <li>• Use target keywords naturally</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" /> Images
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Add descriptive alt text to all images</li>
                <li>• Use lazy loading for below-fold images</li>
                <li>• Compress images for faster loading</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" /> Links
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use descriptive anchor text</li>
                <li>• Add internal links to related content</li>
                <li>• Set canonical URLs for duplicate pages</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOAuditTool;
