import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  runFullSEOPipeline,
  runCategoryPipeline,
  type PipelineResult,
} from '@/utils/seoPipeline';
import { highIntentCategories, highIntentPages } from '@/data/highIntentPages';
import {
  Rocket, CheckCircle2, XCircle, Loader2, Play, Zap,
  Factory, Layers, Building, Package, Globe, BarChart3, TrendingUp
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

  const handleProgress = useCallback((result: PipelineResult, idx: number, tot: number) => {
    setProgress(idx);
    setTotal(tot);
    setResults(prev => [...prev.slice(-50), result]); // Keep last 50 for display
    if (result.success) {
      setSuccessCount(prev => prev + 1);
    } else {
      setFailCount(prev => prev + 1);
    }
  }, []);

  const runAll = async () => {
    setIsRunning(true);
    setActiveCategory(null);
    setProgress(0);
    setTotal(highIntentPages.length);
    setResults([]);
    setSuccessCount(0);
    setFailCount(0);

    await runFullSEOPipeline(handleProgress);
    setIsRunning(false);
  };

  const runCategory = async (catSlug: string) => {
    const catPages = highIntentPages.filter(p => p.categorySlug === catSlug);
    setIsRunning(true);
    setActiveCategory(catSlug);
    setProgress(0);
    setTotal(catPages.length);
    setResults([]);
    setSuccessCount(0);
    setFailCount(0);

    await runCategoryPipeline(catSlug, handleProgress);
    setIsRunning(false);
    setActiveCategory(null);
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

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

          <Button
            onClick={runAll}
            disabled={isRunning}
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
              : `Publish All ${highIntentPages.length} Pages`}
          </Button>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={pct} className="h-2" />
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {successCount} published
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
              return (
                <Button
                  key={cat.slug}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  disabled={isRunning}
                  onClick={() => runCategory(cat.slug)}
                >
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4 text-primary" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-medium">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">{cat.count} pages</div>
                  </div>
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
                  {r.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {r.slug}
                  </span>
                  <Badge variant={r.success ? 'default' : 'destructive'} className="text-xs ml-auto shrink-0">
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
