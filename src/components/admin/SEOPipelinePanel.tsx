import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  runFullSEOPipeline,
  runCategoryPipeline,
  fetchPublishedSlugs,
  type PipelineResult,
} from '@/utils/seoPipeline';
import { highIntentCategories, highIntentPages } from '@/data/highIntentPages';
import {
  Rocket, CheckCircle2, XCircle, Loader2, Play, Zap,
  Factory, Layers, Building, Package, Globe, BarChart3, TrendingUp, SkipForward
} from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  metals: Factory,
  'pipes-fittings': Layers,
  construction: Building,
  electrical: Zap,
  packaging: Package,
  chemicals: Globe,
  'industrial-procurement': BarChart3,
  'cost-reduction': TrendingUp,
  'industry-specific': Factory,
};

export default function SEOPipelinePanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [publishedSlugs, setPublishedSlugs] = useState<Set<string>>(new Set());
  const [loadingPublished, setLoadingPublished] = useState(true);

  const refreshPublished = useCallback(async () => {
    setLoadingPublished(true);
    const slugs = await fetchPublishedSlugs();
    setPublishedSlugs(slugs);
    setLoadingPublished(false);
  }, []);

  useEffect(() => {
    refreshPublished();
  }, [refreshPublished]);

  const handleProgress = useCallback((result: PipelineResult, idx: number, tot: number) => {
    setProgress(idx);
    setTotal(tot);
    setResults(prev => [...prev.slice(-50), result]);
    if (result.skipped) {
      setSkippedCount(prev => prev + 1);
    } else if (result.success) {
      setSuccessCount(prev => prev + 1);
      // Optimistic update
      setPublishedSlugs(prev => new Set(prev).add(result.slug));
    } else {
      setFailCount(prev => prev + 1);
    }
  }, []);

  const resetCounters = (tot: number) => {
    setProgress(0);
    setTotal(tot);
    setResults([]);
    setSuccessCount(0);
    setFailCount(0);
    setSkippedCount(0);
  };

  const runAll = async () => {
    setIsRunning(true);
    setActiveCategory(null);
    resetCounters(highIntentPages.length);
    await runFullSEOPipeline(handleProgress);
    setIsRunning(false);
    refreshPublished();
  };

  const runCategory = async (catSlug: string) => {
    const catPages = highIntentPages.filter(p => p.categorySlug === catSlug);
    setIsRunning(true);
    setActiveCategory(catSlug);
    resetCounters(catPages.length);
    await runCategoryPipeline(catSlug, handleProgress);
    setIsRunning(false);
    setActiveCategory(null);
    refreshPublished();
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const totalPublished = highIntentPages.filter(p => publishedSlugs.has(p.slug)).length;
  const totalRemaining = highIntentPages.length - totalPublished;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            SEO Auto-Publish Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate and publish AI-powered demand pages from {highIntentPages.length} high-intent keywords.
            Each page gets AI-generated content, structured data, and bidirectional internal links.
          </p>

          {/* Status summary */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> {totalPublished} published
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {totalRemaining} remaining
            </Badge>
            {loadingPublished && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> loading status
              </Badge>
            )}
          </div>

          <Button
            onClick={runAll}
            disabled={isRunning || loadingPublished || totalRemaining === 0}
            size="lg"
            className="gap-2"
          >
            {isRunning && !activeCategory ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning && !activeCategory
              ? `Publishing... ${progress}/${total}`
              : totalRemaining === 0
                ? `All ${highIntentPages.length} Pages Published`
                : `Publish ${totalRemaining} Remaining Page${totalRemaining === 1 ? '' : 's'}`}
          </Button>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={pct} className="h-2" />
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {successCount} published
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <SkipForward className="h-3.5 w-3.5" /> {skippedCount} skipped
                </span>
                <span className="text-destructive flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {failCount} failed
                </span>
                <span className="text-muted-foreground">{pct}% complete</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Quick-Run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publish by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {highIntentCategories.map(cat => {
              const Icon = categoryIcons[cat.slug] || Factory;
              const isActive = activeCategory === cat.slug && isRunning;
              const catPages = highIntentPages.filter(p => p.categorySlug === cat.slug);
              const catPublished = catPages.filter(p => publishedSlugs.has(p.slug)).length;
              const allDone = catPublished === catPages.length && catPages.length > 0;
              return (
                <Button
                  key={cat.slug}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  disabled={isRunning || allDone}
                  onClick={() => runCategory(cat.slug)}
                >
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : allDone ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {catPublished}/{catPages.length} published
                    </div>
                  </div>
                  {allDone && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">Done</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.slice().reverse().map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1">
                  {r.skipped ? (
                    <SkipForward className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : r.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {r.slug}
                  </span>
                  <Badge
                    variant={r.skipped ? 'secondary' : r.success ? 'default' : 'destructive'}
                    className="text-xs ml-auto shrink-0"
                  >
                    {r.message}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
