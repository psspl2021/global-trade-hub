import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, FileText, CheckCircle, Send, Building2,
  Package, Users, Shield, Target,
  Truck, Menu, Sparkles, TrendingUp, Globe, Layers, ArrowRight
} from 'lucide-react';
const BrowseLogisticsPublic = lazy(() => import('@/components/logistics/BrowseLogisticsPublic'));
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import heroBgProcurement from '@/assets/hero-bg-procurement.jpg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSEO, injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';
import { StickySignupBanner } from '@/components/StickySignupBanner';
import { PageHeader } from '@/components/landing/PageHeader';
import { HeroTrustBadges } from '@/components/landing/HeroTrustBadges';

// Lazy load below-the-fold landing sections (mobile perf)
const DemoRequestForm = lazy(() => import('@/components/landing/DemoRequestForm').then(m => ({ default: m.DemoRequestForm })));
const LazyFAQ = lazy(() => import('@/components/landing/LazyFAQ').then(m => ({ default: m.LazyFAQ })));
const AILinkingSection = lazy(() => import('@/components/seo').then(m => ({ default: m.AILinkingSection })));
const LiveBuyerDemandSection = lazy(() => import('@/components/landing/LiveBuyerDemandSection').then(m => ({ default: m.LiveBuyerDemandSection })));
const HowItWorksSection = lazy(() => import('@/components/landing/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const Footer = lazy(() => import('@/components/landing/Footer').then(m => ({ default: m.Footer })));
const HighDemandSection = lazy(() => import('@/components/landing/HighDemandSection'));

// Lazy load below-the-fold components
const LiveSupplierStock = lazy(() => import('@/components/LiveSupplierStock').then(m => ({ default: m.LiveSupplierStock })));
const BrowseRequirements = lazy(() => import('@/components/BrowseRequirements').then(m => ({ default: m.BrowseRequirements })));
const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
const LiveActivityFeed = lazy(() => import('@/components/landing/LiveActivityFeed').then(m => ({ default: m.LiveActivityFeed })));

// Skeleton loading fallbacks
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

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showLiveStock, setShowLiveStock] = useState(false);
  const [showLiveRequirements, setShowLiveRequirements] = useState(false);
  const [showLogisticsRequirements, setShowLogisticsRequirements] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // SEO setup - AEO/GEO optimized
  useSEO({
    title: "ProcureSaathi | AI-Powered B2B Procurement Platform for Smart Sourcing",
    description: "ProcureSaathi is an AI-powered B2B procurement and sourcing platform that helps businesses post RFQs, compare verified supplier bids, and manage domestic and export–import sourcing with transparency and quality assurance.",
    canonical: "https://www.procuresaathi.com/",
    keywords: "B2B procurement platform India, AI RFQ software, digital sourcing platform, online bidding platform for businesses, supplier discovery platform, transparent bidding, verified suppliers, domestic sourcing, export import sourcing",
    ogImage: "https://www.procuresaathi.com/og-early-adopter.png",
    ogType: "website",
    twitterCard: "summary_large_image"
  });

  // Inject structured data schemas
  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');
    
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
    
    const howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Source Products on ProcureSaathi",
      "description": "Steps to source products on ProcureSaathi - AI-powered B2B procurement platform",
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "Submit Requirements",
          "text": "Buyers submit sourcing requirements or research products on the platform"
        },
        {
          "@type": "HowToStep",
          "position": 2,
          "name": "AI Detects Intent",
          "text": "AI analyzes buyer intent and structures professional RFQs automatically"
        },
        {
          "@type": "HowToStep",
          "position": 3,
          "name": "Supplier Matching",
          "text": "Verified suppliers are matched based on category, capacity, and performance"
        },
        {
          "@type": "HowToStep",
          "position": 4,
          "name": "Managed Fulfillment",
          "text": "Single contract with ProcureSaathi for end-to-end managed fulfillment"
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


  // Show loading spinner while auth resolves or redirecting logged-in user
  if (authLoading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const features = [
    { icon: Layers, title: 'Multi-Category Coverage', desc: 'Pan-category procurement across industries', delay: '0ms' },
    { icon: Globe, title: 'Domestic & Export', desc: 'India-based and global sourcing support', delay: '100ms' },
    { icon: Truck, title: 'Integrated Logistics', desc: 'Verified fleet and warehousing network', delay: '200ms' },
    { icon: Sparkles, title: 'AI Demand Matching', desc: 'Demand-led supplier discovery', delay: '300ms' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <main>
        {/* ===== SECTION 1: HERO ===== */}
        <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
          {/* Background image - preloaded for fast LCP */}
          <img
            src={heroBgProcurement}
            alt=""
            role="presentation"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'contrast(1) brightness(0.9)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/25 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* AI Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/25 mb-8 animate-fade-in hover:bg-primary/20 transition-colors cursor-default">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-primary text-sm font-semibold tracking-wide">AI-Powered Procurement</span>
              </div>
              
              {/* H1 */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold mb-6 leading-[1.08] animate-slide-up tracking-tight">
                <span className="text-primary drop-shadow-lg">AI-Powered B2B</span>
                <br />
                <span className="text-foreground drop-shadow-md">Procurement Platform</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-foreground/90 font-semibold mb-3 animate-slide-up drop-shadow-md max-w-2xl mx-auto" style={{ animationDelay: '80ms' }}>
                Verified sourcing through AI-detected buyer demand
              </p>
              
              <p className="text-sm sm:text-base text-primary font-semibold mb-10 animate-slide-up drop-shadow-md" style={{ animationDelay: '120ms' }}>
                AI tracks live buyer intent and converts it into RFQs.
              </p>
              
              {/* AI Citation */}
              <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 sm:p-6 mb-10 animate-slide-up max-w-3xl mx-auto shadow-lg" style={{ animationDelay: '160ms' }}>
                <p className="text-base sm:text-lg text-black font-bold leading-relaxed">
                  <strong className="text-primary text-lg sm:text-xl font-extrabold">ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mb-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <HeroTrustBadges />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
                <Button 
                  size="lg" 
                  className="h-13 sm:h-14 text-base px-8 sm:px-10 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 group"
                  onClick={() => navigate('/post-rfq')}
                >
                  <FileText className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Post RFQ – Free
                  <ArrowRight className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Button>
                <Button 
                  size="lg" 
                  className="h-13 sm:h-14 text-base px-6 sm:px-8 font-bold bg-warning text-warning-foreground hover:bg-warning/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 group"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  <TrendingUp className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  AI Detected Demand – List Products
                </Button>
              </div>
              
              <div className="mt-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <DemoRequestForm />
              </div>
            </div>
          </div>
        </section>

        {/* ===== HIGH DEMAND SECTION (Revenue-Weighted) ===== */}
        <HighDemandSection />

        {/* ===== SECTION 3: LIVE BUYER DEMAND SECTION ===== */}
        <LiveBuyerDemandSection />

        {/* ===== SECTION 4: HOW IT WORKS (AI-FIRST FLOW) ===== */}
        <HowItWorksSection />

        {/* ===== SECTION 5: BUYER VS SUPPLIER VALUE SPLIT ===== */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 tracking-tight">
                Built for Buyers & Suppliers
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base">
                AI-powered platform designed to solve sourcing complexity for both sides
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Buyer Card */}
              <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all duration-500 group hover:-translate-y-1">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold">For Buyers</h3>
                  </div>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Solve sourcing complexity with AI-structured RFQs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">AI-driven discovery of verified suppliers by category</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Transparent sealed bidding for competitive pricing</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full mt-6 font-semibold h-11 group/btn"
                    onClick={() => navigate('/post-rfq')}
                  >
                    Post RFQ – Free
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>

              {/* Supplier Card */}
              <Card className="bg-card border border-border shadow-md hover:shadow-xl transition-all duration-500 group hover:-translate-y-1">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <h3 className="text-xl font-display font-bold">For Suppliers</h3>
                  </div>
                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Demand-first onboarding — AI detects buyer intent first</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">No lead selling — matched with real buyer requirements</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Visibility into real buyer intent before you invest time</span>
                    </li>
                  </ul>
                  <Button 
                    variant="outline"
                    className="w-full mt-6 font-semibold h-11 border-warning text-warning hover:bg-warning hover:text-warning-foreground group/btn"
                    onClick={() => navigate('/signup?role=supplier')}
                  >
                    AI Detected Demand – List Products
                    <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: FEATURE SECTION (NO NUMBERS) ===== */}
        <section className="py-16 sm:py-24 bg-primary text-primary-foreground overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 tracking-tight">
                Platform Capabilities
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto text-base">
                End-to-end procurement infrastructure for modern B2B sourcing
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {features.map((f, i) => (
                <div 
                  key={f.title} 
                  className="text-center group animate-slide-up" 
                  style={{ animationDelay: f.delay }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary-foreground/20 group-hover:scale-110 transition-all duration-300">
                    <f.icon className="w-8 h-8" />
                  </div>
                  <div className="font-semibold text-lg mb-1">{f.title}</div>
                  <div className="text-sm text-primary-foreground/70">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: ILLUSTRATIVE PROCUREMENT SCENARIOS ===== */}
        <section className="py-14 sm:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 tracking-tight">
                Illustrative Procurement Scenarios
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Examples based on common workflows. Actual outcomes vary by category, volume, and market conditions.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card 
                className="border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 cursor-pointer group hover:-translate-y-1"
                onClick={() => navigate('/case-study-global-steel-procurement')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md">
                      Steel & Metals
                    </span>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                      Illustrative Example
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    Global Steel Procurement Scenario
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    How international buyers typically source industrial steel using transparent bidding and verified Indian suppliers.
                  </p>
                  <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2.5 transition-all">
                    View Scenario <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>

              <Card 
                className="border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500 cursor-pointer group hover:-translate-y-1"
                onClick={() => navigate('/case-study-middle-east-pulses-spices-import')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-md">
                      Food Commodities
                    </span>
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md">
                      Illustrative Example
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    Middle East Food Import Scenario
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    How food importers typically use managed export procurement for sourcing from India.
                  </p>
                  <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2.5 transition-all">
                    View Scenario <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-10">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/customer-stories')}
                className="gap-2 group h-11"
              >
                Explore More Scenarios 
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: AEO FAQ SECTION ===== */}
        <LazyFAQ />

        {/* ===== SECTION 9: FINAL CTA STRIP ===== */}
        <section className="py-14 sm:py-20 bg-gradient-to-br from-primary/5 via-muted/50 to-primary/5 relative overflow-hidden">
          {/* Subtle decorative orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-warning/5 blur-3xl" />
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3 tracking-tight">
              Start Sourcing Smarter Today
            </h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-base">
              AI detects buyer demand. Verified suppliers fulfill it. One platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="h-14 px-10 font-semibold shadow-lg hover:shadow-xl gradient-primary group transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => navigate('/post-rfq')}
              >
                <FileText className="h-5 w-5 mr-2" />
                Post Your Requirement
                <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 font-semibold border-warning text-warning hover:bg-warning hover:text-warning-foreground transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                AI Detected Demand – List Products
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2 tracking-tight">Contact Us</h2>
              <p className="text-muted-foreground">Get in touch with our team</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: MapPin, title: 'Address', content: <>PROCURESAATHI SOLUTIONS PVT LTD<br />Sector-31, Haryana - 121003</> },
                { icon: Mail, title: 'Email', content: <a href="mailto:sales@procuresaathi.com" className="text-primary hover:underline font-medium">sales@procuresaathi.com</a> },
                { icon: Building2, title: 'GSTIN', content: <span className="font-mono">06AAMCP4662L1ZW</span> },
                { icon: Clock, title: 'Business Hours', content: 'Mon - Sat, 9AM - 6PM IST' },
              ].map((item) => (
                <Card key={item.title} className="border-border/50 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-display font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <p className="text-sm text-muted-foreground mb-3">Have questions? We'd love to hear from you!</p>
              <a 
                href="mailto:sales@procuresaathi.com"
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 transition-all hover:shadow-md"
              >
                <Mail className="h-4 w-4" />
                Send us an Email
              </a>
            </div>
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
      <Footer />

      {/* Live Stock Dialog */}
      {showLiveStock && (
        <Suspense fallback={null}>
          <LiveSupplierStock 
            open={showLiveStock} 
            onOpenChange={setShowLiveStock}
            userId={user?.id}
          />
        </Suspense>
      )}

      {/* Live Requirements Dialog */}
      {showLiveRequirements && (
        <Suspense fallback={null}>
          <BrowseRequirements 
            open={showLiveRequirements} 
            onOpenChange={setShowLiveRequirements}
            userId={user?.id}
          />
        </Suspense>
      )}

      {/* Live Logistics Requirements Dialog */}
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
