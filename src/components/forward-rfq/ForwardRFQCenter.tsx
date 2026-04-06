import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIRFQGenerator } from '@/components/AIRFQGenerator';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { BuyerLogisticsRequirements } from '@/components/logistics/BuyerLogisticsRequirements';
import { ArrowLeft, FileText, Sparkles, ChevronDown } from 'lucide-react';

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
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      {/* Compact Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Forward RFQ Hub</h2>
          <p className="text-xs text-muted-foreground">Post requirements & receive competitive quotes</p>
        </div>
      </div>

      {/* Action Row: AI Generate + Manual RFQ */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          variant="interactive"
          className={`p-3 group hover:shadow-md transition-all cursor-pointer border ${showAIGenerator ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
          onClick={() => setShowAIGenerator(!showAIGenerator)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">AI Generate RFQ</p>
              <p className="text-[10px] text-muted-foreground">Describe needs, AI creates RFQ</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAIGenerator ? 'rotate-180' : ''}`} />
          </div>
        </Card>

        <Card
          variant="interactive"
          className="p-3 group hover:shadow-md transition-all cursor-pointer"
          onClick={onOpenManualRFQ}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Manual RFQ</p>
              <p className="text-[10px] text-muted-foreground">Create detailed requirement</p>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground/50 rotate-180 group-hover:text-primary transition-colors" />
          </div>
        </Card>
      </div>

      {/* Collapsible AI Generator */}
      {showAIGenerator && (
        <AIRFQGenerator onRFQGenerated={onRFQGenerated} />
      )}

      {/* My Requirements */}
      <BuyerRequirementsList key={refreshKey} userId={userId} />

      {/* My Logistics Requirements */}
      <BuyerLogisticsRequirements key={logisticsRequirementsKey} userId={userId} />
    </div>
  );
}
