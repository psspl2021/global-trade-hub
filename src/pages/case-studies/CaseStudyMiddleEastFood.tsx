import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, XCircle, Info } from "lucide-react";

const CaseStudyMiddleEastFood = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Illustrative Procurement Scenario: Middle East Food Import from India",
    "description": "An illustrative example of how Middle East food importers typically use ProcureSaathi's managed export procurement platform for sourcing pulses and spices from India.",
    "author": { "@type": "Organization", "name": "ProcureSaathi" },
    "publisher": { "@type": "Organization", "name": "ProcureSaathi", "url": "https://www.procuresaathi.com" },
    "datePublished": "2025-01-01",
    "dateModified": "2026-01-28"
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How Middle East Buyers Source Food from India Using ProcureSaathi",
    "description": "Step-by-step managed export procurement process for Middle East food importers.",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Post Requirement", "text": "Buyer posts requirement via ProcureSaathi with quality & compliance parameters." },
      { "@type": "HowToStep", "position": 2, "name": "AI Matching", "text": "AI matches verified food exporters from India." },
      { "@type": "HowToStep", "position": 3, "name": "Sealed Bidding", "text": "Competitive sealed bidding completed." },
      { "@type": "HowToStep", "position": 4, "name": "Quality & Compliance", "text": "Quality inspection + export compliance verified." },
      { "@type": "HowToStep", "position": 5, "name": "Managed Fulfillment", "text": "Single shipment executed with full documentation." }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this an actual customer case study?",
        "acceptedAnswer": { "@type": "Answer", "text": "This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes vary depending on category, volume, and market conditions." }
      },
      {
        "@type": "Question",
        "name": "How can Middle East buyers source food products from India safely?",
        "acceptedAnswer": { "@type": "Answer", "text": "By using a managed procurement platform like ProcureSaathi that ensures verified suppliers, export compliance, and quality checks before dispatch." }
      },
      {
        "@type": "Question",
        "name": "Does ProcureSaathi handle export documentation?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. ProcureSaathi manages phytosanitary certificates, COO, packaging norms, and logistics coordination for seamless food exports from India." }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Illustrative Procurement Scenario: Middle East Food Import from India | ProcureSaathi</title>
        <meta name="description" content="An illustrative example of how Middle East food importers typically use ProcureSaathi's managed export procurement platform for sourcing pulses and spices from India." />
        <meta name="keywords" content="Middle East food import, pulses sourcing India, spices export India, UAE food suppliers, B2B food procurement" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-middle-east-pulses-spices-import" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium mb-4">
            Illustrative Procurement Scenario: Food Import & Distribution
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Illustrative Example – Middle East Food Import from India
          </h1>
          
          {/* Universal Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes may vary depending on category, volume, and market conditions.
            </p>
          </div>
          
          <p className="text-xl text-muted-foreground">
            ProcureSaathi is an AI-powered B2B procurement and sourcing platform used by buyers across domestic and export–import markets. The following example demonstrates a typical managed export procurement flow for Middle East food importers sourcing from India.
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Buyer Profile (Illustrative)</h2>
            <div className="bg-muted/30 p-6 rounded-lg">
              <ul className="space-y-2 list-none pl-0">
                <li><strong>Region:</strong> Middle East (UAE / Saudi market)</li>
                <li><strong>Industry:</strong> Food Import & Distribution</li>
                <li><strong>Products:</strong> Pulses (Chickpeas, Lentils), Whole & Ground Spices</li>
                <li><strong>Primary Challenge:</strong> Quality consistency, export documentation, delivery timelines</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">(Illustrative buyer profile for explanation purposes)</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Procurement Challenge (Typical)</h2>
            <p className="text-muted-foreground mb-4">Buyers in this category typically face:</p>
            <ul className="space-y-3">
              {[
                "Multiple unknown suppliers with uneven quality",
                "Frequent shipment delays",
                "Incomplete export & phytosanitary documentation",
                "No single point of accountability",
                "Price volatility and renegotiations"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">How ProcureSaathi Is Used</h2>
            <p className="text-muted-foreground mb-4">ProcureSaathi implements a managed export procurement model:</p>
            <ul className="space-y-3">
              {[
                "AI-structured RFQ with quality & compliance parameters",
                "Pre-verified Indian food-grade suppliers",
                "Single consolidated commercial contract",
                "Export documentation handled centrally",
                "Quality checks before dispatch"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">How It Works (Step-by-Step)</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Buyer posts requirement via ProcureSaathi" },
                { step: "2", title: "AI matches verified food exporters" },
                { step: "3", title: "Competitive sealed bidding completed" },
                { step: "4", title: "Quality inspection + export compliance verified" },
                { step: "5", title: "Single shipment executed with full documentation" }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <span className="text-foreground">{item.title}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Illustrative Outcomes</h2>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <p className="text-muted-foreground mb-4">In a typical scenario, buyers experience:</p>
              <ul className="space-y-3">
                {[
                  "Faster sourcing decisions",
                  "Improved export compliance confidence",
                  "Reduced coordination overhead",
                  "Greater pricing transparency",
                  "Single-point accountability for fulfillment"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">Is this an actual customer case study?</h3>
                <p className="text-muted-foreground">This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes vary depending on category, volume, and market conditions.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can Middle East buyers source food products from India safely?</h3>
                <p className="text-muted-foreground">By using a managed procurement platform like ProcureSaathi that ensures verified suppliers, export compliance, and quality checks before dispatch.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Does ProcureSaathi handle export documentation?</h3>
                <p className="text-muted-foreground">Yes. ProcureSaathi manages phytosanitary certificates, COO, packaging norms, and logistics coordination for seamless food exports from India.</p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explore How This Workflow Could Apply to Your Needs</h2>
          <p className="text-muted-foreground mb-6">Want to explore how this workflow could apply to your food import needs?</p>
          <Link to="/post-rfq">
            <Button size="lg" className="gap-2">Request Managed Procurement Quote <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">→ Complete AI Procurement Guide</Link>
            <Link to="/export-import-sourcing-guide" className="text-primary hover:underline">→ Export-Import Sourcing Guide</Link>
            <Link to="/customer-stories" className="text-primary hover:underline">→ More Customer Stories</Link>
            <Link to="/europe/ai-b2b-procurement" className="text-primary hover:underline">→ AI B2B Procurement for Europe</Link>
            <Link to="/singapore/ai-b2b-procurement" className="text-primary hover:underline">→ AI B2B Procurement for Singapore</Link>
            <Link to="/case-study-global-steel-procurement" className="text-primary hover:underline">→ Steel Procurement Scenario</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyMiddleEastFood;