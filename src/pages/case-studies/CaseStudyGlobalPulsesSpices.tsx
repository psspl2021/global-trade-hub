import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Leaf, Globe, Info } from "lucide-react";

const CaseStudyGlobalPulsesSpices = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Illustrative Procurement Scenario: Pulses & Spices Sourcing from India",
    "description": "An illustrative example of how international food importers typically use ProcureSaathi's AI-powered B2B procurement platform for sourcing pulses and spices from India.",
    "author": { "@type": "Organization", "name": "ProcureSaathi" },
    "publisher": { "@type": "Organization", "name": "ProcureSaathi", "url": "https://www.procuresaathi.com" },
    "datePublished": "2025-01-01",
    "dateModified": "2026-01-28"
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Source Pulses & Spices from India Using ProcureSaathi",
    "description": "Step-by-step process for international buyers to source food commodities from verified Indian exporters.",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Specify Requirements", "text": "Submit requirements with grade, certifications (FSSAI, ISO, APEDA), and shipping details." },
      { "@type": "HowToStep", "position": 2, "name": "Verified Exporter Matching", "text": "ProcureSaathi matches requirements with verified Indian agri exporters." },
      { "@type": "HowToStep", "position": 3, "name": "Transparent Multi-Supplier Bidding", "text": "Receive competitive bids from multiple exporters." },
      { "@type": "HowToStep", "position": 4, "name": "Export Fulfillment", "text": "ProcureSaathi handles documentation and logistics coordination." }
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
        "name": "How can international buyers source pulses and spices from India?",
        "acceptedAnswer": { "@type": "Answer", "text": "International buyers can use ProcureSaathi's AI-powered procurement platform to specify grade, certifications, and shipping requirements. ProcureSaathi matches them with verified Indian agri exporters through transparent bidding." }
      },
      {
        "@type": "Question",
        "name": "What certifications do Indian food exporters provide?",
        "acceptedAnswer": { "@type": "Answer", "text": "Indian food exporters on ProcureSaathi provide FSSAI, ISO, APEDA certifications, along with phytosanitary certificates and quality analysis reports." }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Illustrative Procurement Scenario: Pulses & Spices Sourcing from India | ProcureSaathi</title>
        <meta name="description" content="An illustrative example of how international food importers typically use ProcureSaathi for sourcing pulses and spices from verified Indian exporters." />
        <meta name="keywords" content="pulses sourcing India, spices export India, food commodities import, B2B food suppliers India, AI procurement platform" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-global-pulses-spices-sourcing" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
            Illustrative Procurement Scenario: Food Commodities
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Illustrative Example – Pulses & Spices Sourcing from India
          </h1>
          
          {/* Universal Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes may vary depending on category, volume, and market conditions.
            </p>
          </div>
          
          <p className="text-xl text-muted-foreground">
            ProcureSaathi is an AI-powered B2B procurement and sourcing platform used by buyers across domestic and export–import markets. The following example demonstrates a typical procurement flow for buyers sourcing pulses and spices from India.
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Buyer Profile (Illustrative)</h2>
            <div className="bg-muted/30 p-6 rounded-lg">
              <ul className="space-y-2 list-none pl-0">
                <li><strong>Buyer Type:</strong> Food Importer & Distributor</li>
                <li><strong>Region:</strong> Middle East / Southeast Asia</li>
                <li><strong>Category:</strong> Food Commodities – Pulses & Spices</li>
                <li><strong>Products:</strong> Chickpeas, Lentils, Turmeric, Cumin, Red Chilli Powder</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3 italic">(Illustrative buyer profile for explanation purposes)</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Procurement Challenge (Typical)</h2>
            <p className="text-muted-foreground mb-4">Buyers in this category typically face:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Inconsistent quality across suppliers</li>
              <li>• Certification & compliance risks</li>
              <li>• Delays in export documentation</li>
              <li>• No reliable way to compare suppliers transparently</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">How ProcureSaathi Is Used</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 1: AI-Powered RFQ Creation</h3>
                <p className="text-muted-foreground">Buyers structure requirements specifying grade, moisture content, packaging, export certifications (FSSAI, ISO, APEDA), and shipment timelines.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 2: Verified Supplier Discovery</h3>
                <p className="text-muted-foreground">ProcureSaathi matches the RFQ with verified Indian agri exporters from its network.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 3: Transparent Bidding</h3>
                <p className="text-muted-foreground">Suppliers submit sealed bids, enabling transparent multi-supplier comparison.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step 4: Managed Fulfillment</h3>
                <p className="text-muted-foreground">ProcureSaathi handles export documentation & logistics coordination with single-point accountability.</p>
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
                  "Streamlined export compliance"
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
                <p className="text-muted-foreground">This is an illustrative procurement scenario based on typical workflows on ProcureSaathi. Actual outcomes vary depending on category, volume, and market conditions.</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can international buyers source pulses and spices from India?</h3>
                <p className="text-muted-foreground">International buyers can use ProcureSaathi's AI-powered procurement platform to specify grade, certifications, and shipping requirements. ProcureSaathi matches them with verified Indian agri exporters through transparent bidding.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">What certifications do Indian food exporters provide?</h3>
                <p className="text-muted-foreground">Indian food exporters on ProcureSaathi provide FSSAI, ISO, APEDA certifications, along with phytosanitary certificates and quality analysis reports.</p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Explore How This Workflow Could Apply to Your Needs</h2>
          <p className="text-muted-foreground mb-6">Want to explore how this workflow could apply to your food sourcing needs?</p>
          <Link to="/post-rfq">
            <Button size="lg" className="gap-2">Request Managed Procurement Quote <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">→ Complete AI Procurement Guide</Link>
            <Link to="/how-to-post-rfq" className="text-primary hover:underline">→ How to Post RFQ Online</Link>
            <Link to="/ai-vs-traditional-procurement" className="text-primary hover:underline">→ AI vs Traditional Procurement</Link>
            <Link to="/find-verified-suppliers" className="text-primary hover:underline">→ Verified Supplier Discovery Guide</Link>
            <Link to="/singapore/ai-b2b-procurement" className="text-primary hover:underline">→ AI B2B Procurement for Singapore</Link>
            <Link to="/customer-stories" className="text-primary hover:underline">→ More Customer Stories</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyGlobalPulsesSpices;