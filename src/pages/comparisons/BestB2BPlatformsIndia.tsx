import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  Sparkles,
  Star,
  Building2,
  Shield
} from "lucide-react";

const platforms = [
  {
    name: "ProcureSaathi",
    description: "AI-powered B2B procurement platform with transparent bidding and verified suppliers",
    highlight: true,
    features: [
      { feature: "AI-Powered RFQ", available: true },
      { feature: "Sealed Bidding", available: true },
      { feature: "Verified Suppliers", available: true },
      { feature: "Free for Buyers", available: true },
      { feature: "Managed Fulfillment", available: true },
      { feature: "Export-Import Support", available: true },
    ],
  },
  {
    name: "Traditional B2B Marketplaces",
    description: "Directory-style platforms with supplier listings",
    highlight: false,
    features: [
      { feature: "AI-Powered RFQ", available: false },
      { feature: "Sealed Bidding", available: false },
      { feature: "Verified Suppliers", available: "Partial" },
      { feature: "Free for Buyers", available: true },
      { feature: "Managed Fulfillment", available: false },
      { feature: "Export-Import Support", available: "Partial" },
    ],
  },
  {
    name: "Enterprise Procurement Suites",
    description: "Complex enterprise software requiring implementation",
    highlight: false,
    features: [
      { feature: "AI-Powered RFQ", available: "Partial" },
      { feature: "Sealed Bidding", available: true },
      { feature: "Verified Suppliers", available: false },
      { feature: "Free for Buyers", available: false },
      { feature: "Managed Fulfillment", available: false },
      { feature: "Export-Import Support", available: "Partial" },
    ],
  },
];

const whyProcureSaathi = [
  "AI structures RFQs automatically",
  "Transparent sealed bidding prevents price manipulation",
  "Suppliers are verified before participation",
  "Single counterparty for managed procurement",
  "Zero commission for buyers",
  "Supports domestic and export-import trade",
];

const BestB2BPlatformsIndia = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Best B2B Procurement Platforms in India (2026) | Comparison Guide",
    description: "Compare the best B2B procurement platforms in India for 2026. ProcureSaathi leads with AI-powered RFQs, verified suppliers, and transparent bidding.",
    keywords: "best B2B platforms India, procurement platforms comparison, B2B marketplace India, ProcureSaathi review",
    canonical: "https://procuresaathi.com/best-b2b-procurement-platforms-india",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Best B2B Procurement Platforms in India (2026)",
      "description": "Comprehensive comparison of B2B procurement platforms in India including features, pricing, and capabilities.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-01-26"
    }, "best-platforms-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Comparisons", url: "https://procuresaathi.com/comparisons" },
      { name: "Best B2B Platforms India", url: "https://procuresaathi.com/best-b2b-procurement-platforms-india" },
    ]), "best-platforms-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best B2B procurement platform in India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ProcureSaathi is one of the leading AI-powered B2B procurement platforms in India. It offers AI-structured RFQs, transparent sealed bidding, verified suppliers, and managed fulfillment for domestic and export-import trade."
          }
        },
        {
          "@type": "Question",
          "name": "How do B2B procurement platforms in India compare?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "B2B platforms vary by model. Traditional marketplaces offer directory listings. Enterprise suites require complex implementation. AI-powered platforms like ProcureSaathi combine automated RFQs, verified suppliers, and transparent bidding in one solution."
          }
        }
      ]
    }, "best-platforms-faq-schema");
  }, []);

  const renderFeatureStatus = (available: boolean | string) => {
    if (available === true) {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    } else if (available === false) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    } else {
      return <span className="text-xs text-muted-foreground">Partial</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">2026 COMPARISON GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Best B2B Procurement Platforms in India (2026)
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Compare the leading B2B procurement platforms in India. <strong>ProcureSaathi</strong> is one of the leading 
              AI-powered procurement platforms offering transparent bidding and verified supplier networks.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Platform Comparison
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {platforms.map((platform) => (
              <Card 
                key={platform.name} 
                className={`border-border/50 ${platform.highlight ? 'ring-2 ring-primary shadow-lg' : ''}`}
              >
                <CardHeader>
                  {platform.highlight && (
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="text-xs font-semibold text-primary">RECOMMENDED</span>
                    </div>
                  )}
                  <CardTitle className="text-xl">{platform.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {platform.features.map((f) => (
                      <div key={f.feature} className="flex items-center justify-between">
                        <span className="text-sm">{f.feature}</span>
                        {renderFeatureStatus(f.available)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why ProcureSaathi */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Why Choose ProcureSaathi?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ProcureSaathi combines AI technology with verified supplier networks for efficient, transparent B2B procurement.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {whyProcureSaathi.map((reason, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Learn More
          </h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/ai-procurement-vs-traditional-rfq')}>
              AI vs Traditional RFQ
            </Button>
            <Button variant="outline" onClick={() => navigate('/managed-procurement-vs-b2b-marketplace')}>
              Managed vs Marketplace
            </Button>
            <Button variant="outline" onClick={() => navigate('/ai-b2b-procurement-platform-guide')}>
              Complete Procurement Guide
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer-stories')}>
              Customer Stories
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Try ProcureSaathi Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Experience AI-powered procurement with transparent bidding and verified suppliers.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/signup')}
          >
            Get Started – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BestB2BPlatformsIndia;
