import { useState, useEffect } from "react";
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
  market_volatility?: boolean;
  logistics_cost?: number;
  // SEO: Optional product/category info for structured data
  productName?: string;
  productCategory?: string;
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

// SEO: Map confidence to rating value (1-5 scale for schema.org)
const CONFIDENCE_TO_RATING = {
  HIGH: 5,
  MEDIUM: 3.5,
  LOW: 2,
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

// SEO: Generate structured data for price confidence
const generateStructuredData = (data: PriceConfidenceData) => {
  const ratingValue = CONFIDENCE_TO_RATING[data.confidence_label];
  
  // Use Service schema instead of Product for rating context (GSC compliance - no Product on non-product pages)
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "Service",
      "name": data.productName || "B2B Procurement Service",
      "serviceType": data.productCategory || "Industrial Procurement",
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "description": `AI-verified pricing with ${data.confidence_label.toLowerCase()} confidence score of ${data.price_confidence_score}/100`
    },
    "ratingValue": ratingValue,
    "bestRating": 5,
    "worstRating": 1,
    "ratingCount": 1,
    "reviewCount": 1,
    "name": "AI Price Confidence Score",
    "description": CONFIDENCE_DESCRIPTIONS[data.confidence_label]
  };
};

export const PriceConfidenceMeter = ({
  data,
  showDetails = true,
  compact = false,
  showVolatilityNotice = true,
}: PriceConfidenceMeterProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // SEO: Inject structured data on mount
  useEffect(() => {
    const structuredData = generateStructuredData(data);
    const scriptId = 'price-confidence-structured-data';
    
    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Inject new structured data
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);

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
        return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
      case "MEDIUM":
        return <Minus className="h-4 w-4" aria-hidden="true" />;
      case "LOW":
        return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
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

  // SEO: Accessibility label for screen readers
  const ariaLabel = `AI Price Confidence: ${data.confidence_label} confidence with score ${data.price_confidence_score} out of 100. ${CONFIDENCE_DESCRIPTIONS[data.confidence_label]}`;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="inline-flex items-center gap-2"
              role="meter"
              aria-label={ariaLabel}
              aria-valuenow={data.price_confidence_score}
              aria-valuemin={0}
              aria-valuemax={100}
              itemScope
              itemType="https://schema.org/Rating"
            >
              <meta itemProp="worstRating" content="0" />
              <meta itemProp="bestRating" content="100" />
              <meta itemProp="ratingValue" content={String(data.price_confidence_score)} />
              <Badge
                variant="outline"
                className={`${getConfidenceColor(data.confidence_label)} cursor-help`}
              >
                <span className="mr-1" aria-hidden="true">{getConfidenceEmoji(data.confidence_label)}</span>
                {getConfidenceIcon(data.confidence_label)}
                <span className="ml-1" itemProp="name">{data.confidence_label} Confidence</span>
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
    <Card 
      className="border-2"
      role="region"
      aria-label="AI Price Confidence Analysis"
      itemScope
      itemType="https://schema.org/AggregateRating"
    >
      {/* SEO: Hidden structured data for search engines */}
      <meta itemProp="worstRating" content="0" />
      <meta itemProp="bestRating" content="100" />
      <meta itemProp="ratingValue" content={String(data.price_confidence_score)} />
      <meta itemProp="ratingCount" content="1" />
      
      <CardContent className="p-4">
        {/* Header with AI branding */}
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <Sparkles className="h-4 w-4 text-primary" />
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" itemProp="name">
                AI Price Confidence Meter
              </h3>
              <p className="text-xs text-muted-foreground" itemProp="description">
                AI-verified price reliability based on real market conditions
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  aria-label="Learn more about AI Price Confidence scoring"
                >
                  <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
        </header>

        {/* Confidence Badge and Description */}
        <section className="mb-4" aria-labelledby="confidence-level-heading">
          <h4 id="confidence-level-heading" className="sr-only">Confidence Level</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg" aria-hidden="true">{getConfidenceEmoji(data.confidence_label)}</span>
            <Badge
              variant="outline"
              className={`${getConfidenceColor(data.confidence_label)} text-sm`}
            >
              {getConfidenceIcon(data.confidence_label)}
              <span className="ml-1">{data.confidence_label} Confidence</span>
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground" itemProp="reviewBody">
            {CONFIDENCE_DESCRIPTIONS[data.confidence_label]}
          </p>
        </section>

        {/* Progress Bar with ARIA */}
        <section className="mb-4" aria-labelledby="confidence-score-heading">
          <div className="flex justify-between text-sm mb-1">
            <span id="confidence-score-heading" className="text-muted-foreground">Confidence Score</span>
            <span className="font-bold" aria-live="polite">{data.price_confidence_score}/100</span>
          </div>
          <div 
            className="relative h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={data.price_confidence_score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Price confidence score: ${data.price_confidence_score} out of 100`}
          >
            <div
              className={`absolute left-0 top-0 h-full ${getProgressColor(data.price_confidence_score)} transition-all duration-500`}
              style={{ width: `${data.price_confidence_score}%` }}
            />
          </div>
        </section>

        {/* Competition Messaging */}
        <section className="flex items-center gap-2 text-sm text-muted-foreground mb-3" aria-label="Pricing mode information">
          <Badge variant="secondary" className="text-xs">
            {data.mode === "bidding" ? "Bidding Mode" : "Auto-Assign"}
          </Badge>
          <span>{getCompetitionMessage(data.mode)}</span>
        </section>

        {/* Logistics Disclosure */}
        <section 
          className="flex items-start gap-2 text-sm text-muted-foreground mb-3 p-2 bg-muted/50 rounded-md"
          aria-label="Logistics information"
        >
          <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{getLogisticsDisclosure(data.logistics_cost)}</span>
        </section>

        {/* Market Volatility Notice */}
        {shouldShowVolatility && (
          <section 
            className="flex items-start gap-2 text-sm p-2 bg-amber-50 border border-amber-200 rounded-md mb-3"
            role="alert"
            aria-label="Market volatility warning"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-800">⚠️ Market Notice</p>
              <p className="text-xs text-amber-700">
                Prices in this category are currently fluctuating due to market conditions.
                Procuresaathi ensures you receive the best available option at the time of order.
              </p>
            </div>
          </section>
        )}

        {/* Expandable Details */}
        {showDetails && (
          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between text-xs"
                aria-expanded={isDetailsOpen}
                aria-controls="price-evaluation-details"
              >
                <span>View Details</span>
                {isDetailsOpen ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent id="price-evaluation-details" className="pt-2">
              <article className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                <h5 className="font-medium text-foreground">How this price was evaluated:</h5>
                <ul className="space-y-1 pl-2" role="list">
                  <li>• Compared against recent market prices</li>
                  <li>• Validated using supplier quotations (if available)</li>
                  <li>• Adjusted for demand–supply conditions</li>
                  <li>• Optimized for delivery reliability</li>
                </ul>
                
                {data.price_behavior_note && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{data.price_behavior_note}</span>
                  </div>
                )}
              </article>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer Trust Line */}
        <footer className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground/70 text-center">
            Supplier details remain confidential. Procuresaathi manages pricing, 
            supplier selection, and fulfillment to ensure fair and reliable procurement.
          </p>
        </footer>
      </CardContent>
    </Card>
  );
};

export default PriceConfidenceMeter;
