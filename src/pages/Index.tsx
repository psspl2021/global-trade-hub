import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search, ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, Building2, FileText, CheckCircle, Send, 
  Package, Trophy, Users, Shield, Target, Eye, Radio 
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { countries } from '@/data/countries';
import { supabase } from '@/integrations/supabase/client';
import { SearchResults } from '@/components/SearchResults';
import { useToast } from '@/hooks/use-toast';

interface InternalProduct {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  supplier_name: string;
  stock_quantity: number | null;
  stock_unit: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [internalProducts, setInternalProducts] = useState<InternalProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const { toast } = useToast();

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
    { name: 'Metals - Ferrous (Steel, Iron)', icon: '🔩' },
    { name: 'Metals - Non-Ferrous (Copper, Aluminium)', icon: '🥉' },
    { name: 'Mobile Electronics', icon: '📲' },
    { name: 'Mother, Kids & Toys', icon: '🧸' },
    { name: 'Printing & Packaging', icon: '📦' },
    { name: 'School & Office Supplies', icon: '✏️' },
    { name: 'Sports & Outdoor', icon: '⚽' },
    { name: 'Telecommunication', icon: '📡' },
  ];

  const popularSearches = [
    { term: 'Electronics', category: 'Consumer Electronics' },
    { term: 'Machinery', category: 'Machinery & Equipment' },
    { term: 'Apparel', category: 'Fashion Apparel & Fabrics' },
    { term: 'Auto Parts', category: 'Auto Vehicle & Accessories' },
    { term: 'Hardware', category: 'Hardware & Tools' },
    { term: 'Home Appliances', category: 'Home Appliances' },
    { term: 'Building Material', category: 'Industrial Supplies' },
  ];

  // Mask company name for privacy
  const maskCompanyName = (name: string): string => {
    if (name.length <= 3) return name + '***';
    return name.substring(0, 3) + '***';
  };

  // Search internal products
  const searchInternalProducts = async (keyword: string) => {
    if (!keyword.trim()) return;
    
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          description,
          price_range_min,
          price_range_max,
          supplier_id
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .limit(10);

      if (error) throw error;
      if (!productsData || productsData.length === 0) {
        setInternalProducts([]);
        return;
      }

      // Get supplier profiles
      const supplierIds = [...new Set(productsData.map(p => p.supplier_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', supplierIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.company_name]) || []);

      // Get stock inventory
      const productIds = productsData.map(p => p.id);
      const { data: stockData } = await supabase
        .from('stock_inventory')
        .select('product_id, quantity, unit')
        .in('product_id', productIds);

      const stockMap = new Map(stockData?.map(s => [s.product_id, s]) || []);

      // Combine data
      const products: InternalProduct[] = productsData.map(product => {
        const stock = stockMap.get(product.id);
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          description: product.description,
          price_range_min: product.price_range_min,
          price_range_max: product.price_range_max,
          supplier_name: maskCompanyName(profilesMap.get(product.supplier_id) || 'Unknown'),
          stock_quantity: stock?.quantity ?? null,
          stock_unit: stock?.unit ?? null,
        };
      });

      setInternalProducts(products);
    } catch (error) {
      console.error('Error searching internal products:', error);
      setInternalProducts([]);
    }
  };

  // Handle inline search
  const handleSearchSuppliers = async () => {
    const keyword = searchKeyword.trim();
    const categoryName = searchCategory || '';
    const countryName = searchCountry 
      ? countries.find(c => c.code === searchCountry)?.name 
      : '';
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setInternalProducts([]);
    
    // Search both internal and external in parallel
    const [_, externalResult] = await Promise.allSettled([
      searchInternalProducts(keyword),
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke('search-suppliers', {
            body: { keyword, category: categoryName, country: countryName },
          });
          
          if (error) throw error;
          
          setSearchResults(data.results || []);
          setLastSearchQuery(data.query || keyword);
          
          if (data.results?.length === 0 && !keyword) {
            toast({
              title: "No results found",
              description: "Try different keywords or broaden your search",
            });
          }
        } catch (error: any) {
          console.error('Search error:', error);
          setSearchError(error.message || 'Failed to search. Please try again.');
          toast({
            title: "External search failed",
            description: "Showing internal products only",
            variant: "destructive",
          });
        }
      })()
    ]);

    setIsSearching(false);
  };

  // Handle top search click
  const handleTopSearchClick = (term: string, category: string) => {
    setSearchKeyword(term);
    setSearchCategory(category);
    handleSearchSuppliers();
  };

  // Handle Enter key in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSuppliers();
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/signup?category=${encodeURIComponent(categoryName)}`);
  };

  const buyerSteps = [
    { icon: FileText, title: 'Post Requirement', description: 'Submit your sourcing needs with detailed specifications' },
    { icon: Mail, title: 'Receive Sealed Bids', description: 'Get competitive bids from verified suppliers' },
    { icon: CheckCircle, title: 'Accept Best Bid', description: 'Review and accept the lowest bid' },
    { icon: Users, title: 'Complete Transaction', description: 'Finalize with ProcureSaathi support' },
  ];

  const supplierSteps = [
    { icon: Search, title: 'Browse Requirements', description: 'View active buyer requirements in your category' },
    { icon: Send, title: 'Submit Sealed Bid', description: 'Place your competitive bid (hidden from others)' },
    { icon: Trophy, title: 'Win Contract', description: 'Get notified when your bid is accepted' },
    { icon: Package, title: 'Fulfill Order', description: 'Deliver and complete the transaction' },
  ];

  const stats = [
    { label: 'Established', value: '2021' },
    { label: 'Suppliers', value: '1000+' },
    { label: 'Buyers', value: '500+' },
    { label: 'Categories', value: '23' },
  ];

  const coreValues = [
    { icon: Shield, title: 'Trust & Transparency', description: 'Sealed bidding ensures fair pricing' },
    { icon: CheckCircle, title: 'Verified Partners', description: 'All suppliers and buyers are verified' },
    { icon: Users, title: 'End-to-End Support', description: 'From requirement to delivery' },
    { icon: Target, title: 'Secure Transactions', description: 'Protected business dealings' },
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
            <Button variant="ghost" onClick={() => scrollToSection('about')}>About Us</Button>
            <Button variant="ghost" onClick={() => scrollToSection('how-it-works')}>How It Works</Button>
            <Button variant="ghost" onClick={() => scrollToSection('contact')}>Contact</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
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
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    CATEGORY
                  </label>
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-background">
                      {categories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    COUNTRY
                  </label>
                  <Select value={searchCountry} onValueChange={setSearchCountry}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 bg-background">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full h-14 text-lg" 
                onClick={handleSearchSuppliers}
                disabled={isSearching}
              >
                <Search className="h-5 w-5 mr-2" />
                {isSearching ? 'Searching...' : 'Search Suppliers'}
              </Button>
              <div className="mt-4 text-center">
                <span className="text-sm text-muted-foreground mr-2">TOP SEARCH:</span>
                <div className="inline-flex flex-wrap gap-2 justify-center mt-2">
                  {popularSearches.map((search) => (
                    <span 
                      key={search.term} 
                      className="text-sm text-primary hover:underline cursor-pointer px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                      onClick={() => handleTopSearchClick(search.term, search.category)}
                    >
                      {search.term}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Internal Products Results */}
              {internalProducts.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Products from Verified Suppliers</h3>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Radio className="h-3 w-3 text-green-500" />
                      Live Stock
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {internalProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{product.name}</h4>
                              <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                <Badge variant="secondary">{product.category}</Badge>
                                {product.stock_quantity !== null && (
                                  <Badge variant={product.stock_quantity > 0 ? 'default' : 'destructive'}>
                                    {product.stock_quantity > 0 
                                      ? `${product.stock_quantity} ${product.stock_unit || 'units'} in stock` 
                                      : 'Out of stock'}
                                  </Badge>
                                )}
                              </div>
                              {product.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span>{product.supplier_name}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {(product.price_range_min || product.price_range_max) && (
                                <p className="font-medium text-primary">
                                  {product.price_range_min && product.price_range_max
                                    ? `₹${product.price_range_min.toLocaleString()} - ₹${product.price_range_max.toLocaleString()}`
                                    : product.price_range_min
                                      ? `From ₹${product.price_range_min.toLocaleString()}`
                                      : `Up to ₹${product.price_range_max?.toLocaleString()}`
                                  }
                                </p>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => navigate('/signup?role=buyer')}
                              >
                                Sign up to contact
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {/* External Search Results */}
              <SearchResults
                results={searchResults}
                isLoading={isSearching}
                error={searchError}
                searchQuery={lastSearchQuery}
              />
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
                  onClick={() => navigate('/signup?role=buyer')}
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
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  Join Now as Supplier
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">About ProcureSaathi</h2>
            <p className="text-center text-muted-foreground mb-12">Your Trusted B2B Procurement Partner</p>
            
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Our Mission</h3>
                  </div>
                  <p className="text-muted-foreground">
                    To revolutionize B2B procurement by creating a transparent, efficient, and secure platform 
                    that connects verified buyers and suppliers across India and globally.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Our Vision</h3>
                  </div>
                  <p className="text-muted-foreground">
                    To become India's most trusted B2B sourcing platform, enabling businesses to source 
                    remotely with confidence and complete transparency.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-6">
                    <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Core Values */}
            <h3 className="text-xl font-semibold text-center mb-6">Our Core Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {coreValues.map((value) => (
                <Card key={value.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <value.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm mb-1">{value.title}</h4>
                    <p className="text-xs text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Company Description */}
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">#SourceRemotely - The New Reality</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Since 2021, ProcureSaathi has revolutionized the B2B sourcing sector as India's first-ever 
                Reverse Marketplace Platform offering direct procurement services to businesses worldwide. 
                Our innovative sealed bidding system ensures fair competition while maintaining complete transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12">Simple steps to source or sell on ProcureSaathi</p>
          
          <Tabs defaultValue="buyer" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="buyer">For Buyers</TabsTrigger>
              <TabsTrigger value="supplier">For Suppliers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buyer">
              <div className="grid md:grid-cols-4 gap-6">
                {buyerSteps.map((step, index) => (
                  <Card key={step.title} className="text-center relative">
                    <CardContent className="p-6">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <step.icon className="h-10 w-10 text-primary mx-auto mb-4 mt-2" />
                      <h4 className="font-semibold mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button size="lg" onClick={() => navigate('/auth?role=buyer')}>
                  Start Sourcing Now
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="supplier">
              <div className="grid md:grid-cols-4 gap-6">
                {supplierSteps.map((step, index) => (
                  <Card key={step.title} className="text-center relative">
                    <CardContent className="p-6">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <step.icon className="h-10 w-10 text-warning mx-auto mb-4 mt-2" />
                      <h4 className="font-semibold mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button size="lg" variant="outline" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground" onClick={() => navigate('/auth?role=supplier')}>
                  Start Selling Now
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
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
                onClick={() => handleCategoryClick(category.name)}
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

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Contact Us</h2>
          <p className="text-center text-muted-foreground mb-12">Get in touch with our team</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Address */}
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Address</h4>
                <p className="text-sm text-muted-foreground">
                  PROCURESAATHI SOLUTIONS PRIVATE LIMITED<br />
                  Metro Pillar Number 564, 14/3 Mathura Road, Sector-31, Haryana - 121003
                </p>
              </CardContent>
            </Card>
            
            {/* Email */}
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Email</h4>
                <a href="mailto:sales@procuresaathi.com" className="text-sm text-primary hover:underline">
                  sales@procuresaathi.com
                </a>
              </CardContent>
            </Card>
            
            {/* GSTIN */}
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">GSTIN</h4>
                <p className="text-sm text-muted-foreground">06AAMCP4662L1ZW</p>
              </CardContent>
            </Card>
            
            {/* Business Hours */}
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Business Hours</h4>
                <p className="text-sm text-muted-foreground">
                  Monday - Saturday<br />
                  9:00 AM - 6:00 PM IST
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Have questions? We'd love to hear from you!</p>
            <Button size="lg" onClick={() => window.location.href = 'mailto:sales@procuresaathi.com'}>
              <Mail className="h-4 w-4 mr-2" />
              Send us an Email
            </Button>
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
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h4 className="font-semibold mb-4">PROCURESAATHI SOLUTIONS PRIVATE LIMITED</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Metro Pillar Number 564, 14/3 Mathura Road, Sector-31, Haryana - 121003
              </p>
              <p className="text-sm text-muted-foreground">GSTIN: 06AAMCP4662L1ZW</p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => scrollToSection('about')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  About Us
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  How It Works
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Contact Us
                </button>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <a href="mailto:sales@procuresaathi.com" className="text-sm text-primary hover:underline">
                sales@procuresaathi.com
              </a>
              <p className="text-sm text-muted-foreground mt-2">
                Mon - Sat: 9:00 AM - 6:00 PM IST
              </p>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ProcureSaathi Solutions Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
