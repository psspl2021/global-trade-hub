import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  TrendingDown,
  CheckCircle2,
  Sparkles,
  Building2,
  Clock,
  Shield
} from "lucide-react";

const results = [
  { metric: "20%", label: "Cost Reduction", description: "Achieved through competitive sealed bidding" },
  { metric: "48hrs", label: "Quote Time", description: "From RFQ posting to supplier quotes" },
  { metric: "5", label: "Verified Suppliers", description: "Average bids received per RFQ" },
  { metric: "100%", label: "Transparency", description: "Full visibility into pricing and terms" },
];

const challenges = [
  "Manual RFQ process taking 2-3 weeks per procurement cycle",
  "Limited visibility into supplier pricing and market rates",
  "Inconsistent supplier quality and delivery performance",
  "Spreadsheet-based bid comparison with high error rates",
  "No audit trail for procurement decisions",
];

const solutions = [
  "AI-powered RFQ creation in under 10 minutes",
  "Sealed competitive bidding from verified suppliers",
  "Supplier performance tracking and quality scoring",
  "Automated bid comparison with line-item analysis",
  "Complete audit trail for compliance requirements",
];

const CaseStudyProcurementCost = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Case Study: How an MSME Reduced Procurement Cost by 20% | ProcureSaathi",
    description: "Learn how an Indian MSME reduced procurement costs by 20% using ProcureSaathi's AI-powered RFQ platform and transparent sealed bidding.",
    keywords: "procurement cost reduction, MSME case study, B2B procurement success, cost savings procurement",
    canonical: "https://procuresaathi.com/case-study-procurement-cost-reduction",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "How an MSME Reduced Procurement Cost by 20%",
      "description": "Case study on how an Indian MSME achieved 20% procurement cost reduction using AI-powered RFQ and transparent bidding.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01"
    }, "case-study-cost-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Case Studies", url: "https://procuresaathi.com/case-studies" },
      { name: "Procurement Cost Reduction", url: "https://procuresaathi.com/case-study-procurement-cost-reduction" },
    ]), "case-study-cost-breadcrumb");
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
              How an MSME Reduced Procurement Cost by 20%
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A manufacturing MSME in Gujarat used <strong>ProcureSaathi</strong> to transform their procurement process, 
              achieving significant cost savings through AI-powered RFQs and transparent bidding.
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
              ProcureSaathi transformed how we source materials. The transparent bidding process helped us 
              discover competitive suppliers we didn't know existed, resulting in 20% cost savings on our 
              regular procurement.
            </blockquote>
            <p className="text-sm text-muted-foreground">
              — Procurement Manager, Manufacturing MSME, Gujarat
            </p>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            More Resources
          </h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/case-study-export-sourcing')}>
              Export Sourcing Case Study
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer-stories')}>
              All Customer Stories
            </Button>
            <Button variant="outline" onClick={() => navigate('/ai-helps-msmes-enterprise-supply-chains')}>
              How AI Helps MSMEs
            </Button>
            <Button variant="outline" onClick={() => navigate('/ai-b2b-procurement-platform-guide')}>
              Complete Procurement Guide
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <TrendingDown className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Ready to Reduce Your Procurement Costs?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join MSMEs and enterprises saving on procurement through transparent bidding.
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

export default CaseStudyProcurementCost;
