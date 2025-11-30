import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package2, TrendingUp, Shield, Zap, Globe, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Industrial Equipment', icon: '🏗️' },
    { name: 'Electronics & Technology', icon: '💻' },
    { name: 'Chemicals & Materials', icon: '⚗️' },
    { name: 'Textiles & Apparel', icon: '👔' },
    { name: 'Food & Beverages', icon: '🍽️' },
    { name: 'Construction Materials', icon: '🏢' },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Suppliers',
      description: 'All suppliers are verified with document authentication',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Bidding',
      description: 'Get the best prices through sealed competitive bids',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with importers and exporters worldwide',
    },
    {
      icon: Zap,
      title: 'Fast Procurement',
      description: 'Streamlined process from requirement to delivery',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">ProcureSaathi</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Login
            </Button>
            <Button onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Your Trusted Partner in{' '}
                <span className="text-primary">Global B2B Trade</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Join ProcureSaathi, the leading B2B reverse marketplace established to revolutionize 
                procurement. Connect with verified suppliers and buyers worldwide. Explore endless 
                opportunities in international trade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/auth')}>
                  <Users className="h-5 w-5 mr-2" />
                  Join as Buyer
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  <Package2 className="h-5 w-5 mr-2" />
                  Join as Supplier
                </Button>
              </div>
            </div>

            {/* Quick Enquiry Card */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">
                  What are you looking for?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Drop your free enquiry and get competitive bids from verified suppliers
                </p>
                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Post Requirement as Buyer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Browse Requirements as Supplier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Best Reverse B2B Marketplace for Global Trade
          </h2>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why Choose Our Marketplace?
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of businesses that trust our platform for their B2B needs
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join ProcureSaathi today and experience the future of B2B procurement
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ProcureSaathi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
