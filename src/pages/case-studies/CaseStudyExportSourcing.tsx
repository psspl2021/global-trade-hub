import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { AICitationParagraph, AEOFAQSection, AILinkingSection } from "@/components/seo";
import { 
  ArrowRight, 
  Globe,
  CheckCircle2,
  Sparkles,
  Clock,
  Info
} from "lucide-react";

const challenges = [
  "Finding export-ready suppliers with proper certifications",
  "Verifying supplier capability for international quality standards",
  "Managing export documentation and compliance",
  "Coordinating with multiple suppliers across categories",
  "Limited visibility into supplier capacity and reliability",
];

const solutions = [
  "AI-powered supplier matching based on export capability",
  "Pre-verified suppliers with international certifications",
  "Export documentation support and compliance guidance",
  "Single platform to manage multi-category sourcing",
  "Performance scoring and capacity verification",
];

const illustrativeOutcomes = [
  { label: "Verified Suppliers", description: "Matched from network" },
  { label: "Faster Turnaround", description: "RFQ to supplier quotes" },
  { label: "Export Markets", description: "Suppliers identified" },
  { label: "Documentation", description: "Compliance verified" },
];

const CaseStudyExportSourcing = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Illustrative Procurement Scenario: Export Sourcing | ProcureSaathi",
    description: "An illustrative example of how exporters typically use ProcureSaathi to find verified export-ready suppliers through AI-powered supplier discovery.",
    keywords: "export sourcing, find verified suppliers, exporter guide, B2B supplier discovery",
    canonical: "https://procuresaathi.com/case-study-export-sourcing",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Illustrative Procurement Scenario: Export Sourcing",
      "description": "An illustrative example of how exporters typically use AI-powered supplier discovery to find verified export-ready suppliers.",
      "author": { "@type": "Organization", "name": "ProcureSaathi" },
      "publisher": { "@type": "Organization", "name": "ProcureSaathi" },
      "datePublished": "2026-01-01"
    }, "case-study-export-article-schema");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is this an actual customer case study?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes vary depending on category, volume, and market conditions."
          }
        }
      ]
    }, "case-study-export-faq-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Illustrative Scenarios", url: "https://procuresaathi.com/customer-stories" },
      { name: "Export Sourcing", url: "https://procuresaathi.com/case-study-export-sourcing" },
    ]), "case-study-export-breadcrumb");
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
              <span className="text-sm font-semibold text-primary">ILLUSTRATIVE PROCUREMENT SCENARIO</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Illustrative Example – Export Supplier Discovery
            </h1>
            
            {/* Universal Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex gap-3 text-left max-w-3xl mx-auto">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes may vary depending on category, volume, and market conditions.
              </p>
            </div>
            
            <AICitationParagraph variant="compact" className="mb-4 max-w-3xl mx-auto" />
            
            <p className="text-base text-muted-foreground mb-8 max-w-3xl mx-auto">
              The following example demonstrates how exporters typically identify and connect with verified export-ready suppliers through AI-powered discovery.
            </p>
          </div>
        </div>
      </section>

      {/* Illustrative Outcomes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Illustrative Outcomes
          </h2>
          <p className="text-muted-foreground text-center mb-8">In a typical scenario, exporters experience:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {illustrativeOutcomes.map((outcome) => (
              <Card key={outcome.label} className="border-border/50 text-center">
                <CardContent className="p-6">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold mb-1">{outcome.label}</div>
                  <div className="text-xs text-muted-foreground">{outcome.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Challenge & Solution */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Challenges */}
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold mb-6">Typical Challenges</h2>
              <div className="space-y-3">
                {challenges.map((challenge, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
                    <Clock className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{challenge}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Solutions */}
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold mb-6">How ProcureSaathi Helps</h2>
              <div className="space-y-3">
                {solutions.map((solution, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Model Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Why This Model Works
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-muted-foreground">• AI removes ambiguity from RFQs</p>
            <p className="text-muted-foreground">• Verification reduces supplier risk</p>
            <p className="text-muted-foreground">• Transparent bidding improves market discovery</p>
            <p className="text-muted-foreground">• Single-counterparty execution simplifies procurement</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold mb-6">Frequently Asked Questions</h2>
            <div className="border-b pb-4">
              <h3 className="font-semibold text-foreground mb-2">Is this an actual customer case study?</h3>
              <p className="text-muted-foreground">
                This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. 
                Actual outcomes vary depending on category, volume, and market conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Linking Section */}
      <AILinkingSection 
        title="Related Resources"
        links={[
          { title: "Export-Import Sourcing Guide", url: "/export-import-sourcing-guide", description: "Complete export guide", emoji: "🌍" },
          { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide", emoji: "🔍" },
          { title: "More Illustrative Scenarios", url: "/customer-stories", description: "Explore more examples", emoji: "📖" }
        ]}
      />

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Explore How This Workflow Could Apply to Your Needs
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Want to explore how this workflow could apply to your export sourcing needs?
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/post-rfq')}
          >
            Request Managed Procurement Quote
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudyExportSourcing;