import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Factory, Globe, Clock, Shield, Info } from "lucide-react";

const CaseStudyGlobalSteel = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Illustrative Procurement Scenario: Global Steel Sourcing from India",
    "description": "An illustrative example of how international buyers typically use ProcureSaathi's AI-powered B2B procurement platform for sourcing steel products from India.",
    "author": {
      "@type": "Organization",
      "name": "ProcureSaathi"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "https://www.procuresaathi.com"
    },
    "datePublished": "2025-01-01",
    "dateModified": "2026-01-28",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.procuresaathi.com/case-study-global-steel-procurement"
    }
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Source Steel Products from India Using ProcureSaathi",
    "description": "Step-by-step process for international buyers to source steel from verified Indian manufacturers.",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Post AI-Structured RFQ", "text": "Submit steel requirements with technical specifications, certifications, and delivery timelines." },
      { "@type": "HowToStep", "position": 2, "name": "Verified Supplier Matching", "text": "ProcureSaathi matches requirements with verified Indian steel manufacturers." },
      { "@type": "HowToStep", "position": 3, "name": "Sealed Competitive Bidding", "text": "Receive transparent, competitive bids ranked by AI scoring." },
      { "@type": "HowToStep", "position": 4, "name": "Managed Fulfillment", "text": "ProcureSaathi coordinates logistics, documentation, and quality compliance." }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is this an actual customer case study?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. It demonstrates how buyers generally use the platform for steel sourcing. Actual outcomes vary depending on category, volume, and market conditions."
        }
      },
      {
        "@type": "Question",
        "name": "How can international buyers source steel from India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "International buyers can use ProcureSaathi's AI-powered B2B procurement platform to post structured RFQs with technical specifications. ProcureSaathi matches them with verified Indian steel manufacturers through transparent sealed bidding."
        }
      },
      {
        "@type": "Question",
        "name": "Does ProcureSaathi handle export documentation for steel shipments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ProcureSaathi provides managed fulfillment including export documentation, quality certificates, and logistics coordination for international steel shipments from India."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Illustrative Procurement Scenario: Global Steel Sourcing from India | ProcureSaathi</title>
        <meta name="description" content="An illustrative example of how international buyers typically use ProcureSaathi's AI-powered B2B procurement platform for sourcing steel products from verified Indian manufacturers." />
        <meta name="keywords" content="steel procurement India, global steel sourcing, B2B steel suppliers, AI procurement platform, steel import example" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-global-steel-procurement" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Illustrative Procurement Scenario: Steel & Industrial Materials
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Illustrative Example – Global Steel Procurement from India
          </h1>
          
          {/* Universal Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes may vary depending on category, volume, and market conditions.
            </p>
          </div>
          
          <p className="text-xl text-muted-foreground">
            ProcureSaathi is an AI-powered B2B procurement and sourcing platform used by buyers across domestic and export–import markets. The following example demonstrates a typical procurement flow on ProcureSaathi for buyers sourcing steel products from India.
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Buyer Profile (Illustrative)</h2>
            <div className="bg-muted/30 p-6 rounded-lg">
              <ul className="space-y-2 list-none pl-0">
                <li><strong>Buyer Type:</strong> Enterprise / International Industrial Buyer</li>
                <li><strong>Region:</strong> Europe / Middle East / USA</li>
                <li><strong>Category:</strong> Steel & Industrial Materials</li>
                <li><strong>Products:</strong> Hot Rolled Steel Coils, Structural Steel Beams, Industrial Steel Plates</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">(Illustrative buyer profile for explanation purposes)</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Procurement Challenge (Typical)</h2>
            <p className="text-muted-foreground mb-4">
              Buyers in this category typically face:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Difficulty discovering verified suppliers with export capability</li>
              <li>• Price opacity and inconsistent quotes across markets</li>
              <li>• High risk in quality assurance and delivery timelines</li>
              <li>• Complex logistics and compliance coordination</li>
              <li>• No single point of accountability</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">How ProcureSaathi Is Used</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 1: AI-Powered RFQ Creation</h3>
                <p className="text-muted-foreground">
                  Buyers structure their requirement using AI-assisted RFQs, ensuring clarity on quantity, specifications, delivery location, and compliance needs.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 2: Verified Supplier Discovery</h3>
                <p className="text-muted-foreground">
                  ProcureSaathi matches the requirement with relevant, pre-verified Indian steel manufacturers from its network.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 3: Transparent Bidding</h3>
                <p className="text-muted-foreground">
                  Suppliers submit sealed bids, allowing buyers to evaluate competitive offers without negotiation bias.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 4: Managed Fulfillment</h3>
                <p className="text-muted-foreground">
                  ProcureSaathi acts as the single counterparty, coordinating fulfillment, documentation, and logistics where required.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Illustrative Outcomes</h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <p className="text-muted-foreground mb-4">In a typical scenario, buyers experience:</p>
              <ul className="space-y-3">
                {[
                  "Faster sourcing decisions",
                  "Improved supplier confidence through verification",
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

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Why This Model Works</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• AI removes ambiguity from RFQs</li>
              <li>• Verification reduces supplier risk</li>
              <li>• Transparent bidding improves market discovery</li>
              <li>• Single-counterparty execution simplifies procurement</li>
            </ul>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">Is this an actual customer case study?</h3>
                <p className="text-muted-foreground">
                  This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. It demonstrates how buyers generally use the platform. Actual outcomes vary depending on category, volume, and market conditions.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can international buyers source steel from India?</h3>
                <p className="text-muted-foreground">
                  International buyers can use ProcureSaathi's AI-powered B2B procurement platform to post structured RFQs with technical specifications. ProcureSaathi matches them with verified Indian steel manufacturers through transparent sealed bidding.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Does ProcureSaathi handle export documentation?</h3>
                <p className="text-muted-foreground">
                  Yes, ProcureSaathi provides managed fulfillment including export documentation, quality certificates, and logistics coordination for international shipments from India.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explore How This Workflow Could Apply to Your Needs</h2>
          <p className="text-muted-foreground mb-6">
            Want to explore how this workflow could apply to your procurement needs?
          </p>
          <Link to="/post-rfq">
            <Button size="lg" className="gap-2">
              Request Managed Procurement Quote <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
              → Complete AI Procurement Guide
            </Link>
            <Link to="/how-to-post-rfq" className="text-primary hover:underline">
              → How to Post RFQ Online
            </Link>
            <Link to="/ai-vs-traditional-procurement" className="text-primary hover:underline">
              → AI vs Traditional Procurement
            </Link>
            <Link to="/find-verified-suppliers" className="text-primary hover:underline">
              → Verified Supplier Discovery Guide
            </Link>
            <Link to="/europe/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Europe
            </Link>
            <Link to="/customer-stories" className="text-primary hover:underline">
              → More Customer Stories
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyGlobalSteel;