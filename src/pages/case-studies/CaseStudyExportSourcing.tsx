import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Globe,
  CheckCircle2,
  Sparkles,
  Clock,
  Users,
  Ship
} from "lucide-react";

const results = [
  { metric: "5", label: "Verified Suppliers", description: "Connected within 48 hours" },
  { metric: "48hrs", label: "Turnaround", description: "From RFQ to supplier quotes" },
  { metric: "3", label: "Countries", description: "Export-ready suppliers identified" },
  { metric: "100%", label: "Documentation", description: "Export compliance verified" },
];

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

const CaseStudyExportSourcing = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Case Study: How an Exporter Found 5 Verified Suppliers in 48 Hours | ProcureSaathi",
    description: "Learn how an exporter used ProcureSaathi to find 5 verified export-ready suppliers within 48 hours through AI-powered supplier discovery.",
    keywords: "export sourcing case study, find verified suppliers, exporter success story, B2B supplier discovery",
    canonical: "https://procuresaathi.com/case-study-export-sourcing",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "How an Exporter Found 5 Verified Suppliers in 48 Hours",
      "description": "Case study on how an exporter used AI-powered supplier discovery to find verified export-ready suppliers quickly.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01"
    }, "case-study-export-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Case Studies", url: "https://procuresaathi.com/case-studies" },
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
              <span className="text-sm font-semibold text-primary">CASE STUDY</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How an Exporter Found 5 Verified Suppliers in 48 Hours
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A textile exporter based in Delhi used <strong>ProcureSaathi</strong> to rapidly identify and connect 
              with verified export-ready suppliers for an urgent international order.
            </p>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Key Results Achieved
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {results.map((result) => (
              <Card key={result.label} className="border-border/50 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                    {result.metric}
                  </div>
                  <div className="font-semibold mb-1">{result.label}</div>
                  <div className="text-xs text-muted-foreground">{result.description}</div>
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
              <h2 className="text-xl md:text-2xl font-display font-bold mb-6">The Challenges</h2>
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
              <h2 className="text-xl md:text-2xl font-display font-bold mb-6">The ProcureSaathi Solution</h2>
              <div className="space-y-3">
                {solutions.map((solution, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{solution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-6xl text-primary/20 mb-4">"</div>
            <blockquote className="text-xl md:text-2xl font-display italic text-muted-foreground mb-6">
              We had an urgent export order and needed suppliers fast. ProcureSaathi's AI matched us with 
              5 verified suppliers who had the exact certifications we needed. What would have taken weeks 
              happened in 48 hours.
            </blockquote>
            <p className="text-sm text-muted-foreground">
              — Export Manager, Textile Trading Company, Delhi
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Find Verified Export Suppliers Fast
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Connect with export-ready suppliers through AI-powered discovery.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/post-rfq')}
          >
            Post Your RFQ – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudyExportSourcing;
