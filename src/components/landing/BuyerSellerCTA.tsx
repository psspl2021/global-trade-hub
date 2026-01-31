import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Store, Search, Sparkles, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export const BuyerSellerCTA = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-primary/10 relative overflow-hidden">
      {/* Background mosaic pattern - reduced opacity and blurred for text clarity */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=400&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) blur(3px) contrast(0.8)'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Hero Search - Enhanced text visibility */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-sm">
            Intelligent B2B Sourcing from<br />
            <span className="text-primary">Verified Indian Companies</span>
          </h2>
          <p className="text-foreground font-medium mb-6">
            Powered by AI. Trusted by Buyers. Built for Indian Sellers.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-background rounded-lg p-2 shadow-lg border">
              <Input
                placeholder="Type keywords, products or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 text-base"
              />
              <Button type="submit" className="px-6">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Dual CTA Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* For Buyers */}
          <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">For Buyers</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Search Products, Post AI-generated RFQs and Connect with top Indian Sellers
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/post-rfq')}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post RFQ – Free
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Sellers */}
          <Card className="bg-warning/5 border-warning/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <Store className="h-8 w-8 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">For Sellers</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Use AI to create your catalog, respond to RFQs, and grow your reach globally
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/signup?role=supplier')}
                    className="border-warning text-warning hover:bg-warning hover:text-warning-foreground text-sm whitespace-normal h-auto py-2"
                  >
                    <Store className="h-4 w-4 mr-2 flex-shrink-0" />
                    AI Detected Demand – List Products
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
