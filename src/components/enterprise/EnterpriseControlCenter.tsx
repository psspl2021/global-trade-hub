/**
 * Enterprise Control Center — Phase 7
 * Unified enterprise page pulling real data across all layers.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, BarChart3, Shield, FileSpreadsheet, Settings, FileText } from 'lucide-react';
import { CommercialSummaryTab } from './CommercialSummaryTab';
import { SpendAnalyticsDashboard } from './SpendAnalyticsDashboard';
import { AuditTrailExport } from './AuditTrailExport';
import { ERPExportLayer } from './ERPExportLayer';
import { GovernanceControlSettings } from './GovernanceControlSettings';

export function EnterpriseControlCenter() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-800 to-zinc-900 shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Control Center</h1>
            <p className="text-sm text-muted-foreground">
              Intelligence • Governance • Audit • Reporting
            </p>
          </div>
        </div>
        <Badge className="bg-slate-800 text-white">Enterprise v1</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commercial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="commercial" className="gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">Commercial</span>
          </TabsTrigger>
          <TabsTrigger value="spend" className="gap-1 text-xs">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Spend</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1 text-xs">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-1 text-xs">
            <FileSpreadsheet className="h-3 w-3" />
            <span className="hidden sm:inline">Exports</span>
          </TabsTrigger>
          <TabsTrigger value="governance" className="gap-1 text-xs">
            <Settings className="h-3 w-3" />
            <span className="hidden sm:inline">Governance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commercial">
          <CommercialSummaryTab />
        </TabsContent>
        <TabsContent value="spend">
          <SpendAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTrailExport />
        </TabsContent>
        <TabsContent value="exports">
          <ERPExportLayer />
        </TabsContent>
        <TabsContent value="governance">
          <GovernanceControlSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
