import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, FileText, CheckCircle, CheckCircle2, Send, Building2,
  Package, Trophy, Users, Shield, Target, Eye, Search,
  Truck, Route, ClipboardCheck, Receipt, BadgeCheck,
  Menu, X, Sparkles, TrendingUp
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
import { AILinkingSection } from '@/components/seo';
import { LiveBuyerDemandSection } from '@/components/landing/LiveBuyerDemandSection';


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

// Skeleton loading fallbacks with proper height to prevent layout shift
const SectionFallback = ({ minHeight = "400px" }: { minHeight?: string }) => (
  <div className="py-16 bg-background animate-pulse" style={{ minHeight }}>
    <div className="container mx-auto px-4">
      <div className="h-8 w-64 bg-muted rounded mx-auto mb-4" />
      <div className="h-4 w-96 bg-muted/60 rounded mx-auto mb-8 max-w-full" />
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted/40 rounded-lg" />
        ))}
      </div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="py-12 bg-muted/30 animate-pulse">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <div className="h-10 w-20 bg-muted rounded mx-auto mb-2" />
            <div className="h-4 w-24 bg-muted/60 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TestimonialsSkeleton = () => (
  <div className="py-16 bg-background animate-pulse" style={{ minHeight: "350px" }}>
    <div className="container mx-auto px-4">
      <div className="h-8 w-48 bg-muted rounded mx-auto mb-8" />
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/30 rounded-lg p-6">
            <div className="h-4 w-full bg-muted/50 rounded mb-3" />
            <div className="h-4 w-3/4 bg-muted/50 rounded mb-6" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="h-4 w-24 bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLiveStock, setShowLiveStock] = useState(false);
  const [showLiveRequirements, setShowLiveRequirements] = useState(false);
  const [showLogisticsRequirements, setShowLogisticsRequirements] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SEO setup with social sharing meta tags - AEO/GEO optimized
  useSEO({
    title: "ProcureSaathi | AI-Powered B2B Procurement Platform for Smart Sourcing",
    description: "ProcureSaathi is an AI-powered B2B procurement and sourcing platform that helps businesses post RFQs, compare verified supplier bids, and manage domestic and export–import sourcing with transparency and quality assurance.",
    canonical: "https://procuresaathi.com/",
    keywords: "B2B procurement platform India, AI RFQ software, digital sourcing platform, online bidding platform for businesses, supplier discovery platform, transparent bidding, verified suppliers, domestic sourcing, export import sourcing",
    ogImage: "https://procuresaathi.com/og-early-adopter.png",
    ogType: "website",
    twitterCard: "summary_large_image"
  });

  // Inject Organization, HowTo, and SoftwareApplication schemas
  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');
    
    // SoftwareApplication schema for AI tool recognition
    const softwareAppSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "ProcureSaathi",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "ProcureSaathi is an AI-powered B2B procurement and sourcing software that helps enterprises and MSMEs post RFQs, compare bids, and manage domestic and export–import sourcing with verified suppliers.",
      "url": "https://www.procuresaathi.com",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "description": "Free for buyers"
      },
      "featureList": [
        "AI-Powered RFQ Generation",
        "Sealed Competitive Bidding",
        "Verified Supplier Network",
        "Managed Procurement",
        "Export-Import Support",
        "Logistics Integration"
      ]
    };
    injectStructuredData(softwareAppSchema, 'software-app-schema');
    
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
          "name": "Accept Best Offer",
          "text": "Review and accept the top-ranked offer from ProcureSaathi's verified network"
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
    { icon: Mail, title: 'Receive Offers', description: 'Get competitive offers from ProcureSaathi\'s verified network' },
    { icon: CheckCircle, title: 'Accept Best Offer', description: 'Review and accept the top-ranked offer' },
    { icon: Users, title: 'Complete Transaction', description: 'Finalize with ProcureSaathi managing end-to-end' },
  ];

  const supplierSteps = [
    { icon: Search, title: 'Browse Opportunities', description: 'View active requirements in your category' },
    { icon: Send, title: 'Submit Offer', description: 'Place your competitive offer to ProcureSaathi' },
    { icon: Trophy, title: 'Get Assigned', description: 'Get notified when you\'re selected as fulfillment partner' },
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
            <Button variant="ghost" size="sm" className="font-medium text-primary bg-primary/5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>About Us</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/buyer')}>Buyer</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/seller')}>Seller</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/private-label')}>Private Label</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/blogs')}>Blogs</Button>
            <Button variant="ghost" size="sm" className="font-medium hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => navigate('/contact')}>Contact</Button>
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
                  <Button variant="ghost" className="justify-start text-base text-primary bg-primary/5" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}>
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
                  <Button variant="ghost" className="justify-start text-base" onClick={() => handleMobileNavigation('/contact')}>
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
              <span className="text-primary">AI-Powered B2B Procurement</span>
              <br className="hidden sm:block" />
              <span className="text-foreground"> Platform for Verified Sourcing</span>
            </h1>
            
            {/* AI Intent Line - Critical for demand-led messaging */}
            <p className="text-sm sm:text-base font-medium text-primary mb-4 animate-slide-up delay-50">
              AI tracks live buyer intent and converts it into RFQs automatically.
            </p>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-2 animate-slide-up delay-100">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
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
                AI Start Sourcing Free
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

      {/* Live Buyer Demand Detected by AI */}
      <LiveBuyerDemandSection />

      {/* Early Adopter Banner */}
      <EarlyAdopterBanner />

      {/* CTA Section */}
      <section className="py-10 sm:py-12 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Get Started Today</h2>
            <p className="text-muted-foreground">Choose your path to growth</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {/* AI RFQ CTA */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display font-bold mb-2 text-sm">
                  Post AI-Powered RFQ
                </h2>
                <p className="text-muted-foreground mb-4 text-xs">
                  Let AI help you create detailed requirements and find the best suppliers instantly.
                </p>
                <Button 
                  className="w-full text-sm h-9"
                  onClick={() => navigate('/post-rfq')}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Post AI RFQ
                </Button>
              </CardContent>
            </Card>

            {/* Buyer CTA */}
            <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-5 w-5 text-success" />
                </div>
                <h2 className="font-display font-bold mb-2 text-sm">
                  Sourcing Products?
                </h2>
                <p className="text-muted-foreground mb-4 text-xs">
                  Post requirements and get competitive bids from verified suppliers. <span className="font-semibold text-success">It's FREE!</span>
                </p>
                <Button 
                  className="w-full bg-success text-success-foreground hover:bg-success/90 text-sm h-9"
                  onClick={() => navigate('/signup?role=buyer')}
                >
                  Join as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Supplier CTA - Demand-first messaging */}
            <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <h2 className="font-display font-bold mb-2 text-sm">
                  AI Detected Demand
                </h2>
                <p className="text-muted-foreground mb-4 text-xs">
                  AI has detected demand in your category. List your products to receive buyer inquiries.
                </p>
                <Button 
                  className="w-full bg-warning text-warning-foreground hover:bg-warning/90 text-sm h-9"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  List Products Now
                </Button>
              </CardContent>
            </Card>

            {/* Logistics CTA */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display font-bold mb-2 text-sm">
                  Need Transport?
                </h2>
                <p className="text-muted-foreground mb-4 text-xs">
                  Find verified trucks, trailers & warehousing services across India.
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-primary/30 hover:bg-primary/5 text-sm h-9"
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
      <section id="about" className="py-12 sm:py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-3">About ProcureSaathi</h2>
              <p className="text-lg text-muted-foreground">AI-Powered B2B Procurement Platform Based in India</p>
            </div>
            
            {/* GEO-Optimized Brand Positioning Paragraph */}
            <div className="bg-card p-6 rounded-xl border border-primary/20 mb-8">
              <p className="text-foreground text-base md:text-lg leading-relaxed text-center">
                <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform based in India. 
                It helps buyers post requirements using AI RFQs, enables transparent bidding among verified suppliers, 
                supports domestic and export–import trade, and provides free CRM, business leads, and logistics support 
                to MSMEs, manufacturers, traders, and enterprises.
              </p>
            </div>
            
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-semibold">Our Mission</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    To revolutionize B2B procurement by creating a transparent, AI-powered platform connecting verified buyers and suppliers across India and global markets.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-display font-semibold">Our Vision</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    To become India's most trusted B2B sourcing platform, enabling businesses to source remotely with confidence through AI-powered RFQs and transparent bidding.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {stats.map((stat, index) => (
                <div key={stat.label} className="stat-card p-4" style={{ animationDelay: `${index * 100}ms` }}>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Core Values */}
            <h3 className="text-2xl font-display font-semibold text-center mb-6">Our Core Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {coreValues.map((value, index) => (
                <Card key={value.title} className="text-center border-border/50">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <value.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-display font-semibold text-base mb-1">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Buyer & Supplier Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card p-5 rounded-xl border border-border/50">
                <h4 className="font-display font-semibold text-lg text-foreground mb-2">For Buyers & Procurement Teams</h4>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Post requirements once, receive competitive sealed bids from verified suppliers. Save 15-30% with AI-powered matching.
                </p>
              </div>
              <div className="bg-card p-5 rounded-xl border border-border/50">
                <h4 className="font-display font-semibold text-lg text-foreground mb-2">For Suppliers & Manufacturers</h4>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Access genuine buyer requirements, submit competitive bids, and win contracts. Join 1000+ verified suppliers.
                </p>
              </div>
            </div>

            {/* Ecosystem */}
            <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-6 rounded-xl border border-border/30 text-center">
              <h4 className="font-display font-semibold text-lg text-foreground mb-3">Complete B2B Procurement Ecosystem</h4>
              <p className="text-muted-foreground text-base leading-relaxed max-w-3xl mx-auto">
                End-to-end solution covering sourcing, bidding, supplier verification, logistics booking, and payment tracking with real-time shipment tracking, automated invoicing, and GST compliance tools.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* AI-Powered Features Section */}
      <section className="py-10 sm:py-12 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI-POWERED PLATFORM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              Intelligent Procurement with <span className="text-primary">AI Technology</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI engine analyzes your requirements, matches you with the right suppliers, and helps you make data-driven decisions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* AI Supplier Matching */}
            <Card className="bg-card border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold mb-2">Smart Supplier Matching</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  AI analyzes your specifications to find the most suitable verified suppliers.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    1000+ verified suppliers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    Real-time matching
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI RFQ Generation */}
            <Card className="bg-card border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold mb-2">AI RFQ Generation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Describe your needs naturally. AI creates professional RFQs that attract quality bids.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    Auto-fills specifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    Industry templates
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI Price Intelligence */}
            <Card className="bg-card border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold mb-2">Price Intelligence</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get AI-powered price confidence scores and market insights for competitive rates.
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    Market benchmarking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    Price trend analysis
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <Button 
              size="lg" 
              className="h-12 px-8 font-semibold shadow-md gradient-primary"
              onClick={() => navigate('/post-rfq')}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Try AI Sourcing Free
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <Suspense fallback={<SectionFallback minHeight="500px" />}>
        <WhyChooseUs />
      </Suspense>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      {/* Export Certifications Section */}
      <Suspense fallback={<SectionFallback minHeight="300px" />}>
        <ExportCertifications />
      </Suspense>

      {/* Testimonials Section */}
      <Suspense fallback={<TestimonialsSkeleton />}>
        <Testimonials />
      </Suspense>

      {/* Illustrative Procurement Scenarios Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              How Businesses Procure Smarter with ProcureSaathi
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Illustrative procurement scenarios showing typical workflows on AI-powered sourcing.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Global Steel Scenario */}
            <Card 
              className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/case-study-global-steel-procurement')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    Steel & Metals
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    Illustrative Example
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  Global Steel Procurement Scenario
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How international buyers typically source industrial steel using transparent bidding and verified Indian suppliers.
                </p>
                <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Scenario <span className="text-lg">→</span>
                </span>
              </CardContent>
            </Card>

            {/* Middle East Food Scenario */}
            <Card 
              className="border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate('/case-study-middle-east-pulses-spices-import')}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded">
                    Food Commodities
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    Illustrative Example
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  Middle East Food Import Scenario
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  How food importers typically use managed export procurement for sourcing from India.
                </p>
                <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Scenario <span className="text-lg">→</span>
                </span>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/customer-stories')}
              className="gap-2"
            >
              Explore More Scenarios <span>→</span>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <LazyFAQ />

      {/* AI Linking Section - AEO/GEO Optimization */}
      <AILinkingSection 
        title="Explore Our Platform"
        links={[
          { title: "How to Post RFQ Online", url: "/how-to-post-rfq-online", description: "Step-by-step RFQ guide", emoji: "📝" },
          { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide", emoji: "🔍" },
          { title: "Enterprise Procurement", url: "/enterprise-procurement-guide", description: "For large organizations", emoji: "🏢" },
          { title: "Export-Import Guide", url: "/export-import-sourcing-guide", description: "International sourcing", emoji: "🌍" }
        ]}
      />

      {/* Contact Section */}
      <section id="contact" className="py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Contact Us</h2>
            <p className="text-muted-foreground">Get in touch with our team</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Address */}
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-1">Address</h4>
                <p className="text-xs text-muted-foreground">
                  PROCURESAATHI SOLUTIONS PVT LTD<br />
                  Sector-31, Haryana - 121003
                </p>
              </CardContent>
            </Card>
            
            {/* Email */}
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-1">Email</h4>
                <a href="mailto:sales@procuresaathi.com" className="text-xs text-primary hover:underline font-medium">
                  sales@procuresaathi.com
                </a>
              </CardContent>
            </Card>
            
            {/* GSTIN */}
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-1">GSTIN</h4>
                <p className="text-xs text-muted-foreground font-mono">06AAMCP4662L1ZW</p>
              </CardContent>
            </Card>
            
            {/* Business Hours */}
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display font-semibold text-sm mb-1">Business Hours</h4>
                <p className="text-xs text-muted-foreground">
                  Mon - Sat, 9AM - 6PM IST
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* CTA */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-3">Have questions? We'd love to hear from you!</p>
            <a 
              href="mailto:sales@procuresaathi.com"
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
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
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-muted/50 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
            Ready to Transform Your Business?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join ProcureSaathi today and experience the future of B2B procurement
          </p>
          <Button 
            size="lg" 
            className="h-12 px-8 font-semibold shadow-md gradient-primary"
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
      <footer className="border-t border-border/50 bg-card py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8">
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
                <button onClick={() => scrollToSection('how-it-works')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  How It Works
                </button>
                <button onClick={() => navigate('/categories')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  Categories
                </button>
                <button onClick={() => scrollToSection('faq')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
                  FAQ
                </button>
                <button onClick={() => navigate('/contact')} className="text-sm text-muted-foreground hover:text-primary text-left transition-colors">
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
