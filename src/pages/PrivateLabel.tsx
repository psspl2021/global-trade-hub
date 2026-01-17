import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import heroBgPrivateLabel from "@/assets/hero-bg-private-label.jpg";
import { 
  ArrowRight, 
  Factory,
  Shield,
  Zap,
  Clock,
  Layers,
  UserCheck,
  CheckCircle,
  MessageSquare,
  Package,
  Globe,
  FileCheck
} from "lucide-react";

const stats = [
  { value: "1000+", label: "Verified Manufacturers", icon: Factory },
  { value: "50+", label: "Product Categories", icon: Package },
  { value: "100+", label: "Countries Served", icon: Globe },
  { value: "48hrs", label: "Sample Delivery", icon: Clock },
];

const features = [
  {
    icon: Factory,
    title: "Private Label & Custom Manufacturing",
    description: "Source supplements, skincare, wellness, and more—tailored to your formulation, branding, and MOQ needs"
  },
  {
    icon: Shield,
    title: "Verified Supplier Network",
    description: "Work only with pre-screened Indian manufacturers meeting international quality and compliance standards"
  },
  {
    icon: Zap,
    title: "Smart Vendor Matching",
    description: "We shortlist partners based on your exact brief, saving you weeks of searching"
  },
  {
    icon: Clock,
    title: "Faster Time to Market",
    description: "Cut back-and-forth delays and move from idea to ready-to-ship products quicker"
  },
  {
    icon: Layers,
    title: "End-to-End Coordination",
    description: "From sampling to bulk production, we manage the entire process for you"
  },
  {
    icon: UserCheck,
    title: "One Platform, Multiple Categories",
    description: "Explore products, packaging, and accessories without switching between multiple platforms"
  }
];

const conciergeServices = [
  { title: "Understanding your specs & product goals", icon: FileCheck },
  { title: "Shortlisting vetted, relevant manufacturers", icon: Factory },
  { title: "Coordinating meetings, calls, or site visits", icon: MessageSquare },
  { title: "Guiding certification & compliance needs", icon: Shield },
];

const categories = [
  "Supplements & Nutraceuticals",
  "Skincare & Cosmetics",
  "Hair Care Products",
  "Wellness & Ayurveda",
  "Food & Beverages",
  "Pet Care Products",
  "Home Care Products",
  "Baby Care Products"
];

const howItWorks = [
  {
    step: 1,
    title: "Share Your Requirements",
    description: "Tell us about your product idea, specifications, and target market.",
    icon: FileCheck,
  },
  {
    step: 2,
    title: "Get Matched",
    description: "Our team shortlists verified manufacturers matching your needs.",
    icon: Zap,
  },
  {
    step: 3,
    title: "Request Samples",
    description: "Order samples from selected manufacturers for quality evaluation.",
    icon: Package,
  },
  {
    step: 4,
    title: "Start Production",
    description: "Finalize terms and begin production with full support.",
    icon: Factory,
  },
];

const PrivateLabel = () => {
  const navigate = useNavigate();

  // SEO optimization
  useSEO({
    title: "Private Label Manufacturing India | Custom Products | ProcureSaathi",
    description: "Source private label products from 1000+ verified Indian manufacturers. Custom manufacturing for supplements, skincare, cosmetics, Ayurveda & more. Low MOQ, fast samples.",
    canonical: "https://procuresaathi.com/private-label",
    keywords: "private label manufacturing India, custom manufacturing, OEM India, contract manufacturing, white label products, bulk supply, private label supplements, private label cosmetics, skincare manufacturer India"
  });

  useEffect(() => {
    // WebPage schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Private Label Manufacturing India | Custom Products",
      "description": "Source private label products from 1000+ verified Indian manufacturers. Custom manufacturing for supplements, skincare, cosmetics & more.",
      "url": "https://procuresaathi.com/private-label",
      "mainEntity": {
        "@type": "Service",
        "name": "Private Label Manufacturing Services",
        "provider": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "serviceType": "Private Label Manufacturing",
        "areaServed": "Worldwide",
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": "https://procuresaathi.com/private-label"
        }
      }
    }, 'private-label-webpage-schema');

    // Breadcrumb schema
    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Private Label", url: "https://procuresaathi.com/private-label" }
    ]), 'private-label-breadcrumb-schema');

    // Service schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Private Label & Custom Manufacturing",
      "description": "End-to-end private label manufacturing services from India. Connect with verified manufacturers for supplements, skincare, cosmetics, wellness products and more.",
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://procuresaathi.com"
      },
      "serviceType": ["Private Label Manufacturing", "Custom Manufacturing", "Contract Manufacturing", "OEM Manufacturing"],
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "20.5937",
          "longitude": "78.9629"
        },
        "geoRadius": "10000"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Private Label Categories",
        "itemListElement": categories.map((cat, index) => ({
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": cat
          },
          "position": index + 1
        }))
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "156",
        "bestRating": "5"
      }
    }, 'private-label-service-schema');

    // FAQ schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is private label manufacturing?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Private label manufacturing allows you to create products with your own brand name and packaging, manufactured by a third-party supplier. ProcureSaathi connects you with 1000+ verified Indian manufacturers for custom formulations."
          }
        },
        {
          "@type": "Question",
          "name": "What is the minimum order quantity (MOQ) for private label products?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "MOQ varies by product category and manufacturer. Many of our verified suppliers offer low MOQs starting from 100-500 units for startups and small businesses. Contact our concierge team for specific requirements."
          }
        },
        {
          "@type": "Question",
          "name": "Which product categories are available for private labeling?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer private label manufacturing for Supplements & Nutraceuticals, Skincare & Cosmetics, Hair Care, Wellness & Ayurveda, Food & Beverages, Pet Care, Home Care, and Baby Care products."
          }
        },
        {
          "@type": "Question",
          "name": "How long does it take to get samples?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most of our verified manufacturers can deliver product samples within 48 hours for standard formulations. Custom formulations may take 7-14 days depending on complexity."
          }
        },
        {
          "@type": "Question",
          "name": "Do you help with product certifications and compliance?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our white-glove concierge service includes guidance on certifications like FDA, GMP, ISO, FSSAI, and other compliance requirements for your target markets."
          }
        }
      ]
    }, 'private-label-faq-schema');

    // HowTo schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Source Private Label Products from India",
      "description": "Step-by-step guide to sourcing custom manufactured products from verified Indian manufacturers",
      "step": howItWorks.map((item) => ({
        "@type": "HowToStep",
        "position": item.step,
        "name": item.title,
        "text": item.description
      }))
    }, 'private-label-howto-schema');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* Hero Section */}
      <section 
        className="relative py-16 md:py-24 lg:py-28 overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Background Image with eager loading */}
        <img 
          src={heroBgPrivateLabel}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
        <div className="container mx-auto px-4 relative z-10">
          <header className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-semibold animate-fade-in">
              🏭 1000+ Verified Manufacturers
            </Badge>
            
            <h1 
              id="hero-heading"
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-bold mb-6 animate-slide-up"
            >
              Source Private Label Products{" "}
              <span className="text-primary">Direct from India</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up delay-100">
              From supplements to skincare, ProcureSaathi makes sourcing simple, smart, 
              and supported—powered by AI and backed by human expertise
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 gradient-primary"
                onClick={() => navigate('/signup?role=buyer')}
                aria-label="Start sourcing private label products"
              >
                Start Sourcing
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-10 text-lg font-medium bg-card/80 backdrop-blur-sm hover:bg-card border-border/80 hover:border-primary/50 transition-all"
                onClick={() => navigate('/login')}
                aria-label="Talk to sourcing concierge"
              >
                <MessageSquare className="mr-2 h-5 w-5" aria-hidden="true" />
                Talk to Concierge
              </Button>
            </div>
          </header>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-4xl mx-auto" role="list" aria-label="Platform statistics">
            {stats.map((stat) => (
              <Card key={stat.label} className="group border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-large transition-all duration-300 hover:-translate-y-1" role="listitem">
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

      {/* Features Grid */}
      <section className="section-padding" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-14">
            <h2 id="features-heading" className="section-title font-display">
              Why Choose <span className="text-primary">Private Label</span> with Us
            </h2>
            <p className="section-subtitle">
              Everything you need to launch your own branded product line
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" role="list">
            {features.map((feature) => (
              <article key={feature.title} className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1 rounded-2xl bg-card" role="listitem">
                <div className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* White-Glove Concierge Section */}
      <section className="section-padding bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5" aria-labelledby="concierge-heading">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-3xl p-8 md:p-12 border border-border/50 shadow-large">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 id="concierge-heading" className="text-2xl md:text-3xl font-display font-bold mb-4">
                    White-Glove Concierge for Every Buyer
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our sourcing experts personally support you by:
                  </p>
                  <ul className="space-y-4" role="list">
                    {conciergeServices.map((service, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{service.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-muted/80 to-muted/50 rounded-2xl p-8 text-center mb-6 w-full max-w-xs border border-border/50">
                    <div className="text-5xl md:text-6xl font-display font-bold text-primary mb-2">85%</div>
                    <p className="text-muted-foreground font-medium">Matched in 5 days</p>
                  </div>
                  <Button 
                    size="lg"
                    className="w-full max-w-xs h-14 font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    onClick={() => navigate('/signup?role=buyer')}
                    aria-label="Get personalized sourcing support"
                  >
                    Get Personalized Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-padding" aria-labelledby="categories-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12">
            <h2 id="categories-heading" className="section-title font-display">
              Popular Private Label Categories
            </h2>
            <p className="section-subtitle">
              Explore products across diverse categories
            </p>
          </header>
          
          <nav className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto" aria-label="Product categories">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="px-5 py-2.5 text-sm font-medium cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                {category}
              </Badge>
            ))}
          </nav>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-muted/20" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-14">
            <h2 id="how-it-works-heading" className="section-title font-display">How It Works</h2>
            <p className="section-subtitle">
              From idea to finished product in 4 simple steps
            </p>
          </header>
          
          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto list-none">
            {howItWorks.map((item) => (
              <li key={item.step}>
                <article className="group relative border-border/50 rounded-2xl bg-card h-full hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="p-6">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform shadow-md">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Free CRM Section */}
      <FreeCRMSection role="buyer" />

      {/* CTA Section */}
      <section className="section-padding gradient-primary" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Factory className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Launch Your Brand?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Connect with verified manufacturers and bring your product vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/signup?role=buyer')}
                aria-label="Get started with private label manufacturing"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-10 text-lg font-medium bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-all"
                onClick={() => navigate('/categories')}
                aria-label="Explore product categories"
              >
                Explore Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Link */}
      <footer className="py-10 text-center bg-muted/20">
        <Button 
          variant="link" 
          className="text-muted-foreground font-medium"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </footer>
    </div>
  );
};

export default PrivateLabel;
