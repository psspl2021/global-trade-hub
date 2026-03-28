import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, FileText, CheckCircle, Send, Building2,
  Package, Users, Shield, Target,
  Truck, Menu, Sparkles, TrendingUp, Globe, Layers
} from 'lucide-react';
const BrowseLogisticsPublic = lazy(() => import('@/components/logistics/BrowseLogisticsPublic'));
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import heroBgProcurement from '@/assets/hero-bg-procurement.jpg';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSEO, injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';
import { LazyFAQ } from '@/components/landing/LazyFAQ';
import { StickySignupBanner } from '@/components/StickySignupBanner';
import { DemoRequestForm } from '@/components/landing/DemoRequestForm';
import { PageHeader } from '@/components/landing/PageHeader';
import { HeroTrustBadges } from '@/components/landing/HeroTrustBadges';
import { AILinkingSection } from '@/components/seo';
import { LiveBuyerDemandSection } from '@/components/landing/LiveBuyerDemandSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { Footer } from '@/components/landing/Footer';
import { GlobalProcurementCorridors } from '@/components/GlobalProcurementCorridors';
import HighDemandSection from '@/components/landing/HighDemandSection';
import HomeDemandLinks from '@/components/HomeDemandLinks';
import TrendingProcurementCategories from '@/components/TrendingProcurementCategories';

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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <main>
        {/* ===== SECTION 1: HERO ===== */}
        <section className="relative py-16 sm:py-20 lg:py-28 overflow-hidden">
          {/* Background image - visible and premium */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${heroBgProcurement})`,
              filter: 'contrast(0.95) brightness(0.9)'
            }}
          />
          {/* Subtle gradient overlay (50-60% opacity) - allows image to show through */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/50 to-background/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* AI Badge - glassmorphism style */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in shadow-lg">
                <Sparkles className="h-4 w-4 text-primary drop-shadow-md" />
                <span className="text-primary text-sm font-bold drop-shadow-sm">AI-Powered Procurement</span>
              </div>
              
              {/* H1 - Bold, high contrast, directly on overlay */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold mb-6 leading-tight px-2 animate-slide-up">
                <span className="text-primary drop-shadow-lg">AI-Powered B2B Procurement</span>
                <br className="hidden sm:block" />
                <span className="text-foreground drop-shadow-md"> Platform</span>
              </h1>
              
              {/* Subline - directly on overlay, no box */}
              <p className="text-xl sm:text-2xl text-foreground font-bold mb-4 animate-slide-up delay-50 drop-shadow-md">
                Verified sourcing through AI-detected buyer demand
              </p>
              
              {/* AI Intent Line */}
              <p className="text-base sm:text-lg text-primary font-bold mb-10 animate-slide-up delay-75 drop-shadow-md">
                AI tracks live buyer intent and converts it into RFQs.
              </p>
              
              {/* AI Citation Paragraph - Glassmorphism style, subtle not white box */}
              <div className="bg-background/10 backdrop-blur-lg border border-white/15 rounded-2xl p-5 sm:p-7 mb-10 animate-slide-up delay-100 shadow-xl max-w-3xl mx-auto">
                <p className="text-base sm:text-lg text-foreground leading-relaxed font-semibold drop-shadow-sm">
                  <strong className="text-primary">ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
                </p>
              </div>

              {/* ===== SECTION 2: HERO TRUST BADGES (NON-NUMERIC) ===== */}
              <div className="mb-10 animate-slide-up delay-150">
                <HeroTrustBadges />
              </div>

              {/* CTA Buttons - Buyer & Supplier */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 px-2 animate-slide-up delay-200">
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 text-base sm:text-lg px-8 sm:px-12 font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 gradient-primary"
                  onClick={() => navigate('/post-rfq')}
                >
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  Post RFQ – Free
                </Button>
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 text-base sm:text-lg px-6 sm:px-10 font-bold bg-warning text-warning-foreground hover:bg-warning/90 border-2 border-warning transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  AI Detected Demand – List Products
                </Button>
              </div>
              
              <div className="mt-6 animate-slide-up delay-250">
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
        <section className="py-12 sm:py-16 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                Built for Buyers & Suppliers
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                AI-powered platform designed to solve sourcing complexity for both sides
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Buyer Card */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold">For Buyers</h3>
                  </div>
                  <ul className="space-y-3">
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
                    className="w-full mt-6 font-semibold"
                    onClick={() => navigate('/post-rfq')}
                  >
                    Post RFQ – Free
                  </Button>
                </CardContent>
              </Card>

              {/* Supplier Card */}
              <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <h3 className="text-xl font-display font-bold">For Suppliers</h3>
                  </div>
                  <ul className="space-y-3">
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
                    className="w-full mt-6 font-semibold border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                    onClick={() => navigate('/signup?role=supplier')}
                  >
                    AI Detected Demand – List Products
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: FEATURE SECTION (NO NUMBERS) ===== */}
        <section className="py-12 sm:py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                Platform Capabilities
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto">
                End-to-end procurement infrastructure for modern B2B sourcing
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Layers className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg mb-1">Multi-Category Coverage</div>
                <div className="text-sm text-primary-foreground/70">Pan-category procurement across industries</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Globe className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg mb-1">Domestic & Export</div>
                <div className="text-sm text-primary-foreground/70">India-based and global sourcing support</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Truck className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg mb-1">Integrated Logistics</div>
                <div className="text-sm text-primary-foreground/70">Verified fleet and warehousing network</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="font-semibold text-lg mb-1">AI Demand Matching</div>
                <div className="text-sm text-primary-foreground/70">Demand-led supplier discovery</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: ILLUSTRATIVE PROCUREMENT SCENARIOS ===== */}
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
                Illustrative Procurement Scenarios
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Examples based on common workflows. Actual outcomes vary by category, volume, and market conditions.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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

        {/* ===== SECTION 8: AEO FAQ SECTION ===== */}
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

        {/* ===== SECTION 9: FINAL CTA STRIP ===== */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-muted/50 to-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              Start Sourcing Smarter Today
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              AI detects buyer demand. Verified suppliers fulfill it. One platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="h-14 px-10 font-semibold shadow-md gradient-primary"
                onClick={() => navigate('/post-rfq')}
              >
                <FileText className="h-5 w-5 mr-2" />
                Post Your Requirement
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 font-semibold border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                AI Detected Demand – List Products
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">Contact Us</h2>
              <p className="text-muted-foreground">Get in touch with our team</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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
              
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-display font-semibold text-sm mb-1">GSTIN</h4>
                  <p className="text-xs text-muted-foreground font-mono">06AAMCP4662L1ZW</p>
                </CardContent>
              </Card>
              
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

      {/* ===== STEEL INTELLIGENCE HUBS ===== */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Steel Intelligence Hubs</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link to="/steel-comparisons" className="rounded-xl border border-border bg-background p-5 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors">
              Grade Comparisons
            </Link>
            <Link to="/industrial-use-cases" className="rounded-xl border border-border bg-background p-5 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors">
              Industrial Use Cases
            </Link>
            <Link to="/global-sourcing-countries" className="rounded-xl border border-border bg-background p-5 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors">
              Global Trade Hub
            </Link>
            <Link to="/demand" className="rounded-xl border border-border bg-background p-5 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors">
              Live Demand
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TRENDING PROCUREMENT CATEGORIES (CRAWL BOOST) ===== */}
      <TrendingProcurementCategories />

      {/* ===== SECTION 10: DEMAND LINKS + GLOBAL CORRIDORS + FOOTER ===== */}
      <HomeDemandLinks />
      <GlobalProcurementCorridors />
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
