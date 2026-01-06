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
import heroBgProcurement from '@/assets/hero-bg-procurement.jpg';
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
const ReferralPromoSection = lazy(() => import('@/components/landing/ReferralPromoSection').then(m => ({ default: m.ReferralPromoSection })));
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
    title: "ProcureSaathi | India's #1 B2B Sourcing Platform - Get 3 Quotes in 48hrs",
    description: "Stop chasing suppliers! Post 1 RFQ, get 3+ competitive sealed bids from 1000+ verified Indian manufacturers. Free for buyers. Join 5000+ businesses saving 30%.",
    canonical: "https://procuresaathi.com/",
    keywords: "B2B marketplace India, B2B sourcing platform, procurement platform, verified suppliers India, wholesale suppliers, bulk buying, industrial supplies, manufacturing, RFQ platform, sealed bidding",
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
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-2.5">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            <span className="font-semibold text-primary">🚀 New:</span> ProcureSaathi - The future of B2B procurement. 
            <span className="hidden sm:inline"> Search 23+ product categories, browse live supplier stock, and get competitive sealed bids.</span>
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border/50 sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-14 sm:h-16 md:h-20 w-auto object-contain transition-transform hover:scale-105"
              width={80}
              height={80}
              loading="eager"
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => scrollToSection('about')}>About Us</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/buyer')}>Buyer</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/seller')}>Seller</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/private-label')}>Private Label</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/blogs')}>Blogs</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => scrollToSection('contact')}>Contact</Button>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="font-medium" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button size="sm" className="font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" onClick={() => navigate('/signup')}>
              Join Now
            </Button>
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[380px] bg-card/95 backdrop-blur-lg">
                <nav className="flex flex-col gap-3 mt-8">
                  <Button variant="ghost" className="justify-start text-base font-medium" onClick={() => handleMobileNavigation('/login')}>
                    Login
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => scrollToSection('about')}>
                    About Us
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/buyer')}>
                    Buyer
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/seller')}>
                    Seller
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/private-label')}>
                    Private Label
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/categories')}>
                    Categories
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/blogs')}>
                    Blogs
                  </Button>
                  <Button variant="ghost" className="justify-start text-base" onClick={() => scrollToSection('contact')}>
                    Contact
                  </Button>
                  <div className="border-t border-border/50 pt-5 mt-4 space-y-3">
                    <Button className="w-full font-semibold" onClick={() => handleMobileNavigation('/signup?role=buyer')}>
                      Join as Buyer
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleMobileNavigation('/signup?role=supplier')}>
                      Join as Supplier
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handleMobileNavigation('/signup?role=logistics_partner')}>
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
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgProcurement})` }}
        />
        {/* Refined overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/90" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <span className="text-primary text-sm font-medium">🇮🇳 India's #1 B2B Platform</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-4 sm:mb-6 leading-tight px-2 animate-slide-up">
              <span className="text-primary">B2B Sourcing</span> & <span className="text-warning">Procurement</span>
              <br className="hidden sm:block" />
              <span className="text-foreground"> Made Simple</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-2 animate-slide-up delay-100">
              Need Private Label, Custom Manufacturing, or Bulk Supply? 
              <span className="text-foreground font-medium"> Let our AI + Team find the right Indian suppliers for you.</span>
            </p>

            {/* Hero Trust Badges */}
            <div className="mb-8 animate-slide-up delay-200">
              <HeroTrustBadges />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 px-2 animate-slide-up delay-300">
              <Button 
                size="lg" 
                className="h-14 sm:h-16 text-base sm:text-lg px-8 sm:px-12 font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
                onClick={() => navigate('/post-rfq')}
              >
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Start Sourcing Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 sm:h-16 text-base sm:text-lg px-8 sm:px-12 font-medium bg-card/80 backdrop-blur-sm hover:bg-card border-border/80 hover:border-primary/50 transition-all"
                onClick={() => window.location.href = 'mailto:sales@procuresaathi.com'}
              >
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                Talk to Our Team
              </Button>
            </div>
            
            <div className="mt-4 animate-slide-up delay-400">
              <DemoRequestForm />
            </div>
            
            {/* Quick Access - Explore Platform */}
            <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-border/30 px-2">
              <p className="text-sm font-medium text-muted-foreground mb-6">Explore what's happening on the platform</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 max-w-4xl mx-auto">
                <button 
                  onClick={() => navigate('/categories')}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-large transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">Browse Categories</span>
                    <span className="text-xs text-muted-foreground">23+ product types</span>
                  </div>
                </button>
                <button 
                  onClick={handleLiveStockClick}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-success/50 hover:shadow-large transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 group-hover:scale-110 transition-all duration-300">
                    <Package className="h-6 w-6 text-success" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">View Live Stock</span>
                    <span className="text-xs text-muted-foreground">Supplier inventory</span>
                  </div>
                </button>
                <button 
                  onClick={handleLiveRequirementsClick}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-warning/50 hover:shadow-large transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 group-hover:scale-110 transition-all duration-300">
                    <FileText className="h-6 w-6 text-warning" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground block">Buyer Requirements</span>
                    <span className="text-xs text-muted-foreground">Active RFQs</span>
                  </div>
                </button>
                <button 
                  onClick={handleLogisticsRequirementsClick}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-large transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Truck className="h-6 w-6 text-primary" />
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
      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">Get Started Today</h2>
            <p className="section-subtitle">Choose your path to growth</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 max-w-7xl mx-auto">
            {/* AI RFQ CTA */}
            <Card className="group bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6 text-center relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-foreground">
                  Post AI-Powered RFQ
                </h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Let AI help you create detailed requirements and find the best suppliers instantly.
                </p>
                <Button 
                  size="lg" 
                  className="w-full font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate('/post-rfq')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Post AI RFQ
                </Button>
              </CardContent>
            </Card>

            {/* Buyer CTA */}
            <Card className="group bg-gradient-to-br from-success/5 via-success/10 to-success/5 border-success/20 hover:border-success/40 hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6 text-center relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="h-7 w-7 text-success" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-foreground">
                  Sourcing Products?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Post requirements and get competitive bids from verified suppliers. <span className="font-semibold text-success">It's FREE!</span>
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-success text-success-foreground hover:bg-success/90 font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate('/signup?role=buyer')}
                >
                  Join as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Supplier CTA */}
            <Card className="group bg-gradient-to-br from-warning/5 via-warning/10 to-warning/5 border-warning/20 hover:border-warning/40 hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6 text-center relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-warning/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-7 w-7 text-warning" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-foreground">
                  Manufacturer?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  List your company and start connecting with buyers across India and globally.
                </p>
                <Button 
                  size="lg"
                  className="w-full bg-warning text-warning-foreground hover:bg-warning/90 font-semibold shadow-md hover:shadow-lg transition-all"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  Join as Supplier
                </Button>
              </CardContent>
            </Card>

            {/* Logistics CTA */}
            <Card className="group bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <CardContent className="p-6 text-center relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-foreground">
                  Need Transport?
                </h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Find verified trucks, trailers & warehousing services across India.
                </p>
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full font-semibold border-primary/30 hover:bg-primary/5 hover:border-primary transition-all"
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
      <section id="about" className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title font-display">About ProcureSaathi</h2>
              <p className="section-subtitle">Your Trusted B2B Procurement Partner Since 2021</p>
            </div>
            
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-6 mb-14">
              <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-7">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-semibold">Our Mission</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To revolutionize B2B procurement by creating a transparent, efficient, and secure platform 
                    that connects verified buyers and suppliers across India and globally.
                  </p>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-7">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-semibold">Our Vision</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To become India's most trusted B2B sourcing platform, enabling businesses to source 
                    remotely with confidence and complete transparency.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-14">
              {stats.map((stat, index) => (
                <div key={stat.label} className="stat-card group hover:shadow-large transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Core Values */}
            <h3 className="text-2xl font-display font-semibold text-center mb-8">Our Core Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-14">
              {coreValues.map((value, index) => (
                <Card key={value.title} className="group text-center hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
                  <CardContent className="p-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-display font-semibold text-sm mb-1.5">{value.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Company Description */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-primary text-sm font-semibold">#SourceRemotely - The New Reality</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
                Since 2021, ProcureSaathi has revolutionized the B2B sourcing sector as India's first-ever 
                Reverse Marketplace Platform offering direct procurement services to businesses worldwide. 
                Our innovative sealed bidding system ensures fair competition while maintaining complete transparency.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left mt-10">
                <div className="bg-card p-7 rounded-2xl border border-border/50 hover:shadow-large transition-all duration-300">
                  <h4 className="font-display font-semibold text-foreground mb-4 text-lg">For Buyers & Procurement Teams</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Whether you're sourcing raw materials, industrial equipment, chemicals, textiles, or electronics, 
                    ProcureSaathi connects you with verified Indian manufacturers and suppliers. Post your requirements 
                    once and receive competitive sealed bids from multiple suppliers. Our AI-powered matching ensures 
                    you find the right supplier for your specific needs, whether it's private label manufacturing, 
                    custom OEM production, or bulk wholesale purchasing. Save 15-30% on procurement costs through 
                    transparent bidding while reducing sourcing time from weeks to hours.
                  </p>
                </div>
                <div className="bg-card p-7 rounded-2xl border border-border/50 hover:shadow-large transition-all duration-300">
                  <h4 className="font-display font-semibold text-foreground mb-4 text-lg">For Suppliers & Manufacturers</h4>
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
              <div className="mt-8 bg-gradient-to-br from-muted/50 to-muted/30 p-7 rounded-2xl border border-border/30">
                <h4 className="font-display font-semibold text-foreground mb-4 text-lg">Complete B2B Procurement Ecosystem</h4>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-4xl mx-auto">
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
      <section id="contact" className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">Contact Us</h2>
            <p className="section-subtitle">Get in touch with our team</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {/* Address */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-display font-semibold mb-2">Address</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PROCURESAATHI SOLUTIONS PRIVATE LIMITED<br />
                  Metro Pillar Number 564, 14/3 Mathura Road, Sector-31, Haryana - 121003
                </p>
              </CardContent>
            </Card>
            
            {/* Email */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-display font-semibold mb-2">Email</h4>
                <a href="mailto:sales@procuresaathi.com" className="text-sm text-primary hover:underline font-medium">
                  sales@procuresaathi.com
                </a>
              </CardContent>
            </Card>
            
            {/* GSTIN */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-display font-semibold mb-2">GSTIN</h4>
                <p className="text-sm text-muted-foreground font-mono">06AAMCP4662L1ZW</p>
              </CardContent>
            </Card>
            
            {/* Business Hours */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h4 className="font-display font-semibold mb-2">Business Hours</h4>
                <p className="text-sm text-muted-foreground">
                  Monday - Saturday<br />
                  9:00 AM - 6:00 PM IST
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-14">
            <p className="text-muted-foreground mb-5">Have questions? We'd love to hear from you!</p>
            <a 
              href="mailto:sales@procuresaathi.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Mail className="h-4 w-4" />
              Send us an Email
            </a>
          </div>
        </div>
      </section>

      {/* Referral Promo Section */}
      <Suspense fallback={<SectionFallback />}>
        <ReferralPromoSection />
      </Suspense>

      {/* Final CTA Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 via-muted/50 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="section-title font-display mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join ProcureSaathi today and experience the future of B2B procurement
          </p>
          <Button 
            size="lg" 
            className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
            onClick={() => navigate('/signup')}
          >
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
      <footer className="border-t border-border/50 bg-card py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-10">
            {/* Company Info */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-display font-bold text-sm mb-4 text-foreground">PROCURESAATHI</h4>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                Metro Pillar Number 564, 14/3 Mathura Road, Sector-31, Haryana - 121003
              </p>
              <p className="text-sm text-muted-foreground font-mono">GSTIN: 06AAMCP4662L1ZW</p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => scrollToSection('about')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  About Us
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  How It Works
                </button>
                <button onClick={() => navigate('/categories')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Categories
                </button>
                <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  FAQ
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Contact Us
                </button>
              </div>
            </div>

            {/* For Business */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">For Business</h4>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate('/signup?role=buyer')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Join as Buyer
                </button>
                <button onClick={() => navigate('/signup?role=supplier')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Join as Supplier
                </button>
                <button onClick={() => navigate('/signup?role=logistics_partner')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Logistics Partner
                </button>
                <button onClick={() => navigate('/book-truck')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Book a Truck
                </button>
                <button onClick={() => navigate('/blogs')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Blogs
                </button>
              </div>
            </div>

            {/* International Markets */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">International Markets</h4>
              <div className="flex flex-col gap-2.5">
                <a href="/source/usa" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2 transition-colors">
                  <span>🇺🇸</span> Source from India to USA
                </a>
                <a href="/source/uae" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2 transition-colors">
                  <span>🇦🇪</span> India to UAE Trade
                </a>
                <a href="/source/uk" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2 transition-colors">
                  <span>🇬🇧</span> Indian Suppliers for UK
                </a>
                <a href="/source/germany" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2 transition-colors">
                  <span>🇩🇪</span> India to Germany Trade
                </a>
                <a href="/source/australia" className="text-sm text-muted-foreground hover:text-primary text-left flex items-center gap-2 transition-colors">
                  <span>🇦🇺</span> Source from India to Australia
                </a>
              </div>
            </div>
            
            {/* Newsletter */}
            <div>
              <h4 className="font-display font-semibold text-sm mb-4">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get weekly B2B sourcing tips & market insights
              </p>
              <NewsletterSignup source="footer" />
              <a href="mailto:sales@procuresaathi.com" className="text-sm text-primary hover:underline block mt-4 font-medium">
                sales@procuresaathi.com
              </a>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 text-center">
            <p className="text-sm text-muted-foreground">&copy; 2024 ProcureSaathi Solutions Pvt Ltd. All rights reserved.</p>
            <p className="mt-2 text-sm font-medium text-primary">India's #1 B2B Sourcing & Procurement Platform</p>
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
