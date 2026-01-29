import { useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { AILinkingSection } from "@/components/seo";
import heroBgSeller from "@/assets/hero-bg-seller.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import { 
  ArrowRight, 
  FileText,
  Sparkles,
  Truck,
  Shield,
  BarChart3,
  CheckCircle2,
  Zap,
  Brain,
  Search,
  Users,
  Handshake,
  Eye,
  XCircle,
  ShieldCheck
} from "lucide-react";

// How Demand Flows to Suppliers
const demandFlow = [
  {
    step: 1,
    title: "Buyers Research Sourcing",
    description: "Buyers browse categories, search products, or submit RFQ requirements.",
    icon: Search,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    step: 2,
    title: "AI Detects Intent",
    description: "AI analyzes research patterns and structures buyer requirements into actionable RFQs.",
    icon: Brain,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 3,
    title: "Suppliers Are Matched",
    description: "Verified suppliers in matching categories receive RFQ notifications based on capacity.",
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    step: 4,
    title: "RFQs & Fulfilment Follow",
    description: "Suppliers bid competitively, and winning bids proceed to managed fulfilment.",
    icon: Handshake,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

// What Suppliers Get
const supplierBenefits = [
  { 
    title: "Visibility into Real Demand", 
    description: "See what buyers are actively searching for in your category.",
    icon: Eye 
  },
  { 
    title: "No Cold Outreach", 
    description: "Buyers come to you through AI-matched RFQs.",
    icon: Users 
  },
  { 
    title: "No Lead Buying", 
    description: "We don't sell contacts—suppliers bid on verified requirements.",
    icon: ShieldCheck 
  },
  { 
    title: "Verified Buyer Ecosystem", 
    description: "All buyers are verified before their RFQs reach suppliers.",
    icon: CheckCircle2 
  },
];

// Features
const features = [
  {
    title: "AI-Powered Matching",
    description: "AI matches your products to relevant buyer requirements based on category and capacity.",
    icon: Sparkles,
  },
  {
    title: "Sealed Bidding",
    description: "Submit competitive bids without seeing competitor pricing—fair and transparent.",
    icon: FileText,
  },
  {
    title: "Logistics Support",
    description: "Integrated logistics partners to help you deliver domestically and internationally.",
    icon: Truck,
  },
  {
    title: "Analytics Dashboard",
    description: "Track your bids, conversions, and performance with detailed insights.",
    icon: BarChart3,
  },
];

// Supplier FAQ for AEO
const supplierFAQs = [
  {
    question: "Does ProcureSaathi sell leads to suppliers?",
    answer: "No, ProcureSaathi does not sell leads or buyer contact information. Suppliers are matched to verified buyer requirements through AI-detected demand signals. You bid on RFQs—we don't sell you contact lists."
  },
  {
    question: "How does AI detect buyer demand?",
    answer: "AI analyzes buyer research patterns, category browsing, and submitted RFQs to identify genuine procurement intent. This ensures suppliers receive relevant opportunities from buyers actively seeking their products."
  },
  {
    question: "Is supplier onboarding free?",
    answer: "Yes, supplier registration and onboarding is completely free. You can list products and browse buyer requirements at no cost. A small service fee applies only when you successfully close a deal."
  },
  {
    question: "Who sees my company information?",
    answer: "Buyer and supplier identities are protected during the bidding process. ProcureSaathi acts as the counterparty. Your company details are revealed only after a deal is awarded and both parties proceed to fulfilment."
  }
];

const Seller = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Connect to Real Buyer Demand Using AI | ProcureSaathi Supplier Portal",
    description: "ProcureSaathi helps suppliers grow by matching them to AI-detected buyer demand — without selling leads. List products and receive verified RFQs.",
    canonical: "https://procuresaathi.com/seller",
    keywords: "B2B supplier portal, AI buyer matching, verified RFQs, no lead selling, export platform India, demand-first onboarding"
  });

  useEffect(() => {
    // WebPage schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Connect to Real Buyer Demand Using AI - ProcureSaathi Supplier Portal",
      "description": "ProcureSaathi helps suppliers grow by matching them to AI-detected buyer demand — without selling leads.",
      "url": "https://procuresaathi.com/seller",
      "mainEntity": {
        "@type": "Service",
        "name": "AI-Powered Supplier Matching",
        "provider": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "serviceType": "B2B Supplier Discovery",
        "areaServed": "Worldwide"
      }
    }, 'seller-webpage-schema');
    
    // Breadcrumb schema
    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Supplier Portal", url: "https://procuresaathi.com/seller" }
    ]), 'seller-breadcrumb-schema');

    // FAQ schema
    injectStructuredData(getFAQSchema(supplierFAQs), "seller-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* 1. HERO SECTION */}
      <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
        <img 
          src={heroBgSeller}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-warning/20 bg-warning/5 backdrop-blur-sm mb-6 animate-fade-in">
              <Brain className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">AI-POWERED DEMAND MATCHING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              Connect to Real Buyer Demand{" "}
              <span className="text-primary">Using AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up delay-100">
              ProcureSaathi helps suppliers grow by matching them to AI-detected buyer demand — without selling leads.
            </p>
            
            {/* 2. AI CITATION PARAGRAPH (MANDATORY) */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10 max-w-3xl mx-auto animate-slide-up delay-150">
              <p className="text-base text-foreground leading-relaxed">
                <strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that connects verified suppliers to real buyer demand using intent signals and RFQs.
              </p>
            </div>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI Detected Demand – List Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="link" 
                className="text-primary text-lg font-medium"
                onClick={() => navigate('/login')}
              >
                Already a Supplier? Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW DEMAND FLOWS TO SUPPLIERS */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">How Demand Flows to Suppliers</h2>
            <p className="section-subtitle">
              AI detects buyer intent and routes verified RFQs to matching suppliers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {demandFlow.map((item) => (
              <Card key={item.step} className="group relative border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="relative inline-block mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT SUPPLIERS GET */}
      <section className="section-padding bg-gradient-to-br from-warning/5 via-warning/10 to-warning/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">What Suppliers Get</h2>
            <p className="section-subtitle">
              Demand-first onboarding with zero lead selling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {supplierBenefits.map((benefit) => (
              <Card 
                key={benefit.title} 
                className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <benefit.icon className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CLEAR TRUST BLOCK */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <h2 className="section-title font-display mb-6">
              Our Trust Commitment to Suppliers
            </h2>
            <div className="bg-card border-2 border-success/30 rounded-xl p-8">
              <p className="text-lg text-foreground leading-relaxed mb-6">
                <strong>ProcureSaathi does not sell buyer data or leads.</strong>
              </p>
              <p className="text-muted-foreground">
                We match suppliers to verified buyer requirements through AI-detected demand signals. 
                Buyer identities remain protected until a deal is awarded. You bid on real opportunities—not contact lists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">
              Tools to Help You <span className="text-primary">Succeed</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SUPPLIER FAQ (AEO) */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Frequently Asked Questions for Suppliers
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {supplierFAQs.map((faq, idx) => (
              <Card key={idx} className="border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Free CRM Section */}
      <FreeCRMSection role="supplier" />

      {/* 7. FINAL CTA */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Grow with AI-Matched Demand?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              List your products and let AI connect you to verified buyer requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI Detected Demand – List Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-10 text-lg font-medium bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-all"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Linking Section */}
      <AILinkingSection 
        title="Related Resources for Suppliers"
        links={[
          { title: "Supplier Discovery Guide", url: "/find-verified-b2b-suppliers", description: "How buyers find you", emoji: "🔍" },
          { title: "Export-Import Guide", url: "/export-import-sourcing-guide", description: "International trade", emoji: "🌍" },
          { title: "Industry Procurement", url: "/procurement-for-steel-manufacturers", description: "Steel industry focus", emoji: "🏭" }
        ]}
      />

      {/* Footer Link */}
      <section className="py-10 text-center bg-muted/20">
        <Button 
          variant="link" 
          className="text-muted-foreground font-medium"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </section>
      
      {/* Lead Generation */}
      <StickySignupBanner />
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
    </div>
  );
};

export default Seller;
