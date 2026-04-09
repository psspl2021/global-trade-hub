import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, BookOpen, Zap } from 'lucide-react';
import { runFullBlogPipeline, runCategoryBlogPipeline, type BlogPipelineResult } from '@/utils/blogPipeline';
import { highIntentBlogs } from '@/data/highIntentBlogs';

export default function BlogPipelinePanel() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BlogPipelineResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(highIntentBlogs.map(b => b.category))];
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  const handleRun = async (category?: string) => {
    setRunning(true);
    setResults([]);
    setSelectedCategory(category || null);

    const onProgress = (result: BlogPipelineResult, index: number, total: number) => {
      setProgress({ current: index, total });
      setResults(prev => [...prev, result]);
    };

    try {
      if (category) {
        await runCategoryBlogPipeline(category, onProgress);
      } else {
        await runFullBlogPipeline(onProgress);
      }
    } catch (err) {
      console.error('Blog pipeline error:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Blog Content Pipeline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Auto-generate {highIntentBlogs.length} high-intent SEO blogs with internal links to solution pages.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleRun()} disabled={running} className="gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Run All ({highIntentBlogs.length} blogs)
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                onClick={() => handleRun(cat)}
                disabled={running}
              >
                {cat} ({highIntentBlogs.filter(b => b.category === cat).length})
              </Button>
            ))}
          </div>

          {running && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating{selectedCategory ? ` (${selectedCategory})` : ''}...</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} />
            </div>
          )}

          {results.length > 0 && (
            <div className="flex gap-4 text-sm">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" /> {successCount} success
              </Badge>
              {failCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {failCount} failed
                </Badge>
              )}
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.success ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  )}
                  <span className="truncate">{r.keyword}</span>
                  {!r.success && (
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">
                      {r.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
