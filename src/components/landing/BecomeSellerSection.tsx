import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, Users, ArrowRightLeft, Network, 
  Store, ListChecks, TrendingUp, ArrowRight
} from 'lucide-react';

const stats = [
  { value: '500+', label: 'Businesses', icon: Users },
  { value: '50+', label: 'Countries', icon: Globe },
  { value: '1000+', label: 'Transactions', icon: ArrowRightLeft },
  { value: '10K+', label: 'Connections', icon: Network }
];

const howItWorks = [
  {
    icon: Store,
    title: 'Create your Online Store',
    description: 'Start selling online with a comprehensive ecommerce solution.'
  },
  {
    icon: ListChecks,
    title: 'List on Marketplaces',
    description: 'List your products on multiple marketplaces and grow your global visibility and reach.'
  },
  {
    icon: TrendingUp,
    title: 'Grow your Business',
    description: 'Analyse and optimise your store performance to grow your business.'
  }
];

const benefits = [
  'One Listing, Many Marketplaces',
  'B2B Feature Catalogue',
  'AI-Powered Product Descriptions',
  'Integrated Logistics Support',
  'Secure Payment Processing',
  'Analytics & Insights Dashboard'
];

export const BecomeSellerSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-warning/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">ALL-IN-ONE PLATFORM</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            World of Opportunities on a<br />
            <span className="text-primary">Single Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Boost your business's global visibility and reach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="h-14 px-8"
              onClick={() => navigate('/signup?role=supplier')}
            >
              Sign Up For Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="link"
              onClick={() => navigate('/login')}
            >
              Already a Seller? Sign In
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-10">How it Works</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
              <Card key={step.title} className="relative border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-lg">
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 w-fit mx-auto mb-4 mt-2">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-center mb-6">Why Sell on ProcureSaathi</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button 
                size="lg"
                className="bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Start Selling Today
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
