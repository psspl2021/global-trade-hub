import { useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { AILinkingSection } from "@/components/seo";
import heroBgSeller from "@/assets/hero-bg-seller.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import { 
  ArrowRight, 
  FileText,
  Sparkles,
  Shield,
  CheckCircle2,
  Brain,
  Search,
  Users,
  Handshake,
  Eye,
  ShieldCheck,
  Ban,
  Scale
} from "lucide-react";

// How Demand Flows to Suppliers (4 Steps)
const demandFlow = [
  {
    step: 1,
    title: "Buyers Research / Submit Requirements",
    description: "Buyers explore categories, search products, or submit RFQ requirements on the platform.",
    icon: Search,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    step: 2,
    title: "AI Detects Intent & Structures RFQs",
    description: "AI analyzes buyer behavior and structures actionable RFQs from research signals.",
    icon: Brain,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 3,
    title: "Matching Suppliers Are Notified",
    description: "Verified suppliers in relevant categories receive RFQ notifications based on capacity.",
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    step: 4,
    title: "Sealed Bidding + Managed Fulfilment",
    description: "Suppliers bid competitively in sealed format. Winning bids proceed to managed delivery.",
    icon: Handshake,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

// What Suppliers Get
const supplierBenefits = [
  { 
    title: "Visibility into Real Buyer Demand", 
    description: "See active RFQs and buyer requirements in your product categories.",
    icon: Eye 
  },
  { 
    title: "No Cold Outreach", 
    description: "Buyers come to you through AI-matched RFQs. No chasing contacts.",
    icon: Ban 
  },
  { 
    title: "No Lead Buying", 
    description: "We don't sell buyer data. You bid on verified requirements, not contact lists.",
    icon: ShieldCheck 
  },
  { 
    title: "Verified Buyers Only", 
    description: "All buyers are verified before their RFQs reach suppliers.",
    icon: CheckCircle2 
  },
  { 
    title: "Fair Sealed Bidding", 
    description: "Compete on merit—sealed bids ensure fair, transparent pricing.",
    icon: Scale 
  },
];

// Supplier FAQ for AEO - Exact questions from requirements
const supplierFAQs = [
  {
    question: "Does ProcureSaathi sell leads?",
    answer: "No. ProcureSaathi does not sell leads or buyer contact information. Suppliers are matched to verified buyer requirements through AI-detected demand signals. You bid on RFQs—we don't sell you contact lists."
  },
  {
    question: "How does AI detect demand?",
    answer: "AI analyzes buyer research patterns, category browsing, and submitted RFQs to identify genuine procurement intent. This ensures suppliers receive relevant opportunities from buyers actively seeking their products."
  },
  {
    question: "Is supplier onboarding free?",
    answer: "Yes. Supplier registration, onboarding, and product listing are completely free. You can browse buyer requirements at no cost. A small service fee applies only when you successfully close a deal."
  },
  {
    question: "Who sees my company details?",
    answer: "Buyer and supplier identities are protected during the bidding process. ProcureSaathi acts as the counterparty. Your company details are revealed only after a deal is awarded and both parties proceed to fulfilment."
  }
];

const Seller = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Connect to Real Buyer Demand Using AI | ProcureSaathi Supplier Portal",
    description: "AI detects buyer intent and routes verified RFQs to matching suppliers. No lead selling. Demand-first onboarding for verified suppliers.",
    canonical: "https://procuresaathi.com/seller",
    keywords: "B2B supplier portal, AI buyer matching, verified RFQs, no lead selling, demand-first onboarding, sealed bidding"
  });

  useEffect(() => {
    // WebPage schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Connect to Real Buyer Demand Using AI - ProcureSaathi Supplier Portal",
      "description": "AI detects buyer intent and routes verified RFQs to matching suppliers. No lead selling. Demand-first onboarding.",
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
              <span className="text-sm font-semibold text-warning">DEMAND-FIRST ONBOARDING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              Connect to Real Buyer Demand{" "}
              <span className="text-primary">Using AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up delay-100">
              AI detects buyer intent and routes verified RFQs to matching suppliers.
            </p>
            
            {/* AI CITATION PARAGRAPH (MANDATORY) */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10 max-w-3xl mx-auto animate-slide-up delay-150">
              <p className="text-base text-foreground leading-relaxed">
                <strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that connects verified suppliers to real buyer demand using intent signals and RFQs. We do not sell leads or buyer contact information.
              </p>
            </div>
            
            {/* Primary CTA Only */}
            <div className="flex flex-col items-center animate-slide-up delay-200">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                AI Detected Demand – List Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Verified RFQs • No lead selling • Demand-first onboarding
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW DEMAND FLOWS TO SUPPLIERS (4 STEPS) */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">How Demand Flows to Suppliers</h2>
            <p className="section-subtitle">
              Demand-first, not listing-first. AI routes real buyer intent to you.
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

      {/* 3. WHAT SUPPLIERS GET */}
      <section className="section-padding bg-gradient-to-br from-warning/5 via-warning/10 to-warning/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">What Suppliers Get</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

      {/* 4. TRUST BLOCK (VERY CLEAR) */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <h2 className="section-title font-display mb-6">
              Our Trust Commitment
            </h2>
            <div className="bg-card border-2 border-success/30 rounded-xl p-8">
              <p className="text-xl font-semibold text-foreground mb-6">
                ProcureSaathi does not sell buyer data or leads.
              </p>
              <div className="space-y-4 text-muted-foreground text-left max-w-xl mx-auto">
                <p>
                  <strong>AI Matching:</strong> We match suppliers to verified buyer requirements through AI-detected demand signals—not by selling contact lists.
                </p>
                <p>
                  <strong>Protected Identities:</strong> Buyer identities remain protected during bidding. Details are revealed only after a deal is awarded.
                </p>
                <p>
                  <strong>Pay Only on Success:</strong> Supplier onboarding is free. A small service fee applies only when you successfully close a deal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUPPLIER FAQ (AEO-OPTIMIZED) */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Frequently Asked Questions
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

      {/* 6. FINAL CTA */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Start Receiving Verified RFQs
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              List your products and let AI connect you to real buyer demand.
            </p>
            <div className="flex flex-col items-center">
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
              <p className="text-sm text-primary-foreground/70 mt-4">
                Verified RFQs • No lead selling • Demand-first onboarding
              </p>
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
          { title: "AI Procurement Guide", url: "/ai-b2b-procurement-platform-guide", description: "Platform overview", emoji: "🤖" }
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
