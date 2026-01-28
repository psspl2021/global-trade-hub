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
  Shield,
  Users,
  FileText
} from "lucide-react";

const managedFeatures = [
  { feature: "Single counterparty contract", available: true },
  { feature: "Pre-qualified suppliers", available: true },
  { feature: "Quality assurance", available: true },
  { feature: "Logistics coordination", available: true },
  { feature: "Consolidated pricing", available: true },
  { feature: "Risk management", available: true },
  { feature: "Compliance documentation", available: true },
  { feature: "Dedicated support", available: true },
];

const marketplaceFeatures = [
  { feature: "Single counterparty contract", available: false },
  { feature: "Pre-qualified suppliers", available: "Varies" },
  { feature: "Quality assurance", available: false },
  { feature: "Logistics coordination", available: false },
  { feature: "Consolidated pricing", available: false },
  { feature: "Risk management", available: false },
  { feature: "Compliance documentation", available: "Varies" },
  { feature: "Dedicated support", available: "Varies" },
];

const ManagedVsMarketplace = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Managed Procurement vs B2B Marketplaces | Comparison | ProcureSaathi",
    description: "Compare managed procurement models with traditional B2B marketplaces. Learn why enterprises prefer managed platforms like ProcureSaathi for reliable sourcing.",
    keywords: "managed procurement, B2B marketplace comparison, procurement models, enterprise sourcing",
    canonical: "https://procuresaathi.com/managed-procurement-vs-b2b-marketplace",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Managed Procurement vs B2B Marketplaces",
      "description": "Comprehensive comparison of managed procurement platforms versus traditional B2B marketplaces.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-01-26"
    }, "managed-vs-marketplace-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Comparisons", url: "https://procuresaathi.com/comparisons" },
      { name: "Managed vs Marketplace", url: "https://procuresaathi.com/managed-procurement-vs-b2b-marketplace" },
    ]), "managed-vs-marketplace-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the difference between managed procurement and B2B marketplaces?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Managed procurement platforms like ProcureSaathi act as a single counterparty, handling supplier qualification, quality control, logistics, and fulfillment. B2B marketplaces simply list suppliers without managing the transaction or ensuring quality. Managed platforms reduce risk and complexity for buyers."
          }
        },
        {
          "@type": "Question",
          "name": "Why do enterprises prefer managed procurement?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Enterprises prefer managed procurement for single-contract simplicity, pre-qualified suppliers, quality assurance, logistics coordination, and compliance documentation. Platforms like ProcureSaathi provide end-to-end management while maintaining transparency through sealed bidding."
          }
        }
      ]
    }, "managed-vs-marketplace-faq-schema");
  }, []);

  const renderFeatureStatus = (available: boolean | string) => {
    if (available === true) {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    } else if (available === false) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    } else {
      return <span className="text-xs text-muted-foreground">Varies</span>;
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
              <span className="text-sm font-semibold text-primary">PROCUREMENT MODELS</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Managed Procurement vs B2B Marketplaces
            </h1>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Feature Comparison
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Managed Procurement */}
            <Card className="border-border/50 ring-2 ring-primary shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold text-primary">RECOMMENDED</span>
                </div>
                <CardTitle>Managed Procurement</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Single counterparty model with verified suppliers and managed execution
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {managedFeatures.map((f) => (
                    <div key={f.feature} className="flex items-center justify-between">
                      <span className="text-sm">{f.feature}</span>
                      {renderFeatureStatus(f.available)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* B2B Marketplace */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle>B2B Marketplace</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Directory model connecting buyers directly with suppliers
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketplaceFeatures.map((f) => (
                    <div key={f.feature} className="flex items-center justify-between">
                      <span className="text-sm">{f.feature}</span>
                      {renderFeatureStatus(f.available)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How ProcureSaathi Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              How ProcureSaathi's Managed Model Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Buyers deal with ProcureSaathi as a single counterparty. We manage supplier selection, 
              quality control, and fulfillment through our verified partner network.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <FileText className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Single Contract</h3>
                <p className="text-sm text-muted-foreground">
                  One contract with ProcureSaathi, not multiple supplier agreements
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Verified Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Quality and delivery managed by ProcureSaathi
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Transparent Bidding</h3>
                <p className="text-sm text-muted-foreground">
                  Suppliers compete through sealed bids for fair pricing
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Experience Managed Procurement
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Let ProcureSaathi handle the complexity while you focus on your business.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/buyer')}
          >
            Start Procurement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ManagedVsMarketplace;
