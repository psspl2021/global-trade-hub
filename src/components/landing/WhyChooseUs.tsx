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
    title: "Reduce Costs by 15-30%",
    description: "Competitive sealed bidding ensures you always get the best market rates from verified suppliers.",
  },
  {
    icon: Shield,
    title: "Verified Partners Only",
    description: "All suppliers, buyers, and logistics partners go through our verification process for trust and reliability.",
  },
  {
    icon: Users,
    title: "Pan-India Network",
    description: "Access thousands of suppliers and buyers across all major Indian cities and industrial hubs.",
  },
  {
    icon: Truck,
    title: "Integrated Logistics",
    description: "Book verified trucks and warehouses directly. Track shipments in real-time from pickup to delivery.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Post requirements once, receive multiple competitive bids. No more endless calls and negotiations.",
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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Benefits Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why Choose ProcureSaathi?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            India's most trusted B2B sourcing platform, built for modern procurement needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:border-primary/50"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Traditional Sourcing vs ProcureSaathi
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-foreground font-semibold">Feature</th>
                  <th className="text-left py-4 px-4 text-muted-foreground">Traditional Way</th>
                  <th className="text-left py-4 px-4 text-primary font-semibold">ProcureSaathi</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 px-4 text-foreground font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-muted-foreground">{row.traditional}</td>
                    <td className="py-4 px-4 text-foreground flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      {row.procuresaathi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Button 
              size="lg" 
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
