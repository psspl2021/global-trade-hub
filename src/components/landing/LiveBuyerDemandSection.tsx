import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";

/**
 * Live Buyer Demand Section - Shows illustrative demand signals detected by AI
 * This is a static/illustrative section for demand-led storytelling
 */
export const LiveBuyerDemandSection = () => {
  // Illustrative demand signals - these represent typical buyer interest patterns
  const demandSignals = [
    { product: "Pipes", country: "Saudi Arabia", flag: "🇸🇦" },
    { product: "Pulses", country: "UAE", flag: "🇦🇪" },
    { product: "Steel Plates", country: "Europe", flag: "🇪🇺" },
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Section Header */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Demand Intelligence</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Live Buyer Demand Detected by AI
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our AI continuously monitors buyer searches, RFQs, and procurement research to identify emerging demand.
          </p>
          
          {/* Demand Signals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {demandSignals.map((signal, index) => (
              <div 
                key={index}
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <span className="text-2xl">{signal.flag}</span>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{signal.product}</p>
                  <p className="text-sm text-muted-foreground">{signal.country}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
              </div>
            ))}
          </div>
          
          {/* Caption */}
          <p className="text-xs text-muted-foreground italic">
            Updated from buyer searches, RFQs, and procurement research. Actual demand signals vary.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LiveBuyerDemandSection;
