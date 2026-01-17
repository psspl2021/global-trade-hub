import { useNavigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PostRFQModal } from "@/components/PostRFQModal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import heroBgBuyer from "@/assets/hero-bg-buyer.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import { 
  ArrowRight, 
  Users, 
  Globe, 
  FileText,
  CheckCircle2,
  Shield,
  Clock,
  TrendingDown,
  Package,
  BadgeCheck,
  Factory,
  ShoppingCart,
  Building2,
  MessageCircle,
  Phone,
  Award,
  BarChart3,
  Eye,
  Sparkles
} from "lucide-react";

const stats = [
  { value: "1000+", label: "Verified Suppliers", icon: Users },
  { value: "23+", label: "Categories", icon: Package },
  { value: "50%", label: "Avg. Savings", icon: TrendingDown },
  { value: "48hrs", label: "Quote Time", icon: Clock },
];

const buyerBenefits = [
  "Purchase in bulk or regularly",
  "Want multiple supplier quotes before buying",
  "Prefer structured bidding instead of price chasing",
  "Need transparency in pricing and terms",
];

const howItWorks = [
  {
    step: 1,
    title: "Post Your RFQ",
    description: "Share product details, quantity, delivery location, and timeline.",
    icon: FileText,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    step: 2,
    title: "Receive Competitive Bids",
    description: "Verified suppliers submit sealed bids against your RFQ.",
    icon: BarChart3,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    step: 3,
    title: "Compare & Award",
    description: "Compare prices, terms, and award the RFQ to the best supplier.",
    icon: Award,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const buyerAdvantages = [
  { title: "No unsolicited supplier calls", icon: Phone },
  { title: "No obligation to award any bid", icon: Shield },
  { title: "Clear price and term comparison", icon: Eye },
  { title: "Line-item level bid analysis", icon: BarChart3 },
];

const buyerTypes = [
  {
    title: "Private Label Buyers",
    description: "Get custom products made by verified Indian manufacturers with your branding",
    icon: Factory,
    features: ["Custom Manufacturing", "Quality Control", "Brand Development", "Low MOQs"],
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "E-commerce Sellers",
    description: "Source white-label goods fast, with competitive pricing and low minimum orders",
    icon: ShoppingCart,
    features: ["Fast Sourcing", "White-label Ready", "Competitive Prices", "Quick Delivery"],
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Procurement Managers",
    description: "Raise bulk RFQs, manage multiple suppliers efficiently with enterprise tools",
    icon: Building2,
    features: ["Bulk Orders", "Supplier Management", "RFQ System", "Compliance Tools"],
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Foreign Buyers",
    description: "Trusted sourcing from India with dedicated concierge support and guidance",
    icon: Globe,
    features: ["Cultural Bridge", "Export Assistance", "Quality Assurance", "End-to-end Support"],
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
];

const Buyer = () => {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);

  useSEO({
    title: "B2B Buyer Portal - Post 1 RFQ, Get 3+ Sealed Bids in 48hrs | Free",
    description: "Stop cold calling suppliers! Post your RFQ once, get 3+ competitive sealed bids from verified Indian manufacturers. Zero commission. 5000+ buyers trust us.",
    keywords: "B2B sourcing, verified suppliers India, bulk procurement, RFQ platform, supplier network, wholesale buying, procurement portal, sealed bidding, transparent pricing",
    canonical: "https://procuresaathi.com/buyer",
    ogImage: "/og-early-adopter.png"
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "B2B Buyer Portal - ProcureSaathi",
      "description": "Post RFQs and receive competitive sealed bids from verified suppliers across 23+ categories.",
      "url": "https://procuresaathi.com/buyer",
      "mainEntity": {
        "@type": "Service",
        "name": "B2B Procurement Platform",
        "provider": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "serviceType": "B2B Procurement",
        "areaServed": "Worldwide"
      }
    }, "buyer-page-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Buyer Portal", url: "https://procuresaathi.com/buyer" }
    ]), "buyer-breadcrumb-schema");
  }, []);

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/918368127357?text=Hi, I need help posting my RFQ on ProcureSaathi", "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
        {/* Background Image with eager loading */}
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
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">TRANSPARENT B2B BIDDING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              Post Your RFQ. Get Competitive Bids from{" "}
              <span className="text-primary">Verified Suppliers.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up delay-100">
              Run transparent B2B bidding for raw materials, components, and services—without middlemen or long negotiations.
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 animate-slide-up delay-200">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Verified suppliers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Assisted RFQ posting</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>No commission for buyers</span>
              </div>
            </div>
            
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
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="group border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="section-title font-display text-center mb-10">
              Built for Buyers Who
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyerBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="group flex items-center gap-4 p-5 bg-card rounded-2xl border border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">
              How ProcureSaathi Works for Buyers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border/50" />
                )}
                <Card className="group relative border-border/50 text-center h-full hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="relative inline-block mb-6">
                      <div className={`w-20 h-20 rounded-2xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon className={`h-10 w-10 ${item.iconColor}`} />
                      </div>
                      <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-12 text-lg">
            You remain in <strong className="text-foreground">full control</strong> at every step.
          </p>
        </div>
      </section>

      {/* Buyer Advantages */}
      <section className="section-padding bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">
              Why Buyers Trust ProcureSaathi
            </h2>
            <p className="section-subtitle">Buyer Advantages</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {buyerAdvantages.map((advantage) => (
              <Card 
                key={advantage.title} 
                className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <advantage.icon className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="font-display font-semibold">{advantage.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every B2B Buyer */}
      <section className="section-padding bg-muted/20">
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

      {/* Early Buyer Benefit */}
      <section className="section-padding bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">LIMITED TIME OFFER</span>
            </div>
            <h2 className="section-title font-display">
              Limited Early Access for Buyers
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Post RFQs free during the early onboarding phase.
            </p>
            <Button 
              size="lg" 
              className="h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
              onClick={() => navigate('/signup?role=buyer')}
            >
              <span className="mr-2">🟢</span>
              Post Your First RFQ Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Verified suppliers only • Buyer details not shared</p>
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

      {/* Final CTA Section */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <BadgeCheck className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Discover Better Prices?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Post your RFQ and let verified suppliers compete.
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
                No obligation to award • Buyer details are not shared with suppliers • Verified suppliers only
              </p>
            </div>
          </div>
        </div>
      </section>

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
