import { useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { AEOFAQSection, AILinkingSection } from "@/components/seo";
import heroBgSeller from "@/assets/hero-bg-seller.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import { 
  ArrowRight, 
  Users, 
  Globe, 
  ArrowLeftRight, 
  Network,
  Package,
  FileText,
  Sparkles,
  Truck,
  Shield,
  BarChart3,
  CheckCircle2,
  Star,
  TrendingUp,
  Zap
} from "lucide-react";

const stats = [
  { value: "500+", label: "Businesses", icon: Users },
  { value: "50+", label: "Countries", icon: Globe },
  { value: "1000+", label: "Transactions", icon: ArrowLeftRight },
  { value: "10K+", label: "Connections", icon: Network },
];

const benefits = [
  { title: "One Listing, Many Marketplaces", icon: Package },
  { title: "B2B Feature Catalogue", icon: FileText },
  { title: "AI-Powered Product Descriptions", icon: Sparkles },
  { title: "Integrated Logistics Support", icon: Truck },
  { title: "Secure Payment Processing", icon: Shield },
  { title: "Analytics & Insights Dashboard", icon: BarChart3 },
];

const howItWorks = [
  {
    step: 1,
    title: "Create Your Profile",
    description: "Sign up and complete your business profile with company details and certifications.",
    icon: Users,
  },
  {
    step: 2,
    title: "List Your Products",
    description: "Add your products with AI-powered descriptions, specifications, and competitive pricing.",
    icon: Package,
  },
  {
    step: 3,
    title: "Receive Buyer Inquiries",
    description: "Get matched with verified buyers looking for your products from across the globe.",
    icon: FileText,
  },
  {
    step: 4,
    title: "Close Deals & Grow",
    description: "Negotiate, finalize orders, and build long-term business relationships.",
    icon: TrendingUp,
  },
];

const features = [
  {
    title: "Global Reach",
    description: "Connect with buyers from 50+ countries and expand your business internationally.",
    icon: Globe,
  },
  {
    title: "Verified Buyers",
    description: "All buyers are verified to ensure genuine business inquiries and reduce fraud.",
    icon: CheckCircle2,
  },
  {
    title: "AI-Powered Tools",
    description: "Leverage AI for product descriptions, pricing recommendations, and market insights.",
    icon: Sparkles,
  },
  {
    title: "Zero Commission",
    description: "List your products for free. Pay only a small service fee when you close a deal.",
    icon: Star,
  },
  {
    title: "Logistics Support",
    description: "Integrated shipping and logistics partners to help you deliver worldwide.",
    icon: Truck,
  },
  {
    title: "Real-time Analytics",
    description: "Track views, inquiries, and conversions with detailed analytics dashboard.",
    icon: BarChart3,
  },
];

const Seller = () => {
  const navigate = useNavigate();

  // SEO optimization
  useSEO({
    title: "Sell to 500+ Verified Buyers | Zero Listing Fees | ProcureSaathi Supplier Portal",
    description: "Get genuine buyer leads daily. Zero listing fees, pay only on deals. Free GST invoicing + CRM. Join 1000+ suppliers growing 40% faster. Start in 5 mins.",
    canonical: "https://procuresaathi.com/seller",
    keywords: "B2B supplier portal, sell products online, export platform India, verified buyers, global marketplace, supplier leads, wholesale selling"
  });

  useEffect(() => {
    // Inject structured data
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Sell on ProcureSaathi - B2B Supplier Portal",
      "description": "List products, reach 500+ verified buyers in 50+ countries. Zero commission, AI-powered tools.",
      "url": "https://procuresaathi.com/seller"
    }, 'seller-webpage-schema');
    
    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Seller", url: "https://procuresaathi.com/seller" }
    ]), 'seller-breadcrumb-schema');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
        {/* Background Image with eager loading */}
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
              <Sparkles className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">ALL-IN-ONE PLATFORM</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up">
              World of Opportunities on a{" "}
              <span className="text-primary">Single Platform</span>
            </h1>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up delay-100">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Sign Up For Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="link" 
                className="text-primary text-lg font-medium"
                onClick={() => navigate('/login')}
              >
                Already a Seller? Sign In
              </Button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="group border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
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

      {/* Why Sell Section */}
      <section className="section-padding bg-gradient-to-br from-warning/5 via-warning/10 to-warning/5">
        <div className="container mx-auto px-4">
          <h2 className="section-title font-display text-center mb-12">
            Why Sell on ProcureSaathi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
            {benefits.map((benefit) => (
              <div 
                key={benefit.title} 
                className="group flex items-center gap-4 p-5 bg-card rounded-2xl border border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-4 h-4 rounded-full bg-warning flex-shrink-0 group-hover:scale-125 transition-transform" />
                <span className="font-medium">{benefit.title}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="h-14 px-12 text-lg font-semibold bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              onClick={() => navigate('/signup?role=supplier')}
            >
              Start Selling Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">How It Works</h2>
            <p className="section-subtitle">
              Get started in minutes and start receiving inquiries from global buyers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((item) => (
              <Card key={item.step} className="group relative border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform shadow-md">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="section-title font-display">
              Everything You Need to <span className="text-primary">Succeed</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools and features designed to help you grow your export business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Free CRM Section */}
      <FreeCRMSection role="supplier" />

      {/* CTA Section */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Join thousands of suppliers already selling on ProcureSaathi. 
              Start for free and scale globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Get Started Free
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

      {/* AEO FAQ Section */}
      <AEOFAQSection 
        schemaId="seller-aeo-faq"
        additionalFAQs={[
          {
            question: "How do suppliers get buyer leads on ProcureSaathi?",
            answer: "Verified suppliers receive RFQ notifications matching their category and capacity. They can submit sealed bids on relevant requirements. The AI matches suppliers with buyers based on capabilities, past performance, and pricing competitiveness."
          },
          {
            question: "What are the fees for suppliers on ProcureSaathi?",
            answer: "Listing products and browsing requirements is free. Suppliers pay a small service fee only when a deal is successfully closed. This ensures suppliers pay for results, not listings."
          }
        ]}
      />

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
