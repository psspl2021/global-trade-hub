/**
 * Bid Intelligence Hub
 * Consolidates: All Bids + L1 Analysis + AI Selection Engine
 */
import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const AdminBidsList = lazy(() =>
  import('@/components/admin/AdminBidsList').then(m => ({ default: m.AdminBidsList }))
);
const AdminL1AnalysisView = lazy(() =>
  import('@/components/admin/AdminL1AnalysisView').then(m => ({ default: m.AdminL1AnalysisView }))
);
const SupplierSelectionEngine = lazy(() =>
  import('@/components/admin/SupplierSelectionEngine').then(m => ({ default: m.SupplierSelectionEngine }))
);

const Fallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function BidIntelligenceHub() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bid Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          All bids, L1 analysis and AI-powered supplier selection.
        </p>
      </div>
      <Tabs defaultValue="bids" className="w-full">
        <TabsList>
          <TabsTrigger value="bids">All Bids</TabsTrigger>
          <TabsTrigger value="l1">L1 Analysis</TabsTrigger>
          <TabsTrigger value="ai-select">AI Selection</TabsTrigger>
        </TabsList>
        <TabsContent value="bids" className="mt-4">
          <Suspense fallback={<Fallback />}><AdminBidsList /></Suspense>
        </TabsContent>
        <TabsContent value="l1" className="mt-4">
          <Suspense fallback={<Fallback />}><AdminL1AnalysisView /></Suspense>
        </TabsContent>
        <TabsContent value="ai-select" className="mt-4">
          <Suspense fallback={<Fallback />}><SupplierSelectionEngine /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
