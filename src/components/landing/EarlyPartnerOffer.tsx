import { Star, Users, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EarlyPartnerOfferProps {
  showCountdown?: boolean;
  showNumbers?: boolean;
  supplierCount?: number;
  logisticsCount?: number;
  ctaLabel?: string;
  onCTAClick?: () => void;
}

export const EarlyPartnerOffer = ({
  showCountdown = false,
  showNumbers = false,
  supplierCount = 0,
  logisticsCount = 0,
  ctaLabel = "Join Early Partner Program",
  onCTAClick,
}: EarlyPartnerOfferProps) => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm max-w-4xl mx-auto">
          <CardContent className="p-6 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">Early Partner Program</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Build Your Network Early
              </h2>
              
              <p className="text-muted-foreground max-w-2xl mx-auto">
                First 100 verified suppliers may receive{" "}
                <span className="text-primary font-semibold">1 Year Premium Access</span>{" "}
                — unlimited bids, priority listing, and featured visibility.
              </p>
            </div>

            {/* Live Counter - Only show when showNumbers is true */}
            {showNumbers && (
              <div className="flex items-center justify-center gap-3 bg-muted/50 rounded-lg p-4 mb-8 max-w-xs mx-auto">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-foreground">
                    {supplierCount + logisticsCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Partners onboarded
                  </p>
                </div>
              </div>
            )}

            {/* Urgency Copy - Only show when showCountdown is true */}
            {showCountdown && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6 bg-muted/30 rounded-lg py-3 px-4">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Limited slots remaining — Early partner benefits close once capacity is reached.
                </span>
              </div>
            )}

            {/* CTA Button */}
            <div className="text-center mb-6">
              <Button
                size="lg"
                onClick={onCTAClick}
                className="gap-2 px-8"
              >
                <Zap className="h-4 w-4" />
                {ctaLabel}
              </Button>
            </div>

            {/* Trust Disclaimer */}
            <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto">
              This is an early access program for verified suppliers and logistics partners. 
              Premium access is subject to verification and approval. 
              Benefits may vary based on category and region.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
