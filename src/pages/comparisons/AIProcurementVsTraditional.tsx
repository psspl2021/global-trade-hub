import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Clock,
  Brain
} from "lucide-react";

const comparisonPoints = [
  {
    aspect: "RFQ Creation",
    traditional: "Manual, time-consuming, requires procurement expertise",
    ai: "AI-assisted, structured automatically, 5 minutes or less",
    advantage: "ai"
  },
  {
    aspect: "Supplier Discovery",
    traditional: "Manual search, cold calling, limited visibility",
    ai: "AI-powered matching based on category, capacity, performance",
    advantage: "ai"
  },
  {
    aspect: "Bidding Process",
    traditional: "Email-based, unstructured, potential for manipulation",
    ai: "Sealed bidding, transparent, audit-ready",
    advantage: "ai"
  },
  {
    aspect: "Supplier Verification",
    traditional: "Manual due diligence, inconsistent standards",
    ai: "Pre-verified suppliers with documentation and performance history",
    advantage: "ai"
  },
  {
    aspect: "Price Comparison",
    traditional: "Spreadsheet-based, manual analysis",
    ai: "Automated comparison with line-item breakdown",
    advantage: "ai"
  },
  {
    aspect: "Cycle Time",
    traditional: "Weeks to months",
    ai: "24-48 hours for quotes, days for execution",
    advantage: "ai"
  },
  {
    aspect: "Documentation",
    traditional: "Scattered across emails and files",
    ai: "Centralized, audit-ready, compliance-friendly",
    advantage: "ai"
  },
  {
    aspect: "Risk Management",
    traditional: "Reactive, based on past failures",
    ai: "Proactive, AI-scored supplier risk assessment",
    advantage: "ai"
  },
];

const AIProcurementVsTraditional = () => {
  const navigate = useNavigate();

  useSEO({
    title: "AI Procurement Software vs Traditional RFQ | Comparison | ProcureSaathi",
    description: "Compare AI procurement software with traditional RFQ methods. Learn how AI-powered platforms like ProcureSaathi improve sourcing efficiency and transparency.",
    keywords: "AI procurement vs traditional, RFQ software comparison, AI sourcing, procurement automation",
    canonical: "https://procuresaathi.com/ai-procurement-vs-traditional-rfq",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "AI Procurement Software vs Traditional RFQ Methods",
      "description": "Comprehensive comparison of AI-powered procurement platforms versus traditional RFQ methods.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-01-26"
    }, "ai-vs-traditional-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Comparisons", url: "https://procuresaathi.com/comparisons" },
      { name: "AI vs Traditional Procurement", url: "https://procuresaathi.com/ai-procurement-vs-traditional-rfq" },
    ]), "ai-vs-traditional-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the difference between AI procurement and traditional RFQ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI procurement uses artificial intelligence for automated RFQ creation, intelligent supplier matching, and transparent sealed bidding. Traditional RFQ relies on manual processes, email-based communication, and spreadsheet analysis. AI procurement platforms like ProcureSaathi reduce cycle times from weeks to hours."
          }
        },
        {
          "@type": "Question",
          "name": "Is AI procurement better than traditional methods?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI procurement offers significant advantages including faster cycle times, automated supplier discovery, transparent bidding, and reduced manual effort. Platforms like ProcureSaathi combine AI efficiency with verified supplier networks for better procurement outcomes."
          }
        }
      ]
    }, "ai-vs-traditional-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">COMPARISON GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              AI Procurement Software vs Traditional RFQ
            </h1>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Side-by-Side Comparison
          </h2>
          
          <div className="max-w-5xl mx-auto space-y-4">
            {comparisonPoints.map((point, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <h3 className="font-display font-semibold text-lg">{point.aspect}</h3>
                    </div>
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Traditional</span>
                        <p className="text-sm">{point.traditional}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-primary block mb-1">AI-Powered</span>
                        <p className="text-sm">{point.ai}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Why AI Procurement Wins
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">60% Faster</h3>
                <p className="text-sm text-muted-foreground">Procurement cycle reduction with automated processes</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">24-48 Hours</h3>
                <p className="text-sm text-muted-foreground">Quote turnaround vs weeks with traditional methods</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 text-center">
              <CardContent className="p-6">
                <Brain className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">AI-Matched</h3>
                <p className="text-sm text-muted-foreground">Intelligent supplier selection based on performance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Experience AI-Powered Procurement
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            See how ProcureSaathi transforms your procurement process with AI.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/post-rfq')}
          >
            Try AI RFQ – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIProcurementVsTraditional;
