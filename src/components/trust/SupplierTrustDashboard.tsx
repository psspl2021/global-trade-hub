/**
 * SupplierTrustDashboard (BUYER VIEW)
 * ==================================
 * 
 * CRITICAL ANONYMITY RULES (LOCKED):
 * - Buyer NEVER sees real supplier name
 * - Buyer NEVER sees factory / legal entity
 * - Buyer sees only: ProcureSaathi Verified Partner (ID: PS-XXX)
 * - Seller of Record = ProcureSaathi
 * - Admin / Supplier views use separate components
 * 
 * TWO-WAY ANONYMITY MODEL:
 * ========================
 * | Role     | Sees Real Supplier? | Sees Real Buyer? |
 * |----------|---------------------|------------------|
 * | Buyer    | ❌ Never            | N/A              |
 * | Supplier | N/A                 | ❌ Never         |
 * | Admin    | ✅ Yes              | ✅ Yes           |
 * 
 * Contract chain: Buyer ↔ ProcureSaathi ↔ Supplier
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shield, Search, Building2 } from 'lucide-react';
import { TrustScoreCard } from './TrustScoreCard';
import { cn } from '@/lib/utils';

type RiskLevel = 'Minimal' | 'Low' | 'Moderate' | 'High';

interface AnonymousSupplier {
  partnerId: string;
  displayName: string;
  category: string;
  auditSummary: string;
  riskLevel: RiskLevel;
  trustScore: number;
  operationalRisk: number;
}

const suppliers: AnonymousSupplier[] = [
  {
    partnerId: 'PS-MET-99',
    displayName: 'ProcureSaathi Verified Partner (ID: PS-MET-99)',
    category: 'Metals – Ferrous',
    auditSummary: 'AI-Verified • ISO Certified • Export History',
    riskLevel: 'Minimal',
    trustScore: 94,
    operationalRisk: 92,
  },
  {
    partnerId: 'PS-STL-44',
    displayName: 'ProcureSaathi Verified Partner (ID: PS-STL-44)',
    category: 'Industrial Supplies',
    auditSummary: 'AI-Verified • Automotive Tier-2',
    riskLevel: 'Low',
    trustScore: 87,
    operationalRisk: 85,
  },
];

const riskColor = (risk: RiskLevel) =>
  ({
    Minimal: 'bg-emerald-100 text-emerald-700',
    Low: 'bg-blue-100 text-blue-700',
    Moderate: 'bg-amber-100 text-amber-700',
    High: 'bg-red-100 text-red-700',
  }[risk]);

export function SupplierTrustDashboard() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AnonymousSupplier | null>(null);

  const filtered = suppliers.filter(
    s =>
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.partnerId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 rounded-xl">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Trust Infrastructure</h2>
            <p className="text-sm text-muted-foreground">
              Managed & verified by ProcureSaathi
            </p>
          </div>
        </div>

        {/* Seller of Record */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm text-muted-foreground">Seller of Record</span>
            <Badge variant="outline" className="font-semibold">
              <Building2 className="w-3 h-3 mr-1" />
              ProcureSaathi
            </Badge>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardHeader>
            <CardTitle>Verified Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by Partner ID or category"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {filtered.map(s => (
                  <div
                    key={s.partnerId}
                    onClick={() => setSelected(s)}
                    className={cn(
                      'p-4 border rounded-lg cursor-pointer hover:shadow transition-shadow',
                      selected?.partnerId === s.partnerId && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{s.displayName}</p>
                        <p className="text-sm text-muted-foreground">{s.category}</p>
                        <p className="text-xs text-muted-foreground mt-1">{s.auditSummary}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-emerald-600">
                          {s.trustScore}%
                        </span>
                        <Badge className={cn('mt-1 block', riskColor(s.riskLevel))}>
                          {s.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail */}
        {selected && (
          <TrustScoreCard
            supplierName={selected.displayName}
            overallScore={selected.trustScore}
            operationalRisk={selected.operationalRisk}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default SupplierTrustDashboard;
