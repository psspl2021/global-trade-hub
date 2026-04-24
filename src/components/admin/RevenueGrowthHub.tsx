/**
 * Revenue & Growth Hub
 * Consolidates: Sales Control Board + AI Sales Engine + Leads Dashboard
 * All three drive top-of-funnel revenue activities.
 */
import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const SalesControlBoard = lazy(() =>
  import('@/components/admin/SalesControlBoard').then(m => ({ default: m.SalesControlBoard }))
);
const AISalesDashboard = lazy(() =>
  import('@/components/admin/AISalesDashboard').then(m => ({ default: m.AISalesDashboard }))
);
const LeadsDashboard = lazy(() =>
  import('@/components/admin/LeadsDashboard').then(m => ({ default: m.LeadsDashboard }))
);

const Fallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function RevenueGrowthHub() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Revenue &amp; Growth Hub</h2>
        <p className="text-sm text-muted-foreground">
          Sales pipeline, AI-driven outreach and inbound leads in one place.
        </p>
      </div>
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="ai-sales">AI Sales Engine</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-4">
          <Suspense fallback={<Fallback />}><SalesControlBoard /></Suspense>
        </TabsContent>
        <TabsContent value="ai-sales" className="mt-4">
          <Suspense fallback={<Fallback />}><AISalesDashboard /></Suspense>
        </TabsContent>
        <TabsContent value="leads" className="mt-4">
          <Suspense fallback={<Fallback />}><LeadsDashboard /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
