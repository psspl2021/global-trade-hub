import { Users, Package, Truck, TrendingUp } from "lucide-react";

const stats = [
  { 
    icon: Users, 
    label: "Verified Suppliers",
    description: "Pan-India network of trusted partners"
  },
  { 
    icon: Package, 
    label: "Product Categories",
    description: "23+ categories across industries"
  },
  { 
    icon: Truck, 
    label: "Logistics Network",
    description: "Verified fleet operators"
  },
  { 
    icon: TrendingUp, 
    label: "AI-Powered Matching",
    description: "Demand-led supplier discovery"
  },
];

export const StatsSection = () => {
  return (
    <section id="stats-section" className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            India's AI-Powered B2B Marketplace
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Join the network of verified buyers, suppliers, and logistics partners.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="font-semibold text-lg mb-1">{stat.label}</div>
              <div className="text-sm text-primary-foreground/70">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
