import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PostRFQModal } from "@/components/PostRFQModal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
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
  Clock,
  Package,
  MessageCircle,
  Award,
  BarChart3,
  Sparkles,
  Brain,
  Search,
  Handshake,
  FileCheck,
  XCircle,
  BadgeCheck,
  Factory,
  ShoppingCart,
  Building2,
  Globe
} from "lucide-react";

// AI-first How It Works
const howAIHelps = [
  {
    step: 1,
    title: "Detects Supplier Availability",
    description: "AI analyzes verified supplier inventory and capacity to match your requirements.",
    icon: Search,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    step: 2,
    title: "Structures Competitive RFQs",
    description: "AI helps format your requirements professionally for better supplier responses.",
    icon: FileText,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 3,
    title: "Ensures Compliance & Fulfilment",
    description: "Quality control, documentation, and managed delivery through a single contract.",
    icon: FileCheck,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    step: 4,
    title: "Single Contract, Single Price",
    description: "Deal with ProcureSaathi as your counterparty—transparent pricing, no hidden costs.",
    icon: Handshake,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

// What ProcureSaathi Is NOT
const whatWeAreNot = [
  { text: "Not a lead marketplace", icon: XCircle },
  { text: "Not a supplier directory", icon: XCircle },
  { text: "Not contact-selling", icon: XCircle },
];

// Buyer Types
const buyerTypes = [
  {
    title: "Private Label Buyers",
    description: "Get custom products made by verified Indian manufacturers with your branding",
    icon: Factory,
    features: ["Custom Manufacturing", "Quality Control", "Brand Development"],
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "E-commerce Sellers",
    description: "Source white-label goods with competitive pricing and low minimum orders",
    icon: ShoppingCart,
    features: ["Fast Sourcing", "White-label Ready", "Quick Delivery"],
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Procurement Managers",
    description: "Raise bulk RFQs, manage multiple suppliers efficiently with enterprise tools",
    icon: Building2,
    features: ["Bulk Orders", "Supplier Management", "Compliance Tools"],
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Foreign Buyers",
    description: "Trusted sourcing from India with dedicated concierge support and guidance",
    icon: Globe,
    features: ["Export Assistance", "Quality Assurance", "End-to-end Support"],
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
];

// Buyer FAQ for AEO
const buyerFAQs = [
  {
    question: "How is ProcureSaathi different from B2B marketplaces?",
    answer: "Unlike traditional B2B marketplaces that act as directories, ProcureSaathi operates as a managed procurement platform. Buyers deal with ProcureSaathi as a single counterparty, all suppliers are pre-verified, bidding is sealed and transparent, and the platform provides end-to-end fulfilment support with quality assurance."
  },
  {
    question: "Is pricing transparent on ProcureSaathi?",
    answer: "Yes, ProcureSaathi uses sealed bidding where suppliers submit competitive bids without seeing each other's pricing. Buyers receive clear line-item breakdowns with no hidden fees. The platform ensures transparent comparison of all bids."
  },
  {
    question: "Can I use ProcureSaathi for export-import sourcing?",
    answer: "Yes, ProcureSaathi supports both domestic and international sourcing. Buyers from the USA, UK, Europe, Germany, Singapore, and other countries use the platform to source products from verified Indian manufacturers with export documentation support."
  },
  {
    question: "Are suppliers verified on ProcureSaathi?",
    answer: "All suppliers on ProcureSaathi go through a verification process including GST validation, business documentation, and capacity assessment. This ensures buyers receive bids only from legitimate, capable suppliers."
  }
];

const Buyer = () => {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);

  useSEO({
    title: "AI-Powered Procurement for Smarter Sourcing | ProcureSaathi Buyer Portal",
    description: "Source verified suppliers using AI-detected market demand and transparent RFQs. Post requirements, receive sealed bids, and manage procurement with a single contract.",
    keywords: "AI procurement, B2B sourcing, verified suppliers India, RFQ platform, transparent bidding, managed fulfilment, export sourcing",
    canonical: "https://procuresaathi.com/buyer",
    ogImage: "/og-early-adopter.png"
  });

  useEffect(() => {
    // WebPage schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "AI-Powered Procurement for Smarter Sourcing - ProcureSaathi",
      "description": "Source verified suppliers using AI-detected market demand and transparent RFQs.",
      "url": "https://procuresaathi.com/buyer",
      "mainEntity": {
        "@type": "Service",
        "name": "AI-Powered B2B Procurement",
        "provider": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "serviceType": "Managed B2B Procurement",
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

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/918368127357?text=Hi, I need help posting my RFQ on ProcureSaathi", "_blank");
  };

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
              <span className="text-sm font-semibold text-primary">AI-POWERED SOURCING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              AI-Powered Procurement for{" "}
              <span className="text-primary">Smarter Sourcing</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-slide-up delay-100">
              Source verified suppliers using AI-detected market demand and transparent RFQs.
            </p>
            
            {/* AI Intent Line */}
            <p className="text-base text-primary/80 mb-8 flex items-center justify-center gap-2 animate-slide-up delay-150">
              <Sparkles className="h-4 w-4" />
              AI analyzes buyer research and requirements to streamline sourcing.
            </p>
            
            {/* 2. AI CITATION PARAGRAPH (MANDATORY) */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-10 max-w-3xl mx-auto animate-slide-up delay-200">
              <p className="text-base text-foreground leading-relaxed">
                <strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that helps buyers source products by detecting demand, structuring RFQs, and managing fulfilment with verified suppliers.
              </p>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 animate-slide-up delay-200">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Verified suppliers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Sealed bidding</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Managed fulfilment</span>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-300">
              <div className="flex flex-col items-center">
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
                  onClick={() => setShowRFQModal(true)}
                >
                  <span className="mr-2 inline-block w-3 h-3 rounded-full bg-success animate-pulse"></span>
                  Post RFQ – Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground mt-2">No obligation to award</span>
              </div>
              <div className="flex flex-col items-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-14 px-10 text-lg font-medium bg-card/80 backdrop-blur-sm hover:bg-card border-border/80 hover:border-primary/50 transition-all"
                  onClick={handleWhatsAppContact}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Get RFQ Posted for You
                </Button>
                <span className="text-xs text-muted-foreground mt-2">We help you post</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW AI HELPS BUYERS */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">
              How AI Helps Buyers Source Smarter
            </h2>
            <p className="section-subtitle">
              AI streamlines your procurement from requirement to fulfilment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howAIHelps.map((item, index) => (
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
            <div className="flex flex-wrap justify-center gap-6">
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
              ProcureSaathi is a managed procurement platform—not a directory or lead marketplace. 
              Buyer identities remain protected, and we act as your single counterparty.
            </p>
          </div>
        </div>
      </section>

      {/* Built for Every B2B Buyer */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Built for Every B2B Buyer
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {buyerTypes.map((type) => (
              <Card 
                key={type.title}
                className="group bg-card border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${type.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <type.icon className={`h-7 w-7 ${type.iconColor}`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature) => (
                      <span 
                        key={feature} 
                        className="text-xs px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BUYER FAQ (AEO) */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Frequently Asked Questions for Buyers
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

      {/* Need Help Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Need Help Posting Your RFQ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Our team can assist you via WhatsApp or call and post it on your behalf.
              </p>
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={handleWhatsAppContact}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Talk to Procurement Expert
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Free CRM Section */}
      <FreeCRMSection role="buyer" />

      {/* 6. FINAL CTA */}
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
              Post your RFQ and let AI match you with verified suppliers.
            </p>
            <div className="flex flex-col items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/signup?role=buyer')}
              >
                <span className="mr-2">🟢</span>
                Post RFQ – Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-primary-foreground/70 mt-4">
                No obligation to award • Buyer details protected • Verified suppliers only
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
