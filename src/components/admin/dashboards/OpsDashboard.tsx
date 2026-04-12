/**
 * Ops Dashboard — Execution Control
 * Shows: RFQs, Bids, L1, AI Selection, Auctions, Logistics, Vehicles, Partner Docs, Auction Intelligence
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList, Gavel, Settings, Truck, Car, FileText, Eye
} from 'lucide-react';
import AuctionTrackerCard from '@/components/admin/AuctionTrackerCard';
import ReverseAuctionIntelligence from '@/components/admin/ReverseAuctionIntelligence';

interface OpsDashboardProps {
  stats: {
    totalRequirements: number;
    vehiclesPending: number;
    partnerDocsPending: number;
  };
  onShowUsers: () => void;
  onShowRequirements: () => void;
  onShowBids: () => void;
  onShowL1Analysis: () => void;
  onShowLogistics: () => void;
  onShowVehicles: () => void;
  onShowPartnerDocs: () => void;
  userName: string;
}

export function OpsDashboard({
  stats, onShowRequirements, onShowBids, onShowL1Analysis,
  onShowLogistics, onShowVehicles, onShowPartnerDocs, userName
}: OpsDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Operations Execution Dashboard</p>
      </div>

      {/* Row 1 — Core Ops */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />Requirements (RFQs)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.totalRequirements}</p>
            <p className="text-sm text-muted-foreground">Active requirements</p>
            <Button variant="outline" className="w-full" onClick={onShowRequirements}>
              <Eye className="h-4 w-4 mr-2" />View All Requirements
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4 text-amber-500" />All Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View supplier & logistics bids</p>
            <Button variant="outline" className="w-full" onClick={onShowBids}>
              <Eye className="h-4 w-4 mr-2" />View All Bids
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-violet-500" />L1 Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Line-item level L1 supplier analysis</p>
            <Button variant="outline" className="w-full" onClick={onShowL1Analysis}>
              <Settings className="h-4 w-4 mr-2" />View L1 Analysis
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — AI + Auctions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-indigo-500" />AI Selection Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">AI-powered supplier selection with anonymity</p>
            <Button variant="outline" className="w-full" onClick={onShowL1Analysis}>
              <Settings className="h-4 w-4 mr-2" />Open AI Engine
            </Button>
          </CardContent>
        </Card>

        <AuctionTrackerCard />

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-blue-500" />Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Vehicles, warehouses & requirements</p>
            <Button variant="outline" className="w-full" onClick={onShowLogistics}>
              <Eye className="h-4 w-4 mr-2" />View Logistics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Verification Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="h-4 w-4 text-slate-600" />Vehicle Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.vehiclesPending}</p>
            <p className="text-sm text-muted-foreground">Vehicles awaiting RC verification</p>
            <Button variant={stats.vehiclesPending > 0 ? "default" : "outline"} className="w-full" onClick={onShowVehicles}>
              Verify Vehicles
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-slate-600" />Partner Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-primary">{stats.partnerDocsPending}</p>
            <p className="text-sm text-muted-foreground">Aadhar, PAN & Notary verification</p>
            <Button variant={stats.partnerDocsPending > 0 ? "default" : "outline"} className="w-full" onClick={onShowPartnerDocs}>
              Verify Documents
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 4 — Auction Intelligence */}
      <ReverseAuctionIntelligence />
    </div>
  );
}
