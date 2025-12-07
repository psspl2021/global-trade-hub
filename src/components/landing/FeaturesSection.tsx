import { FileText, ShieldCheck, Lock, Truck, Package, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: FileText,
    title: 'Post Requirements',
    description: 'Post your sourcing needs and receive competitive bids from verified suppliers.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Suppliers',
    description: 'Access a network of verified, trusted suppliers with quality certifications.',
  },
  {
    icon: Lock,
    title: 'Sealed Bidding',
    description: 'Transparent, competitive pricing through our sealed bidding system.',
  },
  {
    icon: Truck,
    title: 'Logistics Integration',
    description: 'Book trucks and track shipments in real-time with integrated logistics.',
  },
  {
    icon: Package,
    title: 'Stock Management',
    description: 'Suppliers can list and manage inventory with real-time stock updates.',
  },
  {
    icon: Sparkles,
    title: 'Smart Matching',
    description: 'AI-powered supplier recommendations based on your requirements.',
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Your Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to streamline procurement and grow your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
