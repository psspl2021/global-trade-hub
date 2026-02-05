/**
 * SupplierRFQView (SUPPLIER VIEW)
 * ================================
 * 
 * CRITICAL ANONYMITY RULES (LOCKED):
 * - Supplier NEVER sees real buyer name
 * - Supplier NEVER sees buyer company / GST
 * - Supplier NEVER sees delivery address (until PO)
 * - All buyer identities show as: ProcureSaathi Verified Buyer (ID: PB-XXX)
 * 
 * Contract chain: Supplier ↔ ProcureSaathi ↔ Buyer
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Search, 
  Clock, 
  TrendingUp,
  Shield,
  Building2,
  ArrowRight
} from 'lucide-react';
import { AnonymousBuyerCard } from './AnonymousBuyerCard';
import { cn } from '@/lib/utils';

type RFQStatus = 'open' | 'closing_soon' | 'closed';

interface AnonymousRFQ {
  id: string;
  buyerId: string; // PB-XXX
  buyerDisplayName: string;
  category: string;
  title: string;
  quantityRange: string;
  specs: string;
  deliveryRegion: string;
  timeline: string;
  paymentTerms: string;
  buyerTrustScore: number;
  status: RFQStatus;
  closingIn: string;
  intentScore: number;
}

// Sample anonymous RFQs (buyer identities hidden)
const sampleRFQs: AnonymousRFQ[] = [
  {
    id: 'RFQ-2026-001',
    buyerId: 'PB-EUR-42',
    buyerDisplayName: 'ProcureSaathi Verified Buyer (ID: PB-EUR-42)',
    category: 'Metals – Aluminum',
    title: 'Aluminum Grade 6061 Sheets',
    quantityRange: '50-100 MT',
    specs: '6061-T6, 2mm thickness, mill finish',
    deliveryRegion: 'Germany (Hamburg Port)',
    timeline: '45-60 days',
    paymentTerms: 'LC at Sight',
    buyerTrustScore: 92,
    status: 'open',
    closingIn: '3 days',
    intentScore: 8,
  },
  {
    id: 'RFQ-2026-002',
    buyerId: 'PB-MEA-17',
    buyerDisplayName: 'ProcureSaathi Verified Buyer (ID: PB-MEA-17)',
    category: 'Industrial Components',
    title: 'Stainless Steel Fasteners',
    quantityRange: '10,000-25,000 pcs',
    specs: 'SS304, M8x50, hex head',
    deliveryRegion: 'UAE (Jebel Ali)',
    timeline: '30 days',
    paymentTerms: '30-60 Days',
    buyerTrustScore: 88,
    status: 'closing_soon',
    closingIn: '12 hours',
    intentScore: 9,
  },
];

const statusConfig: Record<RFQStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-emerald-100 text-emerald-700' },
  closing_soon: { label: 'Closing Soon', color: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground' },
};

export function SupplierRFQView() {
  const [search, setSearch] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState<AnonymousRFQ | null>(null);

  const filtered = sampleRFQs.filter(
    rfq =>
      rfq.title.toLowerCase().includes(search.toLowerCase()) ||
      rfq.category.toLowerCase().includes(search.toLowerCase()) ||
      rfq.buyerId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary rounded-xl">
          <FileText className="text-primary-foreground w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Active RFQs</h2>
          <p className="text-sm text-muted-foreground">
            Buyer identities protected • Bid through ProcureSaathi
          </p>
        </div>
      </div>

      {/* Platform Notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 py-4">
          <Shield className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Two-Way Anonymity Active</p>
            <p className="text-xs text-muted-foreground">
              Buyer identities are hidden. All quotes and contracts go through ProcureSaathi.
            </p>
          </div>
          <Badge variant="outline">
            <Building2 className="w-3 h-3 mr-1" />
            Contract Party: ProcureSaathi
          </Badge>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* RFQ List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by category or buyer ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filtered.map(rfq => {
                  const status = statusConfig[rfq.status];
                  return (
                    <div
                      key={rfq.id}
                      onClick={() => setSelectedRFQ(rfq)}
                      className={cn(
                        'p-4 border rounded-lg cursor-pointer transition-all hover:shadow',
                        selectedRFQ?.id === rfq.id && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{rfq.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {rfq.buyerDisplayName}
                          </p>
                        </div>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {rfq.quantityRange}
                        </span>
                        <span className="text-muted-foreground">
                          {rfq.deliveryRegion}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Closes in {rfq.closingIn}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className={cn(
                            "w-4 h-4",
                            rfq.intentScore >= 7 ? "text-emerald-600" : "text-amber-600"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            rfq.intentScore >= 7 ? "text-emerald-600" : "text-amber-600"
                          )}>
                            Intent: {rfq.intentScore}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* RFQ Detail */}
        <div className="space-y-4">
          {selectedRFQ ? (
            <>
              <AnonymousBuyerCard
                buyerId={selectedRFQ.buyerId}
                displayName={selectedRFQ.buyerDisplayName}
                category={selectedRFQ.category}
                quantityRange={selectedRFQ.quantityRange}
                specs={selectedRFQ.specs}
                deliveryRegion={selectedRFQ.deliveryRegion}
                timeline={selectedRFQ.timeline}
                paymentTerms={selectedRFQ.paymentTerms}
                trustScore={selectedRFQ.buyerTrustScore}
              />

              <Button className="w-full" size="lg">
                Submit Quote
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Select an RFQ to view buyer details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierRFQView;
