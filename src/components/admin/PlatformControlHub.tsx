/**
 * Platform Control Hub
 * Consolidates: Control Tower + Enterprise Control Center
 * Both surfaces overlap heavily on platform analytics, governance, audit trails.
 */
import { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const ControlTowerExecutive = lazy(() =>
  import('@/components/ai-enforcement/ControlTowerExecutive').then(m => ({ default: m.ControlTowerExecutive }))
);
const EnterpriseControlCenter = lazy(() =>
  import('@/components/enterprise/EnterpriseControlCenter').then(m => ({ default: m.EnterpriseControlCenter }))
);

const Fallback = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

export default function PlatformControlHub() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Control Hub</h2>
        <p className="text-sm text-muted-foreground">
          Unified analytics, governance, spend, audit and ERP controls.
        </p>
      </div>
      <Tabs defaultValue="control-tower" className="w-full">
        <TabsList>
          <TabsTrigger value="control-tower">Control Tower</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Center</TabsTrigger>
        </TabsList>
        <TabsContent value="control-tower" className="mt-4">
          <Suspense fallback={<Fallback />}><ControlTowerExecutive /></Suspense>
        </TabsContent>
        <TabsContent value="enterprise" className="mt-4">
          <Suspense fallback={<Fallback />}><EnterpriseControlCenter /></Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
