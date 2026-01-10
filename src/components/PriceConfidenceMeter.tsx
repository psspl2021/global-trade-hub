import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Shield, 
  Truck, 
  Info, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PriceConfidenceData {
  price_confidence_score: number;
  confidence_label: "HIGH" | "MEDIUM" | "LOW";
  buyer_message: string;
  price_behavior_note: string;
  logistics_note: string;
  mode: "bidding" | "auto_assign";
  // Optional: market volatility indicator
  market_volatility?: boolean;
  // Optional: logistics cost for disclosure logic
  logistics_cost?: number;
}

interface PriceConfidenceMeterProps {
  data: PriceConfidenceData;
  showDetails?: boolean;
  compact?: boolean;
  showVolatilityNotice?: boolean;
}

// Confidence level descriptions per spec
const CONFIDENCE_DESCRIPTIONS = {
  HIGH: "Strongly aligned with current market pricing",
  MEDIUM: "Fair price under current market conditions",
  LOW: "Market conditions are volatile for this item",
};

// Logistics disclosure messages per spec
const getLogisticsDisclosure = (logisticsCost?: number) => {
  if (logisticsCost && logisticsCost > 0) {
    return "Logistics charged separately. Platform service charges are included where applicable.";
  }
  return "Logistics not included. Transport can be arranged separately if required.";
};

// Competition messaging per spec
const getCompetitionMessage = (mode: "bidding" | "auto_assign") => {
  if (mode === "bidding") {
    return "Strong supplier competition observed";
  }
  return "Optimized using historical supplier performance";
};

export const PriceConfidenceMeter = ({
  data,
  showDetails = true,
  compact = false,
  showVolatilityNotice = true,
}: PriceConfidenceMeterProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const getConfidenceColor = (label: string) => {
    switch (label) {
      case "HIGH":
        return "text-green-600 bg-green-100 border-green-200";
      case "MEDIUM":
        return "text-amber-600 bg-amber-100 border-amber-200";
      case "LOW":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getConfidenceIcon = (label: string) => {
    switch (label) {
      case "HIGH":
        return <TrendingUp className="h-4 w-4" />;
      case "MEDIUM":
        return <Minus className="h-4 w-4" />;
      case "LOW":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getConfidenceEmoji = (label: string) => {
    switch (label) {
      case "HIGH":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🔴";
      default:
        return "";
    }
  };

  // Show volatility notice for LOW confidence or explicit flag
  const shouldShowVolatility = showVolatilityNotice && 
    (data.confidence_label === "LOW" || data.market_volatility);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-2">
              <Badge
                variant="outline"
                className={`${getConfidenceColor(data.confidence_label)} cursor-help`}
              >
                <span className="mr-1">{getConfidenceEmoji(data.confidence_label)}</span>
                {getConfidenceIcon(data.confidence_label)}
                <span className="ml-1">{data.confidence_label} Confidence</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs p-3">
            <p className="font-medium mb-1">
              {CONFIDENCE_DESCRIPTIONS[data.confidence_label]}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.buyer_message}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        {/* Header with AI branding */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-sm">AI Price Confidence Meter</span>
              <p className="text-xs text-muted-foreground">
                AI-verified price reliability based on real market conditions
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3" side="left">
                <p className="font-semibold mb-2">What does this mean?</p>
                <p className="text-xs text-muted-foreground mb-2">
                  This confidence score is generated by Procuresaathi's AI by analyzing:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                  <li>• Current market price trends</li>
                  <li>• Number of supplier quotes received</li>
                  <li>• Demand–supply balance</li>
                  <li>• Historical transaction data</li>
                </ul>
                <p className="text-xs text-muted-foreground italic">
                  Supplier identities remain confidential. Prices may change based on market conditions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Confidence Badge and Description */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getConfidenceEmoji(data.confidence_label)}</span>
            <Badge
              variant="outline"
              className={`${getConfidenceColor(data.confidence_label)} text-sm`}
            >
              {getConfidenceIcon(data.confidence_label)}
              <span className="ml-1">{data.confidence_label} Confidence</span>
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground">
            {CONFIDENCE_DESCRIPTIONS[data.confidence_label]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Confidence Score</span>
            <span className="font-bold">{data.price_confidence_score}/100</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full ${getProgressColor(data.price_confidence_score)} transition-all duration-500`}
              style={{ width: `${data.price_confidence_score}%` }}
            />
          </div>
        </div>

        {/* Competition Messaging */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Badge variant="secondary" className="text-xs">
            {data.mode === "bidding" ? "Bidding Mode" : "Auto-Assign"}
          </Badge>
          <span>{getCompetitionMessage(data.mode)}</span>
        </div>

        {/* Logistics Disclosure */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3 p-2 bg-muted/50 rounded-md">
          <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{getLogisticsDisclosure(data.logistics_cost)}</span>
        </div>

        {/* Market Volatility Notice */}
        {shouldShowVolatility && (
          <div className="flex items-start gap-2 text-sm p-2 bg-amber-50 border border-amber-200 rounded-md mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">⚠️ Market Notice</p>
              <p className="text-xs text-amber-700">
                Prices in this category are currently fluctuating due to market conditions.
                Procuresaathi ensures you receive the best available option at the time of order.
              </p>
            </div>
          </div>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span>View Details</span>
                {isDetailsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                <p className="font-medium text-foreground">How this price was evaluated:</p>
                <ul className="space-y-1 pl-2">
                  <li>• Compared against recent market prices</li>
                  <li>• Validated using supplier quotations (if available)</li>
                  <li>• Adjusted for demand–supply conditions</li>
                  <li>• Optimized for delivery reliability</li>
                </ul>
                
                {data.price_behavior_note && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{data.price_behavior_note}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer Trust Line */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground/70 text-center">
            Supplier details remain confidential. Procuresaathi manages pricing, 
            supplier selection, and fulfillment to ensure fair and reliable procurement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceConfidenceMeter;
