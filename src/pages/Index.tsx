import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, FileText, CheckCircle, Send, Building2,
  Package, Trophy, Users, Shield, Target, Eye, Search,
  Truck, Route, ClipboardCheck, Receipt, BadgeCheck,
  Menu, X, Sparkles
} from 'lucide-react';
const BrowseLogisticsPublic = lazy(() => import('@/components/logistics/BrowseLogisticsPublic'));
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSEO, injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';
import { LazyFAQ } from '@/components/landing/LazyFAQ';
import { StickySignupBanner } from '@/components/StickySignupBanner';
import { NewsletterSignup } from '@/components/landing/NewsletterSignup';
import { DemoRequestForm } from '@/components/landing/DemoRequestForm';
import { EarlyAdopterBanner } from '@/components/landing/EarlyAdopterBanner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { HeroTrustBadges } from '@/components/landing/HeroTrustBadges';


// Lazy load below-the-fold components to reduce initial bundle
const LiveSupplierStock = lazy(() => import('@/components/LiveSupplierStock').then(m => ({ default: m.LiveSupplierStock })));
const BrowseRequirements = lazy(() => import('@/components/BrowseRequirements').then(m => ({ default: m.BrowseRequirements })));
const Testimonials = lazy(() => import('@/components/landing/Testimonials').then(m => ({ default: m.Testimonials })));
const WhyChooseUs = lazy(() => import('@/components/landing/WhyChooseUs').then(m => ({ default: m.WhyChooseUs })));
const StatsSection = lazy(() => import('@/components/landing/StatsSection').then(m => ({ default: m.StatsSection })));
const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
const LiveActivityFeed = lazy(() => import('@/components/landing/LiveActivityFeed').then(m => ({ default: m.LiveActivityFeed })));
const TrustBadges = lazy(() => import('@/components/landing/TrustBadges').then(m => ({ default: m.TrustBadges })));
const ExportCertifications = lazy(() => import('@/components/landing/ExportCertifications').then(m => ({ default: m.ExportCertifications })));

