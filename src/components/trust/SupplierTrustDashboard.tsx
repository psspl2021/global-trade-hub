/**
 * Supplier Trust Dashboard
 * 
 * Comprehensive view of supplier trust metrics for buyers.
 * Shows AI-verified suppliers with risk analysis.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertTriangle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedSupplier {
  id: string;
  name: string;
  category: string;
  location: string;
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

// Sample data for demonstration
const sampleSuppliers: VerifiedSupplier[] = [
  {
    id: '1',
    name: 'Rajesh Steel Industries',
    category: 'Metals - Ferrous',
    location: 'Mumbai, Maharashtra',
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
    id: '2',
    name: 'Precision Components Ltd',
    category: 'Industrial Supplies',
    location: 'Chennai, Tamil Nadu',
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
    id: '3',
    name: 'Global Textiles Export',
    category: 'Fashion Apparel & Fabrics',
    location: 'Surat, Gujarat',
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

export function SupplierTrustDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<VerifiedSupplier | null>(null);

  const stats = {
    totalVerified: 847,
    exportReady: 312,
    avgTrustScore: 86,
    documentsVerified: 4250,
  };

  const filteredSuppliers = sampleSuppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Trust Infrastructure</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered supplier verification and risk analysis
            </p>
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
              <p className="text-xs text-emerald-600/70 uppercase tracking-wide">Verified Suppliers</p>
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

      {/* Trust Loop Explanation */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm text-primary">AI-Powered Trust Verification</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our AI performs cross-verification of GST records, factory licenses, delivery history, 
              and financial health. Tamper detection ensures document authenticity, while entity 
              linking validates consistency across all supplier credentials.
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
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Verified Suppliers
              </CardTitle>
              <CardDescription>
                AI-verified suppliers with real-time trust scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search suppliers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {/* Supplier Cards */}
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{supplier.name}</h4>
                            {supplier.isExportReady && (
                              <Badge className="bg-emerald-600 text-white text-xs">
                                Export Ready
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {supplier.category} • {supplier.location}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {supplier.lastVerified}
                            </span>
                            <span>{supplier.totalOrders} orders</span>
                            <span>{supplier.onTimeDelivery}% on-time</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
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

        {/* Selected Supplier Detail */}
        <div>
          {selectedSupplier ? (
            <TrustScoreCard
              supplierName={selectedSupplier.name}
              overallScore={selectedSupplier.trustScore}
              operationalRisk={selectedSupplier.operationalRisk}
              financialRisk={selectedSupplier.financialRisk}
              documentScore={selectedSupplier.documentScore}
              geopoliticalRisk={selectedSupplier.geopoliticalRisk}
              isExportReady={selectedSupplier.isExportReady}
              lastVerified={selectedSupplier.lastVerified}
            />
          ) : (
            <Card className="h-full flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a supplier to view detailed trust metrics</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierTrustDashboard;
