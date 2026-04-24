/**
 * Content Studio Hub
 * Consolidates: AI Blog Generator + Blog Pipeline + Blog Management
 */
import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const AIBlogGenerator = lazy(() =>
  import('@/components/admin/AIBlogGenerator').then(m => ({ default: m.AIBlogGenerator }))
);
const BlogPipelinePanel = lazy(() => import('@/components/admin/BlogPipelinePanel'));
const AdminBlogManager = lazy(() => import('@/components/admin/AdminBlogManager'));

const Fallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function ContentStudioHub() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Content Studio</h2>
        <p className="text-sm text-muted-foreground">
          Generate, queue and manage SEO blog content end-to-end.
        </p>
      </div>
      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">AI Generator</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-4">
          <Suspense fallback={<Fallback />}><AIBlogGenerator /></Suspense>
        </TabsContent>
        <TabsContent value="pipeline" className="mt-4">
          <Suspense fallback={<Fallback />}><BlogPipelinePanel /></Suspense>
        </TabsContent>
        <TabsContent value="manage" className="mt-4">
          <Suspense fallback={<Fallback />}><AdminBlogManager /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
