console.log('[Index.tsx] Module loading');
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Package, Truck } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={procureSaathiLogo} 
            alt="ProcureSaathi Logo" 
            className="h-20 w-auto object-contain"
          />
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-muted/30 via-background to-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ProcureSaathi - India's #1{' '}
              <span className="text-primary">B2B Sourcing</span> Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Connect with verified suppliers, get competitive bids, and complete secure transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup?role=buyer')}>
                <ShoppingBag className="h-5 w-5 mr-2" />
                Join as Buyer
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/signup?role=supplier')}>
                <Package className="h-5 w-5 mr-2" />
                Join as Supplier
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="bg-success/10 border-success/20">
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">For Buyers</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Post requirements and get competitive bids from verified suppliers.
                  </p>
                  <Button className="w-full bg-success hover:bg-success/90" onClick={() => navigate('/signup?role=buyer')}>
                    Join as Buyer
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-warning mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">For Suppliers</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Connect with buyers and grow your business.
                  </p>
                  <Button className="w-full bg-warning hover:bg-warning/90" onClick={() => navigate('/signup?role=supplier')}>
                    Join as Supplier
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">Logistics</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Find verified trucks and warehousing services.
                  </p>
                  <Button className="w-full" onClick={() => navigate('/book-truck')}>
                    Book a Truck
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 ProcureSaathi Solutions Pvt Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;