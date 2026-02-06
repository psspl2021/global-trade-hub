/**
 * ============================================================
 * CAREER ASSETS (PURCHASER VIEW)
 * ============================================================
 * 
 * INTERNAL DOCUMENTS - NOT shared with suppliers
 * 
 * Auto-generated professional documents:
 * - Procurement Performance Certificate
 * - Savings Impact Report
 * - Audit-Ready Efficiency Sheet
 * 
 * Use for: Appraisals, Promotions, Job switches
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Award,
  TrendingUp,
  Shield,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from './LegalDisclaimer';

interface CareerAsset {
  id: string;
  type: 'performance_certificate' | 'savings_impact_report' | 'audit_efficiency_sheet' | 'quarterly_summary';
  title: string;
  period: string;
  generatedAt: string;
  metrics: {
    label: string;
    value: string;
  }[];
}

const assetConfig = {
  performance_certificate: {
    icon: Award,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  savings_impact_report: {
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  audit_efficiency_sheet: {
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  quarterly_summary: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

const sampleAssets: CareerAsset[] = [
  {
    id: '1',
    type: 'performance_certificate',
    title: 'Procurement Excellence Certificate',
    period: 'Q4 2025',
    generatedAt: '2026-01-05T10:00:00Z',
    metrics: [
      { label: 'Efficiency Score', value: '92%' },
      { label: 'Rank', value: '#2 in Organization' },
      { label: 'Title Earned', value: 'Most Efficient Buyer' },
    ],
  },
  {
    id: '2',
    type: 'savings_impact_report',
    title: 'Annual Savings Impact Report',
    period: 'FY 2025',
    generatedAt: '2026-01-10T14:30:00Z',
    metrics: [
      { label: 'Total Savings', value: '₹38.5 Lakhs' },
      { label: 'RFQs Processed', value: '47' },
      { label: 'Avg. Savings %', value: '11.2%' },
    ],
  },
  {
    id: '3',
    type: 'audit_efficiency_sheet',
    title: 'Compliance & Audit Summary',
    period: 'Q4 2025',
    generatedAt: '2026-01-08T09:15:00Z',
    metrics: [
      { label: 'Audit Score', value: '100%' },
      { label: 'Compliance Rate', value: '100%' },
      { label: 'Deviations', value: '0' },
    ],
  },
  {
    id: '4',
    type: 'quarterly_summary',
    title: 'Q4 2025 Performance Summary',
    period: 'Q4 2025',
    generatedAt: '2026-01-02T11:00:00Z',
    metrics: [
      { label: 'Savings', value: '₹12.8 Lakhs' },
      { label: 'Efficiency', value: '88%' },
      { label: 'Turnaround', value: '18 hrs avg' },
    ],
  },
];

export function CareerAssets() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (assetId: string) => {
    setDownloading(assetId);
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Document downloaded successfully');
    setDownloading(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-purple-900">Career Assets</h2>
                <p className="text-sm text-purple-600">
                  AI-generated professional documents
                </p>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-Generated
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <div className="grid grid-cols-3 gap-4">
        {['Appraisals', 'Promotions', 'Job Switches'].map((useCase) => (
          <Card key={useCase} className="text-center py-4">
            <CardContent className="pb-0">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="text-sm font-medium">{useCase}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>
            Exportable PDFs with verified metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {sampleAssets.map((asset) => {
                const config = assetConfig[asset.type];
                const Icon = config.icon;
                
                return (
                  <div
                    key={asset.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg bg-white/80')}>
                          <Icon className={cn('w-5 h-5', config.color)} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{asset.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {asset.period}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Generated {new Date(asset.generatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(asset.id)}
                        disabled={downloading === asset.id}
                      >
                        {downloading === asset.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Download</span>
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {asset.metrics.map((metric) => (
                        <div key={metric.label} className="text-center bg-white/60 rounded-lg py-2">
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                          <p className="font-semibold text-sm">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <LegalDisclaimer />
    </div>
  );
}

export default CareerAssets;
