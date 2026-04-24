/**
 * SEO Command Center
 * Consolidates 7 overlapping SEO admin surfaces into one tabbed hub:
 *   - Overview      → SEO Dashboard (query history, link graph, indexation)
 *   - Performance   → SEO Monitor (CTR, positions, corridors)
 *   - Revenue       → Revenue Dashboard + SEO Revenue (page-type ROI, SKU attribution)
 *   - Intelligence  → SEO Intelligence + Demand Gaps (keyword intent, striking distance, slug gaps)
 *   - Pipeline      → SEO Pipeline (auto-publish queue, AI content)
 */

import { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Monitor, BarChart3, Sparkles, Rocket, Zap, TrendingUp } from 'lucide-react';

const SEODashboard = lazy(() => import('@/pages/admin/SEODashboard'));
const AdminSEOMonitor = lazy(() => import('@/pages/AdminSEOMonitor'));
const SeoRevenueDashboard = lazy(() => import('@/pages/admin/SeoRevenueDashboard'));
const AdminIntelligenceDashboard = lazy(() => import('@/pages/admin/AdminIntelligenceDashboard'));
const DemandGapsPanel = lazy(() => import('@/pages/admin/DemandGapsPanel'));
const SEOPipelinePanel = lazy(() => import('@/components/admin/SEOPipelinePanel'));
const RevenueDashboardView = lazy(() => import('@/components/admin/RevenueDashboardView'));

const Fallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

type SEOTab = 'overview' | 'performance' | 'revenue' | 'intelligence' | 'pipeline';

export function SEOCommandCenter() {
  const [tab, setTab] = useState<SEOTab>('overview');
  const [revenueSubTab, setRevenueSubTab] = useState<'live' | 'attribution'>('live');
  const [intelligenceSubTab, setIntelligenceSubTab] = useState<'keywords' | 'gaps'>('keywords');

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Globe className="h-5 w-5 text-primary" />
          SEO Command Center
          <Badge variant="secondary" className="text-xs">Unified</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          All SEO surfaces — performance, revenue attribution, intelligence & pipeline — in one place.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as SEOTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Globe className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Monitor className="h-3.5 w-3.5" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1.5 text-xs md:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-1.5 text-xs md:text-sm">
              <Rocket className="h-3.5 w-3.5" />
              Pipeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Query history, internal link graph, indexation health & authority flow
            </p>
            <Suspense fallback={<Fallback />}>
              <SEODashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="performance" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              CTR tracking, corridor performance & search position monitoring
            </p>
            <Suspense fallback={<Fallback />}>
              <AdminSEOMonitor />
            </Suspense>
          </TabsContent>

          <TabsContent value="revenue" className="mt-4">
            <Tabs value={revenueSubTab} onValueChange={(v) => setRevenueSubTab(v as 'live' | 'attribution')}>
              <TabsList>
                <TabsTrigger value="live" className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Live Revenue
                </TabsTrigger>
                <TabsTrigger value="attribution" className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Attribution
                </TabsTrigger>
              </TabsList>
              <TabsContent value="live" className="mt-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Top revenue pages, conversion rates & autonomous boost engine status
                </p>
                <Suspense fallback={<Fallback />}>
                  <RevenueDashboardView />
                </Suspense>
              </TabsContent>
              <TabsContent value="attribution" className="mt-3">
                <p className="text-xs text-muted-foreground mb-3">
                  SKU-level revenue attribution, page-type ROI & country corridors
                </p>
                <Suspense fallback={<Fallback />}>
                  <SeoRevenueDashboard />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="intelligence" className="mt-4">
            <Tabs value={intelligenceSubTab} onValueChange={(v) => setIntelligenceSubTab(v as 'keywords' | 'gaps')}>
              <TabsList>
                <TabsTrigger value="keywords" className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Keywords
                </TabsTrigger>
                <TabsTrigger value="gaps" className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Demand Gaps
                </TabsTrigger>
              </TabsList>
              <TabsContent value="keywords" className="mt-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Keyword intent analysis, striking-distance pages & content gaps
                </p>
                <Suspense fallback={<Fallback />}>
                  <AdminIntelligenceDashboard />
                </Suspense>
              </TabsContent>
              <TabsContent value="gaps" className="mt-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Missing slug detection, priority scoring & AI generation queue
                </p>
                <Suspense fallback={<Fallback />}>
                  <DemandGapsPanel />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="pipeline" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Auto-publish 100 high-intent pages with AI content & internal linking
            </p>
            <Suspense fallback={<Fallback />}>
              <SEOPipelinePanel />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default SEOCommandCenter;
