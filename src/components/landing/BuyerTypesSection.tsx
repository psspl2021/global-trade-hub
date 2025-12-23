import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Factory, ShoppingCart, Building2, Globe } from 'lucide-react';

const buyerTypes = [
  {
    title: 'Private Label Buyers',
    description: 'Get custom products made by verified Indian manufacturers with your branding',
    icon: Factory,
    features: ['Custom Manufacturing', 'Quality Control', 'Brand Development', 'Low MOQs'],
    color: 'from-primary/5 to-primary/10 border-primary/20',
    iconColor: 'text-primary',
  },
  {
    title: 'E-commerce Sellers',
    description: 'Source white-label goods fast, with competitive pricing and low minimum orders',
    icon: ShoppingCart,
    features: ['Fast Sourcing', 'White-label Ready', 'Competitive Prices', 'Quick Delivery'],
    color: 'from-warning/5 to-warning/10 border-warning/20',
    iconColor: 'text-warning',
  },
  {
    title: 'Procurement Managers',
    description: 'Raise bulk RFQs, manage multiple suppliers efficiently with enterprise tools',
    icon: Building2,
    features: ['Bulk Orders', 'Supplier Management', 'RFQ System', 'Compliance Tools'],
    color: 'from-success/5 to-success/10 border-success/20',
    iconColor: 'text-success',
  },
  {
    title: 'Foreign Buyers',
    description: 'Trusted sourcing from India with dedicated concierge support and guidance',
    icon: Globe,
    features: ['Cultural Bridge', 'Export Assistance', 'Quality Assurance', 'End-to-end Support'],
    color: 'from-destructive/5 to-destructive/10 border-destructive/20',
    iconColor: 'text-destructive',
  },
];

export const BuyerTypesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Built for Every B2B Buyer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're sourcing for private label, bulk procurement, or e-commerce, 
            we have the right solution for your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {buyerTypes.map((type) => (
            <Card 
              key={type.title}
              className={`bg-gradient-to-br ${type.color} hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group`}
              onClick={() => navigate('/signup?role=buyer')}
            >
              <CardContent className="p-5">
                <type.icon className={`h-10 w-10 ${type.iconColor} mb-4`} />
                <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                  {type.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {type.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {type.features.map((feature) => (
                    <Badge 
                      key={feature} 
                      variant="outline" 
                      className="text-[10px] px-1.5 py-0.5 bg-background/50"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs group-hover:text-primary"
                >
                  Know more
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
