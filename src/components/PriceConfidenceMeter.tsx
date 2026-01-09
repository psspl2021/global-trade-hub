import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Shield, Truck, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PriceConfidenceData {
  price_confidence_score: number;
  confidence_label: "HIGH" | "MEDIUM" | "LOW";
  buyer_message: string;
  price_behavior_note: string;
  logistics_note: string;
  mode: "bidding" | "auto_assign";
}

interface PriceConfidenceMeterProps {
  data: PriceConfidenceData;
  showDetails?: boolean;
  compact?: boolean;
}

export const PriceConfidenceMeter = ({
  data,
  showDetails = true,
  compact = false,
}: PriceConfidenceMeterProps) => {
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
                {getConfidenceIcon(data.confidence_label)}
                <span className="ml-1">{data.confidence_label}</span>
                <span className="ml-1 font-bold">{data.price_confidence_score}</span>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">{data.buyer_message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.price_behavior_note}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Price Confidence</span>
          </div>
          <Badge
            variant="outline"
            className={getConfidenceColor(data.confidence_label)}
          >
            {getConfidenceIcon(data.confidence_label)}
            <span className="ml-1">{data.confidence_label}</span>
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
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

          <p className="text-sm font-medium text-foreground">
            {data.buyer_message}
          </p>

          {showDetails && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{data.price_behavior_note}</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Truck className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{data.logistics_note}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {data.mode === "bidding" ? "Competitive Bidding" : "Fast Track"}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceConfidenceMeter;
