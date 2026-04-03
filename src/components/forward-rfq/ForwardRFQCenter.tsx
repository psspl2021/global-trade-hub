import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIRFQGenerator } from '@/components/AIRFQGenerator';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { BuyerLogisticsRequirements } from '@/components/logistics/BuyerLogisticsRequirements';
import { ArrowLeft, FileText, Clock, Shield, Layers, Sparkles } from 'lucide-react';

interface ForwardRFQCenterProps {
  userId: string;
  refreshKey: number;
  logisticsRequirementsKey: number;
  onBack: () => void;
  onOpenManualRFQ: () => void;
  onRFQGenerated: (rfq: any) => void;
}

export function ForwardRFQCenter({
  userId,
  refreshKey,
  logisticsRequirementsKey,
  onBack,
  onOpenManualRFQ,
  onRFQGenerated,
}: ForwardRFQCenterProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Post Your RFQ. Get Multiple Quotes.
        </h1>
        <p className="text-muted-foreground">
          Connect with verified Indian suppliers in minutes. Free, fast, and secure.
        </p>
      </div>

      <hr className="border-border" />

      {/* Section 1: AI-powered RFQ Generator */}
      <AIRFQGenerator onRFQGenerated={onRFQGenerated} />

      {/* Section 2: Custom Requirement Card */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Custom Requirement</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Need something specific? Create a detailed RFQ and get quotes from multiple suppliers.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Response within 24-48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Multi-item requirements supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Verified supplier bids only</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onOpenManualRFQ}
          >
            <FileText className="h-4 w-4" />
            Create Manual RFQ
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: My Requirements */}
      <BuyerRequirementsList key={refreshKey} userId={userId} />

      {/* Section 4: My Logistics Requirements */}
      <BuyerLogisticsRequirements key={logisticsRequirementsKey} userId={userId} />
    </div>
  );
}
