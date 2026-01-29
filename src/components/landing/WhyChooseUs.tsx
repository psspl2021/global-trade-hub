import { 
  Shield, 
  TrendingDown, 
  Users, 
  Truck, 
  Clock, 
  BadgeCheck,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const benefits = [
  {
    icon: TrendingDown,
    title: "Competitive Pricing",
    description: "Sealed bidding ensures you receive competitive rates from verified suppliers.",
  },
  {
    icon: Shield,
    title: "Verified Partners Only",
    description: "All suppliers, buyers, and logistics partners are verified for trust and reliability.",
  },
  {
    icon: Users,
    title: "Pan-India Network",
    description: "Access suppliers and buyers across all major Indian cities and industrial hubs.",
  },
  {
    icon: Truck,
    title: "Integrated Logistics",
    description: "Book verified trucks and warehouses directly with real-time tracking.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Post requirements once, receive competitive bids. No endless calls or negotiations.",
  },
];

const comparisonData = [
  { feature: "Supplier Discovery", traditional: "Weeks of research", procuresaathi: "Instant access to verified suppliers" },
  { feature: "Price Negotiation", traditional: "Multiple rounds of calls", procuresaathi: "Automated competitive bidding" },
  { feature: "Supplier Verification", traditional: "Manual background checks", procuresaathi: "Pre-verified on platform" },
  { feature: "Logistics Booking", traditional: "Separate broker network", procuresaathi: "Integrated with verified fleet" },
  { feature: "Payment Tracking", traditional: "Manual invoicing", procuresaathi: "Automated platform invoices" },
];

export const WhyChooseUs = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Benefits Grid */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Why Choose ProcureSaathi?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            AI-powered B2B sourcing platform for modern procurement needs.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-xs">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-foreground text-center mb-4">
            Traditional Sourcing vs ProcureSaathi
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 text-foreground font-semibold">Feature</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground">Traditional</th>
                  <th className="text-left py-2.5 px-3 text-primary font-semibold">ProcureSaathi</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2.5 px-3 text-foreground font-medium">{row.feature}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{row.traditional}</td>
                    <td className="py-2.5 px-3 text-foreground text-xs flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {row.procuresaathi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-6">
            <Button 
              onClick={() => navigate('/signup')}
              className="gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
