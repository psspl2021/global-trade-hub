/**
 * Bid Intelligence Hub — launcher card
 * Groups three modal-based bid surfaces under one entry point.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Settings, Sparkles } from 'lucide-react';
import { AdminBidsList } from '@/components/admin/AdminBidsList';
import { AdminL1AnalysisView } from '@/components/admin/AdminL1AnalysisView';
import { SupplierSelectionEngine } from '@/components/admin/SupplierSelectionEngine';

export default function BidIntelligenceHub() {
  const [showBids, setShowBids] = useState(false);
  const [showL1, setShowL1] = useState(false);
  const [showAi, setShowAi] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bid Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          All bids, L1 analysis and AI-powered supplier selection.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Gavel className="h-4 w-4 text-amber-500" /> All Bids
            </div>
            <p className="text-sm text-muted-foreground">View supplier &amp; logistics bids across the platform.</p>
            <Button variant="outline" className="w-full" onClick={() => setShowBids(true)}>Open</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Settings className="h-4 w-4 text-violet-500" /> L1 Analysis
            </div>
            <p className="text-sm text-muted-foreground">Line-item level L1 supplier analysis.</p>
            <Button variant="outline" className="w-full" onClick={() => setShowL1(true)}>Open</Button>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-slate-600" /> AI Selection Engine
            </div>
            <p className="text-sm text-muted-foreground">AI-powered supplier selection with anonymity.</p>
            <Button variant="outline" className="w-full" onClick={() => setShowAi(true)}>Open</Button>
          </CardContent>
        </Card>
      </div>

      <AdminBidsList open={showBids} onOpenChange={setShowBids} />
      <AdminL1AnalysisView open={showL1} onOpenChange={setShowL1} />
      <SupplierSelectionEngine open={showAi} onOpenChange={setShowAi} />
    </div>
  );
}
