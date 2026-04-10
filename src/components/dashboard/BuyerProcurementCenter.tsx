/**
 * Buyer Procurement Center — Unified card with tabs for Forward RFQ + Reverse Auction
 * Professional card-based layout matching admin dashboard style
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Gavel, TrendingUp, ArrowRight } from 'lucide-react';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { ReverseAuctionDashboard } from '@/components/reverse-auction/ReverseAuctionDashboard';

interface BuyerProcurementCenterProps {
  userId: string;
  refreshKey: number;
}

export function BuyerProcurementCenter({ userId, refreshKey }: BuyerProcurementCenterProps) {
  const [activeTab, setActiveTab] = useState('forward');

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[0.625rem] bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Procurement Center</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your private procurement network — invite suppliers, run global auctions
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-medium bg-primary/5 border-primary/20 text-primary">
            <ArrowRight className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full grid grid-cols-2 h-11 bg-muted/60 rounded-[0.625rem]">
              <TabsTrigger
                value="forward"
                className="gap-2 rounded-[0.5rem] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-semibold text-sm"
              >
                <FileText className="w-4 h-4" />
                Forward RFQ
              </TabsTrigger>
              <TabsTrigger
                value="reverse"
                className="gap-2 rounded-[0.5rem] data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md font-semibold text-sm"
              >
                <Gavel className="w-4 h-4" />
                Reverse Auction
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="forward" className="p-6 pt-4 mt-0 focus-visible:ring-0">
            <BuyerRequirementsList key={refreshKey} userId={userId} />
          </TabsContent>

          <TabsContent value="reverse" className="p-6 pt-4 mt-0 focus-visible:ring-0">
            <ReverseAuctionDashboard isSupplier={false} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