// Minimal loading fallback
const SectionFallback = () => <div className="py-16 bg-background" />;

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLiveStock, setShowLiveStock] = useState(false);
  const [showLiveRequirements, setShowLiveRequirements] = useState(false);
  const [showLogisticsRequirements, setShowLogisticsRequirements] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SEO setup with social sharing meta tags
  useSEO({
    title: "ProcureSaathi | B2B Sourcing Platform India",
    description: "India's #1 B2B sourcing platform. Connect with 1000+ verified suppliers across 23+ categories. Get competitive sealed bids. Join free!",
    canonical: "https://procuresaathi.com/",
    keywords: "B2B marketplace India, B2B sourcing platform, procurement platform, verified suppliers India, wholesale suppliers, bulk buying, industrial supplies, manufacturing",
    ogImage: "https://procuresaathi.com/og-early-adopter.png",
    ogType: "website",
    twitterCard: "summary_large_image"
  });

  // Inject Organization and HowTo schemas
  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');
    
    // HowTo schema for "How It Works" section
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Source Products on ProcureSaathi",
      "description": "Simple steps to source products or sell on ProcureSaathi - India's trusted B2B procurement platform connecting verified buyers and suppliers",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Post Requirement",
          "text": "Submit your sourcing needs with detailed specifications on ProcureSaathi"
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "Receive Sealed Bids",
          "text": "Get competitive bids from verified suppliers across India"
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Accept Best Bid",
          "text": "Review and accept the lowest bid from qualified suppliers"
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Complete Transaction",
          "text": "Finalize your purchase with ProcureSaathi support and secure payment"
        }
      ],
      "totalTime": "PT15M",
      "tool": {
        "@type": "HowToTool",
        "name": "ProcureSaathi Platform"
      }
    };
    injectStructuredData(howToSchema, 'howto-schema');
  }, []);

  const handleLiveStockClick = () => {
    setShowLiveStock(true);
  };

  const handleLiveRequirementsClick = () => {
    setShowLiveRequirements(true);
  };

  const handleLogisticsRequirementsClick = () => {
    setShowLogisticsRequirements(true);
  };

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/browse?category=${encodeURIComponent(categoryName)}`);
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

  const logisticsSteps = [
    { icon: Truck, title: 'Register Assets', description: 'Add your vehicles and warehouses to the platform' },
    { icon: Route, title: 'Receive Requests', description: 'Get booking requests from verified businesses' },
    { icon: FileText, title: 'Provide Quotes', description: 'Submit competitive quotes for transport/storage' },
    { icon: ClipboardCheck, title: 'Complete Service', description: 'Fulfill orders and grow your business' },
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

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Info Bar */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Important:</span> ProcureSaathi - The future of B2B procurement. 
            <span className="hidden sm:inline"> Search 23+ product categories, browse live supplier stock, and get competitive sealed bids from verified partners.</span>
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-12 sm:h-16 md:h-20 w-auto object-contain"
              width={80}
              height={80}
              loading="eager"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('about')}>About Us</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/buyer')}>Buyer</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/seller')}>Seller</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/private-label')}>Private Label</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/blogs')}>Blogs</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollToSection('contact')}>Contact</Button>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Join Now</Button>
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/login')}>
                    Login
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('about')}>
                    About Us
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/buyer')}>
                    Buyer
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/seller')}>
                    Seller
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/private-label')}>
                    Private Label
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/categories')}>
                    Categories
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => handleMobileNavigation('/blogs')}>
                    Blogs
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => scrollToSection('contact')}>
                    Contact
                  </Button>
                  <div className="border-t pt-4 mt-4">
                    <Button className="w-full" onClick={() => handleMobileNavigation('/signup?role=buyer')}>
                      Join as Buyer
                    </Button>
                    <Button variant="outline" className="w-full mt-2" onClick={() => handleMobileNavigation('/signup?role=supplier')}>
                      Join as Supplier
                    </Button>
                    <Button variant="outline" className="w-full mt-2" onClick={() => handleMobileNavigation('/signup?role=logistics_partner')}>
                      Join as Logistics Partner
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted/30 via-background to-muted/50 py-8 sm:py-12 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight px-2">
              India's #1 <span className="text-primary">B2B Sourcing</span> & <span className="text-warning">Procurement Platform</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-3xl mx-auto px-2">
              Need Private Label, Custom Manufacturing, or Bulk Supply? Let our AI + Team find the right Indian suppliers for you
            </p>

            {/* Hero Trust Badges */}
            <div className="mb-6">
              <HeroTrustBadges />
            </div>

            {/* AI RFQ Generator CTA - Prominent */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 px-2">
              <Button 
                size="lg" 
                className="h-14 sm:h-16 text-base sm:text-lg px-8 sm:px-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate('/post-rfq')}
              >
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Start Sourcing
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 sm:h-16 text-base sm:text-lg px-8 sm:px-10"
                onClick={() => window.location.href = 'mailto:sales@procuresaathi.com'}
              >
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Talk to Our Team
              </Button>
            </div>
            <div className="mt-4 sm:hidden">
              <DemoRequestForm />
            </div>
            <div className="hidden sm:block mt-4">
              <DemoRequestForm />
            </div>
            
            {/* Quick Access - Explore Platform */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border/50 px-2">
              <p className="text-sm text-muted-foreground mb-4">Explore what's happening on the platform</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
                <button 
                  onClick={() => navigate('/categories')}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">Browse Categories</span>
                    <span className="text-xs text-muted-foreground">23+ product types</span>
                  </div>
                </button>
                <button 
                  onClick={handleLiveStockClick}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-success hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                    <Package className="h-5 w-5 text-success" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">View Live Stock</span>
                    <span className="text-xs text-muted-foreground">Supplier inventory</span>
                  </div>
                </button>
                <button 
                  onClick={handleLiveRequirementsClick}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-warning hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                    <FileText className="h-5 w-5 text-warning" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">Buyer Requirements</span>
                    <span className="text-xs text-muted-foreground">Active RFQs</span>
                  </div>
                </button>
                <button 
                  onClick={handleLogisticsRequirementsClick}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">Logistics Requests</span>
                    <span className="text-xs text-muted-foreground">Transport & Storage</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Early Adopter Banner */}
      <EarlyAdopterBanner />

      {/* CTA Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {/* AI RFQ CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Post AI-Powered RFQ
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Let AI help you create detailed requirements and find the best suppliers instantly.
                </p>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate('/post-rfq')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Post AI RFQ
                </Button>
              </CardContent>
            </Card>

            {/* Buyer CTA */}
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-12 w-12 text-success mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Sourcing Products? It's FREE!
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Post requirements and get competitive bids from verified suppliers worldwide.
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => navigate('/signup?role=buyer')}
                >
                  Join as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Supplier CTA */}
            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-warning mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Manufacturer? Connect Now!
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  List your company and start connecting with buyers. Multiple subscription tiers.
                </p>
                <Button 
                  size="lg"
                  className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  Join as Supplier
                </Button>
              </CardContent>
            </Card>

            {/* Logistics CTA */}
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Need Transportation?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Find verified trucks, trailers & warehousing services across India.
                </p>
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/book-truck')}
                >
                  Book a Truck
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
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Since 2021, ProcureSaathi has revolutionized the B2B sourcing sector as India's first-ever 
                Reverse Marketplace Platform offering direct procurement services to businesses worldwide. 
                Our innovative sealed bidding system ensures fair competition while maintaining complete transparency.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-3">For Buyers & Procurement Teams</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Whether you're sourcing raw materials, industrial equipment, chemicals, textiles, or electronics, 
                    ProcureSaathi connects you with verified Indian manufacturers and suppliers. Post your requirements 
                    once and receive competitive sealed bids from multiple suppliers. Our AI-powered matching ensures 
                    you find the right supplier for your specific needs, whether it's private label manufacturing, 
                    custom OEM production, or bulk wholesale purchasing. Save 15-30% on procurement costs through 
                    transparent bidding while reducing sourcing time from weeks to hours.
                  </p>
                </div>
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-3">For Suppliers & Manufacturers</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Expand your business reach across India and globally with ProcureSaathi's B2B marketplace. 
                    Access genuine buyer requirements in your product category, submit competitive bids, and win 
                    new contracts. Our free CRM and GST invoice generator tools help you manage leads, track orders, 
                    and streamline operations. Join 1000+ verified suppliers already growing their business on our 
                    platform. From steel and chemicals to textiles and electronics, suppliers across all 23+ categories 
                    are finding success through our transparent procurement ecosystem.
                  </p>
                </div>
              </div>
              <div className="mt-8 bg-muted/50 p-6 rounded-lg">
                <h4 className="font-semibold text-foreground mb-3">Complete B2B Procurement Ecosystem</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  ProcureSaathi offers a complete end-to-end B2B procurement solution covering sourcing, bidding, 
                  supplier verification, logistics booking, and payment tracking. Our integrated logistics network 
                  connects you with verified truck operators and warehouse partners across India, ensuring seamless 
                  delivery of your orders. With features like real-time shipment tracking, automated invoicing, 
                  GST compliance tools, and dedicated support, we're building India's most trusted B2B sourcing 
                  platform for the modern digital economy.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Why Choose Us Section */}
      <Suspense fallback={<SectionFallback />}>
        <WhyChooseUs />
      </Suspense>

      {/* Stats Section */}
      <Suspense fallback={<SectionFallback />}>
        <StatsSection />
      </Suspense>


      {/* Export Certifications Section */}
      <Suspense fallback={<SectionFallback />}>
        <ExportCertifications />
      </Suspense>

      {/* Testimonials Section */}
      <Suspense fallback={<SectionFallback />}>
        <Testimonials />
      </Suspense>

      {/* FAQ Section */}
      <LazyFAQ />

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
            <a 
              href="mailto:sales@procuresaathi.com"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
            >
              <Mail className="h-4 w-4" />
              Send us an Email
            </a>
            <p className="text-sm text-muted-foreground mt-3">
              <a href="mailto:sales@procuresaathi.com" className="text-primary hover:underline">
                sales@procuresaathi.com
              </a>
            </p>
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
          <Button size="lg" onClick={() => navigate('/signup')}>
            Start Free Trial
          </Button>
        </div>
      </section>
      </main>

      {/* Lead Generation Components */}
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
      <Suspense fallback={null}>
        <LiveActivityFeed />
      </Suspense>
      
      {/* Sticky Signup Banner */}
      <StickySignupBanner />


      {/* Footer */}
      <footer className="border-t bg-card py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
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
                <button onClick={() => navigate('/categories')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Categories
                </button>
                <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  FAQ
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Contact Us
                </button>
              </div>
            </div>

            {/* For Business */}
            <div>
              <h4 className="font-semibold mb-4">For Business</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => navigate('/signup?role=buyer')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Join as Buyer
                </button>
                <button onClick={() => navigate('/signup?role=supplier')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Join as Supplier
                </button>
                <button onClick={() => navigate('/signup?role=logistics_partner')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Logistics Partner
                </button>
                <button onClick={() => navigate('/book-truck')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Book a Truck
                </button>
                <button onClick={() => navigate('/blogs')} className="text-sm text-muted-foreground hover:text-primary text-left">
                  Blogs
                </button>
              </div>
            </div>

            {/* International Markets */}
            <div>
              <h4 className="font-semibold mb-4">International Markets</h4>
              <div className="flex flex-col gap-2">
                <a href="/source/usa" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🇺🇸</span> Source from India to USA
                </a>
                <a href="/source/uae" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🇦🇪</span> India to UAE Trade
                </a>
                <a href="/source/uk" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🇬🇧</span> Indian Suppliers for UK
                </a>
                <a href="/source/germany" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🇩🇪</span> India to Germany Trade
                </a>
                <a href="/source/australia" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🇦🇺</span> Source from India to Australia
                </a>
                <a href="/source/africa" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2">
                  <span>🌍</span> Export to Africa
                </a>
              </div>
            </div>
            
            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get weekly B2B sourcing tips & market insights
              </p>
              <NewsletterSignup source="footer" />
              <a href="mailto:sales@procuresaathi.com" className="text-sm text-primary hover:underline block mt-4">
                sales@procuresaathi.com
              </a>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ProcureSaathi Solutions Pvt Ltd. All rights reserved.</p>
            <p className="mt-2">India's #1 B2B Sourcing & Procurement Platform</p>
          </div>
        </div>
      </footer>
      {/* Live Stock Dialog - Only loaded when needed */}
      {showLiveStock && (
        <Suspense fallback={null}>
          <LiveSupplierStock 
            open={showLiveStock} 
            onOpenChange={setShowLiveStock}
            userId={user?.id}
          />
        </Suspense>
      )}

      {/* Live Requirements Dialog - Only loaded when needed */}
      {showLiveRequirements && (
        <Suspense fallback={null}>
          <BrowseRequirements 
            open={showLiveRequirements} 
            onOpenChange={setShowLiveRequirements}
            userId={user?.id}
          />
        </Suspense>
      )}

      {/* Live Logistics Requirements Dialog - Only loaded when needed */}
      {showLogisticsRequirements && (
        <Suspense fallback={null}>
          <BrowseLogisticsPublic 
            open={showLogisticsRequirements} 
            onOpenChange={setShowLogisticsRequirements}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
