import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PostRFQModal } from "@/components/PostRFQModal";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
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
    title: "B2B Buyer Portal - Post RFQ, Get Competitive Bids",
    description: "Post RFQs free, get sealed bids from 1000+ verified suppliers. Transparent B2B bidding for raw materials & components. No commission for buyers.",
    keywords: "B2B sourcing, verified suppliers India, bulk procurement, RFQ platform, supplier network, wholesale buying, procurement portal",
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
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/80 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">TRANSPARENT B2B BIDDING</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Post Your RFQ. Get Competitive Bids from{" "}
              <span className="text-primary">Verified Suppliers.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Run transparent B2B bidding for raw materials, components, and services—without middlemen or long negotiations.
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Verified suppliers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Assisted RFQ posting</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>No commission for buyers</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex flex-col items-center">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg"
                  onClick={() => setShowRFQModal(true)}
                >
                  <span className="mr-2 inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  Post RFQ – Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <span className="text-xs text-muted-foreground mt-2">No obligation to award</span>
              </div>
              <div className="flex flex-col items-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-14 px-8 text-lg"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="border border-border bg-card">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Built for Buyers Who
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
              {buyerBenefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-5 bg-card rounded-xl border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ProcureSaathi Works for Buyers
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <Card className="relative border border-border text-center h-full">
                  <CardContent className="p-8">
                    <div className="relative inline-block mb-6">
                      <div className={`w-20 h-20 rounded-2xl ${item.iconBg} flex items-center justify-center`}>
                        <item.icon className={`h-10 w-10 ${item.iconColor}`} />
                      </div>
                      <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-10 text-lg">
            You remain in <strong className="text-foreground">full control</strong> at every step.
          </p>
        </div>
      </section>

      {/* Buyer Advantages */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Buyers Trust ProcureSaathi
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Buyer Advantages
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {buyerAdvantages.map((advantage) => (
              <Card 
                key={advantage.title} 
                className="border border-border hover:shadow-lg transition-all"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <advantage.icon className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="font-semibold">{advantage.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every B2B Buyer */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Every B2B Buyer
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {buyerTypes.map((type) => (
              <Card 
                key={type.title}
                className="bg-card border border-border hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${type.iconBg} flex items-center justify-center mb-4`}>
                    <type.icon className={`h-7 w-7 ${type.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature) => (
                      <span 
                        key={feature} 
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
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
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">LIMITED TIME OFFER</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Limited Early Access for Buyers
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Post RFQs free during the early onboarding phase.
            </p>
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg"
              onClick={() => navigate('/signup?role=buyer')}
            >
              <span className="mr-2">🟢</span>
              Post Your First RFQ Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Verified suppliers only • Buyer details not shared</p>
          </div>
        </div>
      </section>

      {/* Need Help Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-8 md:p-12 text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Need Help Posting Your RFQ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Our team can assist you via WhatsApp or call and post it on your behalf.
              </p>
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg"
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
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <BadgeCheck className="h-12 w-12 text-primary-foreground mx-auto mb-6" aria-hidden="true" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Discover Better Prices?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Post your RFQ and let verified suppliers compete.
            </p>
            <div className="flex flex-col items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-10 text-lg"
                onClick={() => navigate('/signup?role=buyer')}
              >
                <span className="mr-2">🟢</span>
                Post RFQ – Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-primary-foreground/70 mt-3">
                No obligation to award • Buyer details are not shared with suppliers • Verified suppliers only
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Link */}
      <section className="py-8 text-center">
        <Button 
          variant="link" 
          className="text-muted-foreground"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </section>

      {/* Post RFQ Modal */}
      <PostRFQModal open={showRFQModal} onOpenChange={setShowRFQModal} />
    </div>
  );
};

export default Buyer;
