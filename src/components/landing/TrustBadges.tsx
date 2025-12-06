import { ShieldCheck, Users, Clock, BadgeCheck, Truck, HeadphonesIcon } from "lucide-react";

const badges = [
  {
    icon: ShieldCheck,
    title: "100% Verified",
    description: "All suppliers vetted",
  },
  {
    icon: BadgeCheck,
    title: "Secure Bidding",
    description: "Sealed bid system",
  },
  {
    icon: Users,
    title: "500+ Suppliers",
    description: "Pan-India network",
  },
  {
    icon: Truck,
    title: "Logistics Support",
    description: "End-to-end delivery",
  },
  {
    icon: Clock,
    title: "24hr Response",
    description: "Quick turnaround",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    description: "Expert assistance",
  },
];

export const TrustBadges = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-background transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{badge.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
