/**
 * Supplier Trust Dashboard (BUYER VIEW)
 * 
 * =======================================================
 * CRITICAL ANONYMITY RULE (LOCKED):
 * =======================================================
 * Buyer NEVER sees real supplier names, factory names, or legal entities.
 * All suppliers are shown as "ProcureSaathi Verified Partner (ID: PS-XXX)"
 * Seller of Record is ALWAYS "ProcureSaathi"
 * 
 * This protects:
 * 1. Margin integrity (no bypass)
 * 2. Supplier privacy
 * 3. Platform trust consolidation
 * =======================================================
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrustScoreCard } from './TrustScoreCard';
import { AIVerifiedBadge } from './AIVerifiedBadge';
import {
  Shield,
  Search,
  Filter,
  TrendingUp,
  Users,
  FileCheck,
  Globe,
  CheckCircle2,
  Clock,
  Info,
  Download,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnonymousSupplier {
  id: string;
  displayName: string; // "ProcureSaathi Verified Partner (ID: PS-XXX)"
  sellerOfRecord: string; // Always "ProcureSaathi"
  category: string;
  managedStatus: string;
  auditSummary: string;
  riskLevel: 'Minimal' | 'Low' | 'Moderate' | 'High';
  trustScore: number;
  operationalRisk: number;
  financialRisk: number;
  documentScore: number;
  geopoliticalRisk: number;
  isExportReady: boolean;
  lastVerified: string;
  totalOrders: number;
  onTimeDelivery: number;
}

/**
 * ANONYMOUS SUPPLIER DATA
 * Real supplier names are NEVER exposed to buyers.
 * Only Admin and Supplier dashboards show real identities.
 */
const anonymousSuppliers: AnonymousSupplier[] = [
  {
    id: 'PS-MET-99',
    displayName: 'ProcureSaathi Verified Partner (ID: PS-MET-99)',
    sellerOfRecord: 'ProcureSaathi',
    category: 'Metals - Ferrous',
    managedStatus: 'ProcureSaathi Managed Fulfilment',
    auditSummary: 'AI-Verified: 12 Machines, ISO Certified, 5yr Export History',
    riskLevel: 'Minimal',
    trustScore: 94,
    operationalRisk: 92,
    financialRisk: 88,
    documentScore: 98,
    geopoliticalRisk: 85,
    isExportReady: true,
    lastVerified: '2 days ago',
    totalOrders: 156,
    onTimeDelivery: 96,
  },
  {
    id: 'PS-STEL-44',
    displayName: 'ProcureSaathi Verified Partner (ID: PS-STEL-44)',
    sellerOfRecord: 'ProcureSaathi',
    category: 'Industrial Supplies',
    managedStatus: 'ProcureSaathi Managed Fulfilment',
    auditSummary: 'AI-Verified: Tier-2 Automotive Supplier Compliance',
    riskLevel: 'Low',
    trustScore: 87,
    operationalRisk: 85,
    financialRisk: 82,
    documentScore: 92,
    geopoliticalRisk: 88,
    isExportReady: true,
    lastVerified: '1 week ago',
    totalOrders: 89,
    onTimeDelivery: 91,
  },
  {
    id: 'PS-TEX-22',
    displayName: 'ProcureSaathi Verified Partner (ID: PS-TEX-22)',
    sellerOfRecord: 'ProcureSaathi',
    category: 'Fashion Apparel & Fabrics',
    managedStatus: 'ProcureSaathi Managed Fulfilment',
    auditSummary: 'AI-Verified: Quality Checks In Progress',
    riskLevel: 'Moderate',
    trustScore: 78,
    operationalRisk: 75,
    financialRisk: 72,
    documentScore: 85,
    geopoliticalRisk: 80,
    isExportReady: false,
    lastVerified: '3 weeks ago',
    totalOrders: 45,
    onTimeDelivery: 82,
  },
];

const getRiskBadgeColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'Minimal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Low': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'High': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function SupplierTrustDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<AnonymousSupplier | null>(null);

  const stats = {
    totalVerified: 847,
    exportReady: 312,
    avgTrustScore: 86,
    documentsVerified: 4250,
  };

  const filteredSuppliers = anonymousSuppliers.filter(s =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Seller of Record */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Trust Infrastructure</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground">
                  Managed by
                </p>
                <Badge variant="outline" className="font-semibold">
                  <Building2 className="w-3 h-3 mr-1" />
                  ProcureSaathi
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      ProcureSaathi acts as the managed seller, ensuring quality, 
                      compliance, and payment protection for all transactions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <AIVerifiedBadge trustScore={95} size="md" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalVerified}</p>
                <p className="text-xs text-emerald-600/70 uppercase tracking-wide">Verified Partners</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.exportReady}</p>
                <p className="text-xs text-blue-600/70 uppercase tracking-wide">Export Ready</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.avgTrustScore}%</p>
                <p className="text-xs text-amber-600/70 uppercase tracking-wide">Avg Trust Score</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.documentsVerified}</p>
                <p className="text-xs text-purple-600/70 uppercase tracking-wide">Docs Verified</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Trust Explanation Card */}
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm text-primary">Managed Fulfilment by ProcureSaathi</p>
              <p className="text-sm text-muted-foreground mt-1">
                All transactions are managed through ProcureSaathi. Your contract, invoice, and 
                accountability is with ProcureSaathi — ensuring quality, compliance, logistics, 
                and payment protection at every step.
              </p>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Supplier List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Verified Partners
                    </CardTitle>
                    <CardDescription>
                      AI-verified partners with real-time trust scores
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Building2 className="w-3 h-3" />
                    Seller: ProcureSaathi
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Partner ID or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>

                {/* Partner Cards */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:shadow-md',
                          selectedSupplier?.id === supplier.id && 'border-primary bg-primary/5'
                        )}
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* ANONYMOUS DISPLAY NAME */}
                              <h4 className="font-semibold text-sm">{supplier.displayName}</h4>
                              {supplier.isExportReady && (
                                <Badge className="bg-emerald-600 text-white text-xs">
                                  Export Ready
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {supplier.category}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className={cn('text-xs', getRiskBadgeColor(supplier.riskLevel))}>
                                Risk: {supplier.riskLevel}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {supplier.lastVerified}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                              {supplier.auditSummary}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-3">
                            <span className={cn(
                              'text-xl font-bold',
                              supplier.trustScore >= 80 ? 'text-emerald-600' :
                              supplier.trustScore >= 60 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {supplier.trustScore}%
                            </span>
                            <span className="text-xs text-muted-foreground">Trust Score</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Selected Partner Detail */}
          <div>
            {selectedSupplier ? (
              <div className="space-y-4">
                {/* Managed Quote Header */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Managed Quote</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      AI Verified
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="font-medium">ProcureSaathi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partner ID:</span>
                      <span className="font-mono text-xs">{selectedSupplier.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-emerald-600 font-medium">{selectedSupplier.managedStatus}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Download className="w-4 h-4 mr-2" />
                    Download Audit Summary
                  </Button>
                </Card>

                <TrustScoreCard
                  supplierName={selectedSupplier.displayName}
                  overallScore={selectedSupplier.trustScore}
                  operationalRisk={selectedSupplier.operationalRisk}
                  financialRisk={selectedSupplier.financialRisk}
                  documentScore={selectedSupplier.documentScore}
                  geopoliticalRisk={selectedSupplier.geopoliticalRisk}
                  isExportReady={selectedSupplier.isExportReady}
                  lastVerified={selectedSupplier.lastVerified}
                />
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select a partner to view detailed trust metrics</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default SupplierTrustDashboard;
