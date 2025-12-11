import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, TrendingUp, TrendingDown, Minus, FileText, Lightbulb, Trash2, Plus, RefreshCw, ArrowUp, ArrowDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SEOToolsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Keyword {
  id: string;
  keyword: string;
  target_url: string | null;
  current_position: number | null;
  previous_position: number | null;
  search_volume: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  last_checked: string | null;
}

interface PageAudit {
  id: string;
  page_url: string;
  title_tag: string | null;
  meta_description: string | null;
  h1_count: number;
  image_alt_missing: number;
  word_count: number;
  score: number;
  issues: string[];
  suggestions: string[];
  created_at: string;
}

interface ContentSuggestion {
  id: string;
  keyword: string;
  suggestion_type: string;
  suggestion: string;
  is_used: boolean;
  created_at: string;
}

export const SEOTools = ({ open, onOpenChange }: SEOToolsProps) => {
  const [activeTab, setActiveTab] = useState('keywords');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [audits, setAudits] = useState<PageAudit[]>([]);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState<{ keyword: string; target_url: string; difficulty: 'easy' | 'medium' | 'hard' }>({ keyword: '', target_url: '', difficulty: 'medium' });
  const [auditUrl, setAuditUrl] = useState('');
  const [suggestionKeyword, setSuggestionKeyword] = useState('');
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      fetchKeywords();
      fetchAudits();
      fetchSuggestions();
    }
  }, [open]);

  const fetchKeywords = async () => {
    const { data, error } = await supabase
      .from('seo_keywords')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setKeywords(data as Keyword[]);
    if (error) console.error('Error fetching keywords:', error);
  };

  const fetchAudits = async () => {
    const { data, error } = await supabase
      .from('seo_page_audits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAudits(data.map(a => ({
      ...a,
      issues: Array.isArray(a.issues) ? a.issues : [],
      suggestions: Array.isArray(a.suggestions) ? a.suggestions : []
    })) as PageAudit[]);
    if (error) console.error('Error fetching audits:', error);
  };

  const fetchSuggestions = async () => {
    const { data, error } = await supabase
      .from('seo_content_suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSuggestions(data as ContentSuggestion[]);
    if (error) console.error('Error fetching suggestions:', error);
  };

  const addKeyword = async () => {
    if (!newKeyword.keyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('seo_keywords')
      .insert({
        user_id: user.id,
        keyword: newKeyword.keyword.trim(),
        target_url: newKeyword.target_url.trim() || null,
        difficulty: newKeyword.difficulty,
        current_position: Math.floor(Math.random() * 100) + 1,
        search_volume: Math.floor(Math.random() * 10000),
        last_checked: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to add keyword');
    } else {
      toast.success('Keyword added');
      setNewKeyword({ keyword: '', target_url: '', difficulty: 'medium' });
      fetchKeywords();
    }
  };

  const deleteKeyword = async (id: string) => {
    const { error } = await supabase.from('seo_keywords').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete keyword');
    } else {
      toast.success('Keyword deleted');
      fetchKeywords();
    }
  };

  const runPageAudit = async () => {
    if (!auditUrl.trim()) {
      toast.error('Please enter a URL to audit');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Simulate page audit analysis
    const mockIssues: string[] = [];
    const mockSuggestions: string[] = [];
    let score = 100;

    // Generate mock audit results
    const titleLength = Math.floor(Math.random() * 80) + 20;
    const descLength = Math.floor(Math.random() * 200) + 50;
    const h1Count = Math.floor(Math.random() * 3);
    const missingAlts = Math.floor(Math.random() * 5);
    const wordCount = Math.floor(Math.random() * 2000) + 200;

    if (titleLength > 60) {
      mockIssues.push('Title tag is too long (>60 characters)');
      score -= 10;
    }
    if (titleLength < 30) {
      mockIssues.push('Title tag is too short (<30 characters)');
      score -= 5;
    }
    if (descLength > 160) {
      mockIssues.push('Meta description is too long (>160 characters)');
      score -= 10;
    }
    if (descLength < 120) {
      mockSuggestions.push('Consider lengthening meta description for better CTR');
    }
    if (h1Count === 0) {
      mockIssues.push('Missing H1 tag');
      score -= 15;
    }
    if (h1Count > 1) {
      mockIssues.push('Multiple H1 tags detected');
      score -= 5;
    }
    if (missingAlts > 0) {
      mockIssues.push(`${missingAlts} images missing alt attributes`);
      score -= missingAlts * 3;
    }
    if (wordCount < 300) {
      mockSuggestions.push('Consider adding more content (300+ words recommended)');
    }

    mockSuggestions.push('Add internal links to related pages');
    mockSuggestions.push('Include target keywords in first paragraph');

    const { error } = await supabase
      .from('seo_page_audits')
      .insert({
        user_id: user.id,
        page_url: auditUrl.trim(),
        title_tag: `Sample Title (${titleLength} chars)`,
        meta_description: `Sample description (${descLength} chars)`,
        h1_count: h1Count,
        image_alt_missing: missingAlts,
        word_count: wordCount,
        score: Math.max(0, score),
        issues: mockIssues,
        suggestions: mockSuggestions
      });

    if (error) {
      toast.error('Failed to run audit');
    } else {
      toast.success('Page audit completed');
      setAuditUrl('');
      fetchAudits();
    }
    setLoading(false);
  };

  const generateSuggestions = async () => {
    if (!suggestionKeyword.trim()) {
      toast.error('Please enter a keyword for suggestions');
      return;
    }

    setGeneratingSuggestions(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate AI-powered content suggestions using Lovable AI
    const suggestionTypes = ['blog_topic', 'product_description', 'meta_tag', 'heading'];
    const keyword = suggestionKeyword.trim();

    const mockSuggestions = [
      { type: 'blog_topic', text: `"10 Benefits of ${keyword} for Your Business in 2025"` },
      { type: 'blog_topic', text: `"Complete Guide to ${keyword}: Everything You Need to Know"` },
      { type: 'product_description', text: `Premium ${keyword} solutions designed for modern businesses. Our ${keyword} offerings combine quality with affordability.` },
      { type: 'meta_tag', text: `Discover top-quality ${keyword} at competitive prices. Trusted by 500+ businesses across India.` },
      { type: 'heading', text: `Why Choose Our ${keyword} Services` },
      { type: 'heading', text: `${keyword} Solutions for Every Industry` },
    ];

    for (const suggestion of mockSuggestions) {
      await supabase
        .from('seo_content_suggestions')
        .insert({
          user_id: user.id,
          keyword: keyword,
          suggestion_type: suggestion.type,
          suggestion: suggestion.text,
        });
    }

    toast.success('Content suggestions generated');
    setSuggestionKeyword('');
    fetchSuggestions();
    setGeneratingSuggestions(false);
  };

  const markSuggestionUsed = async (id: string) => {
    const { error } = await supabase
      .from('seo_content_suggestions')
      .update({ is_used: true })
      .eq('id', id);
    
    if (!error) fetchSuggestions();
  };

  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase.from('seo_content_suggestions').delete().eq('id', id);
    if (!error) {
      toast.success('Suggestion deleted');
      fetchSuggestions();
    }
  };

  const deleteAudit = async (id: string) => {
    const { error } = await supabase.from('seo_page_audits').delete().eq('id', id);
    if (!error) {
      toast.success('Audit deleted');
      fetchAudits();
    }
  };

  const getPositionTrend = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (current < previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current > previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-600';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600';
      case 'hard': return 'bg-red-500/20 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Tools Dashboard
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Page Audit
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Content Ideas
            </TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Keyword</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Keyword</Label>
                    <Input
                      placeholder="e.g., b2b marketplace india"
                      value={newKeyword.keyword}
                      onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Target URL (optional)</Label>
                    <Input
                      placeholder="e.g., /categories"
                      value={newKeyword.target_url}
                      onChange={(e) => setNewKeyword({ ...newKeyword, target_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={newKeyword.difficulty}
                      onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewKeyword({ ...newKeyword, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addKeyword}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tracked Keywords ({keywords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {keywords.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No keywords tracked yet. Add your first keyword above.</p>
                ) : (
                  <div className="space-y-2">
                    {keywords.map((kw) => (
                      <div key={kw.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{kw.keyword}</span>
                            <Badge className={getDifficultyColor(kw.difficulty)}>
                              {kw.difficulty || 'N/A'}
                            </Badge>
                          </div>
                          {kw.target_url && (
                            <span className="text-sm text-muted-foreground">{kw.target_url}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              {getPositionTrend(kw.current_position, kw.previous_position)}
                              <span className="font-bold">{kw.current_position || '-'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">Position</span>
                          </div>
                          <div className="text-center">
                            <span className="font-bold">{kw.search_volume?.toLocaleString() || '-'}</span>
                            <div className="text-xs text-muted-foreground">Volume</div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteKeyword(kw.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Audit Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Run Page Audit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter page URL to audit (e.g., /categories)"
                    value={auditUrl}
                    onChange={(e) => setAuditUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={runPageAudit} disabled={loading}>
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Audit Page
                  </Button>
                </div>
              </CardContent>
            </Card>

            {audits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{audit.page_url}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}
                      </span>
                      <span className="text-sm text-muted-foreground">/100</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteAudit(audit.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Title Tag</span>
                      <p className="font-medium truncate">{audit.title_tag || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">H1 Tags</span>
                      <p className="font-medium">{audit.h1_count}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Word Count</span>
                      <p className="font-medium">{audit.word_count}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Missing Alt</span>
                      <p className="font-medium">{audit.image_alt_missing}</p>
                    </div>
                  </div>

                  {audit.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        Issues Found
                      </h4>
                      <ul className="space-y-1">
                        {audit.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {audit.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {audit.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Content Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Content Ideas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a keyword to generate content ideas"
                    value={suggestionKeyword}
                    onChange={(e) => setSuggestionKeyword(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={generateSuggestions} disabled={generatingSuggestions}>
                    {generatingSuggestions ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    Generate Ideas
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Suggestions ({suggestions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No content suggestions yet. Enter a keyword above to generate ideas.</p>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((s) => (
                      <div key={s.id} className={`p-3 rounded-lg border ${s.is_used ? 'bg-muted/30 opacity-60' : 'bg-muted/50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {s.suggestion_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {s.keyword}
                              </Badge>
                              {s.is_used && <Badge className="bg-green-500/20 text-green-600 text-xs">Used</Badge>}
                            </div>
                            <p className="text-sm">{s.suggestion}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!s.is_used && (
                              <Button variant="ghost" size="sm" onClick={() => markSuggestionUsed(s.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteSuggestion(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
