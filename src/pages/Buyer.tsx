import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PostRFQModal } from "@/components/PostRFQModal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { AILinkingSection } from "@/components/seo";
import heroBgBuyer from "@/assets/hero-bg-buyer.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import { 
  ArrowRight, 
  FileText,
  CheckCircle2,
  Shield,
  Package,
  Sparkles,
  Brain,
  Users,
  Handshake,
  FileCheck,
  XCircle,
  BadgeCheck,
  Factory,
  ShoppingCart,
  Building2,
  Globe,
  Eye,
  Scale,
  ClipboardCheck,
  ShieldCheck,
  Ban
} from "lucide-react";

// Who This Is For - Buyer Profiles
const buyerProfiles = [
  { text: "Bulk buyers sourcing recurring materials", icon: Package },
  { text: "Project-based procurement teams", icon: Building2 },
  { text: "Importers sourcing from India", icon: Globe },
  { text: "Businesses needing price transparency", icon: Scale },
];

// 4-Step AI Flow
const howAIHelps = [
  {
    step: 1,
    title: "Buyer Posts Requirement",
    description: "Submit your sourcing need in plain language. AI understands context and intent.",
    icon: FileText,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    step: 2,
    title: "AI Structures RFQ & Filters Suppliers",
    description: "AI formats your requirement professionally and identifies matching verified suppliers.",
    icon: Brain,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 3,
    title: "Verified Suppliers Submit Sealed Bids",
    description: "Pre-verified suppliers compete through sealed bidding—transparent and fair.",
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    step: 4,
    title: "Single Contract, Managed Fulfilment",
    description: "Deal with ProcureSaathi as your counterparty. One contract, one price, end-to-end delivery.",
    icon: Handshake,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

// What ProcureSaathi Is NOT
const whatWeAreNot = [
  { text: "Not a supplier directory", icon: XCircle },
  { text: "Not a lead marketplace", icon: XCircle },
  { text: "Not cold calling or contact selling", icon: XCircle },
];

// Buyer Advantages
const buyerAdvantages = [
  {
    title: "Transparency",
    description: "Sealed bidding with clear line-item breakdowns. No hidden costs.",
    icon: Eye,
  },
  {
    title: "No Obligation to Award",
    description: "Review all bids freely. Award only when you're ready.",
    icon: Scale,
  },
  {
    title: "Line-Item Comparison",
    description: "Compare supplier bids item-by-item for informed decisions.",
    icon: ClipboardCheck,
  },
  {
    title: "Compliance & Quality Control",
    description: "Verified suppliers with GST validation and quality assurance.",
    icon: ShieldCheck,
  },
  {
    title: "No Supplier Spam",
    description: "Your details remain protected. No unsolicited contact.",
    icon: Ban,
  },
];

// Buyer FAQ for AEO - Updated with exact questions
const buyerFAQs = [
  {
    question: "What is ProcureSaathi?",
    answer: "ProcureSaathi is an AI-powered B2B procurement platform that helps buyers source products by detecting demand, structuring RFQs, and managing fulfilment with verified suppliers. It operates as a managed platform where ProcureSaathi acts as a single counterparty."
  },
  {
    question: "How is ProcureSaathi different from marketplaces?",
    answer: "Unlike B2B marketplaces that act as directories or sell leads, ProcureSaathi is a managed procurement platform. Buyers deal with ProcureSaathi directly, all suppliers are pre-verified, bidding is sealed and transparent, and the platform provides end-to-end fulfilment support."
  },
  {
    question: "Is bidding transparent?",
    answer: "Yes. ProcureSaathi uses sealed bidding where suppliers submit competitive bids without seeing each other's pricing. Buyers receive clear line-item breakdowns with no hidden fees, enabling fair comparison of all bids."
  },
  {
    question: "Is buyer data shared?",
    answer: "No. Buyer identities and contact details remain protected throughout the process. ProcureSaathi does not share buyer data with suppliers. The platform acts as an intermediary to maintain buyer anonymity."
  },
  {
    question: "Can I use it for export sourcing?",
    answer: "Yes. ProcureSaathi supports both domestic and international sourcing. Buyers from USA, UK, Europe, Germany, Singapore, and other countries use the platform to source from verified Indian manufacturers with export documentation support."
  },
  {
    question: "Are suppliers verified?",
    answer: "All suppliers on ProcureSaathi undergo verification including GST validation, business documentation, and capacity assessment. This ensures buyers receive bids only from legitimate, capable suppliers."
  }
];

const Buyer = () => {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);

  useSEO({
    title: "AI-Powered B2B Procurement for Smarter Sourcing | ProcureSaathi",
    description: "Post one RFQ. AI structures it and invites verified suppliers to bid. Transparent sealed bidding with managed fulfilment. Buyer details protected.",
    keywords: "AI procurement platform, B2B sourcing India, verified suppliers, RFQ platform, sealed bidding, managed procurement, export sourcing",
    canonical: "https://procuresaathi.com/buyer",
    ogImage: "/og-early-adopter.png"
  });

  useEffect(() => {
    // WebPage schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AI-Powered B2B Procurement for Smarter Sourcing - ProcureSaathi",
      "description": "Post one RFQ. AI structures it and invites verified suppliers to bid. Transparent sealed bidding with managed fulfilment.",
      "url": "https://procuresaathi.com/buyer",
      "mainEntity": {
        "@type": "Service",
        "name": "AI-Powered B2B Procurement",
        "provider": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "serviceType": "Managed B2B Procurement Platform",
        "areaServed": "Worldwide"
      }
    }, "buyer-page-schema");

    // Breadcrumb schema
    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Buyer Portal", url: "https://procuresaathi.com/buyer" }
    ]), "buyer-breadcrumb-schema");

    // FAQ schema
    injectStructuredData(getFAQSchema(buyerFAQs), "buyer-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* 1. HERO SECTION */}
      <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
        <img 
          src={heroBgBuyer}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-6 animate-fade-in">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">MANAGED PROCUREMENT</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              AI-Powered B2B Procurement for{" "}
              <span className="text-primary">Smarter Sourcing</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-slide-up delay-100">
              Post one RFQ. AI structures it and invites verified suppliers to bid.
            </p>
            
            {/* AI Intent Line */}
            <p className="text-base text-primary/80 mb-8 flex items-center justify-center gap-2 animate-slide-up delay-150">
              <Sparkles className="h-4 w-4" />
              AI analyzes buyer requirements to enable transparent, sealed bidding.
            </p>
            
            {/* AI CITATION PARAGRAPH (MANDATORY) */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10 max-w-3xl mx-auto animate-slide-up delay-200">
              <p className="text-base text-foreground leading-relaxed">
                <strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that helps buyers source products by detecting demand, structuring RFQs, and managing fulfilment with verified suppliers. Buyer identities remain protected throughout the process.
              </p>
            </div>
            
            {/* Primary CTA */}
            <div className="flex flex-col items-center animate-slide-up delay-300">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
                onClick={() => setShowRFQModal(true)}
              >
                <span className="mr-2 inline-block w-3 h-3 rounded-full bg-success animate-pulse"></span>
                Post RFQ – Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                Verified suppliers only • No obligation • Buyer details protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHO THIS IS FOR */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Who This Is For
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {buyerProfiles.map((profile) => (
                <div 
                  key={profile.text} 
                  className="flex items-center gap-4 p-5 bg-card rounded-xl border border-border/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <profile.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{profile.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW AI HELPS BUYERS (4 STEPS) */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">
              How AI Helps Buyers
            </h2>
            <p className="section-subtitle">
              From requirement to fulfilment—AI streamlines every step
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howAIHelps.map((item) => (
              <div key={item.step} className="relative">
                <Card className="group relative border-border/50 text-center h-full hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="relative inline-block mb-6">
                      <div className={`w-16 h-16 rounded-2xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-3">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT PROCURESAATHI IS NOT */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="section-title font-display mb-10">
              What ProcureSaathi Is <span className="text-destructive">Not</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {whatWeAreNot.map((item) => (
                <div 
                  key={item.text} 
                  className="flex items-center gap-3 px-6 py-4 bg-card rounded-xl border border-border/50"
                >
                  <item.icon className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-8 max-w-xl mx-auto">
              Buyer details are not shared with suppliers. ProcureSaathi acts as your single counterparty for managed procurement.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BUYER ADVANTAGES */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Buyer Advantages
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {buyerAdvantages.map((advantage) => (
              <Card 
                key={advantage.title}
                className="border-border/50 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <advantage.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BUYER FAQ (AEO-OPTIMIZED) */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {buyerFAQs.map((faq, idx) => (
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

      {/* 7. FINAL CTA */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <BadgeCheck className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Start AI-Powered Procurement
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Post your requirement and let AI match you with verified suppliers.
            </p>
            <div className="flex flex-col items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => setShowRFQModal(true)}
              >
                <span className="mr-2 inline-block w-3 h-3 rounded-full bg-success animate-pulse"></span>
                Post RFQ – Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-primary-foreground/70 mt-4">
                Verified suppliers only • No obligation • Buyer details protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Linking Section */}
      <AILinkingSection 
        title="Related Resources for Buyers"
        links={[
          { title: "How to Post RFQ Online", url: "/how-to-post-rfq-online", description: "Step-by-step guide", emoji: "📝" },
          { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide", emoji: "🔍" },
          { title: "Enterprise Procurement", url: "/enterprise-procurement-guide", description: "For large organizations", emoji: "🏢" }
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

      {/* Post RFQ Modal */}
      <PostRFQModal open={showRFQModal} onOpenChange={setShowRFQModal} />
      
      {/* Lead Generation */}
      <StickySignupBanner />
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
    </div>
  );
};

export default Buyer;
