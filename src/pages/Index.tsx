import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingBag, MessageSquare } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';

const Index = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Auto Vehicle & Accessories', icon: '🚗' },
    { name: 'Beauty & Personal Care', icon: '💄' },
    { name: 'Consumer Electronics', icon: '📱' },
    { name: 'Electronic Components', icon: '🔌' },
    { name: 'Fashion Accessories & Footwear', icon: '👟' },
    { name: 'Fashion Apparel & Fabrics', icon: '👔' },
    { name: 'Food & Beverages', icon: '🍽️' },
    { name: 'Furniture & Home Decor', icon: '🛋️' },
    { name: 'Gifts & Festival Products', icon: '🎁' },
    { name: 'Hardware & Tools', icon: '🔧' },
    { name: 'Health Care Products', icon: '🏥' },
    { name: 'Home Appliances', icon: '🏠' },
    { name: 'Household & Pets', icon: '🐕' },
    { name: 'Industrial Supplies', icon: '🏭' },
    { name: 'Machinery & Equipment', icon: '⚙️' },
    { name: 'Mobile Electronics', icon: '📲' },
    { name: 'Mother, Kids & Toys', icon: '🧸' },
    { name: 'Printing & Packaging', icon: '📦' },
    { name: 'School & Office Supplies', icon: '✏️' },
    { name: 'Sports & Outdoor', icon: '⚽' },
    { name: 'Telecommunication', icon: '📡' },
  ];

  const popularSearches = [
    'Electronics',
    'Machinery',
    'Apparel',
    'Auto Parts',
    'Hardware',
    'Home Appliances',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Info Bar */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Important:</span> ProcureSaathi - The future of B2B procurement. 
            Connect with verified suppliers and buyers worldwide. Post requirements and get competitive bids.
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-28 w-auto object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost">About Us</Button>
            <Button variant="ghost">How It Works</Button>
            <Button variant="ghost">Contact</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Login
            </Button>
            <Button onClick={() => navigate('/auth')}>Join Now</Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-muted/30 via-background to-muted/50 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              For the <span className="text-primary">Global</span> B2B Sourcing{' '}
              <span className="text-warning">Platform</span>
            </h1>
          </div>

          {/* Search Box */}
          <Card className="max-w-4xl mx-auto shadow-xl">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    KEYWORD
                  </label>
                  <Input 
                    placeholder="Enter Product Keyword" 
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    CATEGORY
                  </label>
                  <Select>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industrial">Industrial Equipment</SelectItem>
                      <SelectItem value="electronics">Electronics & Technology</SelectItem>
                      <SelectItem value="chemicals">Chemicals & Materials</SelectItem>
                      <SelectItem value="textiles">Textiles & Apparel</SelectItem>
                      <SelectItem value="food">Food & Beverages</SelectItem>
                      <SelectItem value="construction">Construction Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    COUNTRY
                  </label>
                  <Select>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="india">India</SelectItem>
                      <SelectItem value="china">China</SelectItem>
                      <SelectItem value="usa">United States</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                      <SelectItem value="japan">Japan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="lg" className="w-full h-14 text-lg">
                <Search className="h-5 w-5 mr-2" />
                Search Suppliers
              </Button>
              <div className="mt-4 text-center">
                <span className="text-sm text-muted-foreground mr-2">TOP SEARCH:</span>
                <div className="inline-flex flex-wrap gap-2 justify-center mt-2">
                  {popularSearches.map((term) => (
                    <span 
                      key={term} 
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Buyer CTA */}
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  If you're Sourcing or to Connect with Suppliers, it's FREE, Forever!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Post your requirements and get competitive bids from verified suppliers worldwide.
                </p>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-success text-success hover:bg-success hover:text-success-foreground"
                  onClick={() => navigate('/auth')}
                >
                  Join Now as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Supplier CTA */}
            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-warning mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  For Manufacturers, Join & List your company & start connecting with Global buyers now!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect with buyers worldwide. Choose from Bronze, Silver, and Gold subscription levels.
                </p>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                  onClick={() => navigate('/auth')}
                >
                  Join Now as Supplier
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              #SourceRemotely - The New Reality
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Since 2024, ProcureSaathi has revolutionized the B2B sourcing sector as the first-ever 
              Reverse Marketplace Platform offering direct procurement services to businesses worldwide. 
              Our platform is focused on the Global B2B sourcing sector.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              With innovative features available to all manufacturers, we enable businesses to connect, 
              communicate, and close deals efficiently. Our sealed bidding system ensures fair competition 
              while maintaining transparency.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Browse by Category
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Explore our comprehensive range of product categories
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="font-medium text-xs leading-tight">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 py-16">
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
