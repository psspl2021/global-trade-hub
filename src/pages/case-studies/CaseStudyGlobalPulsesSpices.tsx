import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Leaf, Globe, TrendingDown, Clock, Shield, Package } from "lucide-react";

const CaseStudyGlobalPulsesSpices = () => {
  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How an International Buyer Sourced Pulses & Spices from India Using ProcureSaathi",
    "description": "A Middle East & Southeast Asia food importer achieved 12% landed cost reduction sourcing pulses and spices from India using ProcureSaathi's AI-powered B2B procurement platform.",
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
    "dateModified": "2025-01-27",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.procuresaathi.com/case-study-global-pulses-spices-sourcing"
    },
    "about": {
      "@type": "Thing",
      "name": "Food Commodities Sourcing from India"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can international buyers source pulses and spices from India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "International buyers can source pulses and spices from India using ProcureSaathi's AI-powered procurement platform. Buyers specify grade, certifications (FSSAI, ISO, APEDA), and shipping requirements. ProcureSaathi matches them with verified Indian agri exporters through transparent bidding."
        }
      },
      {
        "@type": "Question",
        "name": "What certifications do Indian food exporters provide?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Indian food exporters on ProcureSaathi provide FSSAI, ISO, APEDA certifications, along with phytosanitary certificates and quality analysis reports required for international food commodity imports."
        }
      },
      {
        "@type": "Question",
        "name": "How fast can ProcureSaathi deliver food commodities from India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "With ProcureSaathi's managed fulfillment, first shipments of pulses and spices can be dispatched within 7-10 days. The platform handles export documentation, quality verification, and logistics coordination for seamless delivery."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Global Pulses & Spices Sourcing Case Study | Food Import from India | ProcureSaathi</title>
        <meta name="description" content="How an international food importer achieved 12% cost reduction sourcing pulses and spices from India using ProcureSaathi's AI-powered B2B procurement platform." />
        <meta name="keywords" content="pulses sourcing India, spices export India, food commodities import, B2B food suppliers India, AI procurement platform" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-global-pulses-spices-sourcing" />
        <script type="application/ld+json">{JSON.stringify(caseStudySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium mb-4">
            Case Study: Food Commodities – Pulses & Spices
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How an International Buyer Sourced Pulses & Spices from India Using ProcureSaathi
          </h1>
          <p className="text-xl text-muted-foreground">
            ProcureSaathi helped an international food buyer source pulses and spices from India using AI RFQs, verified exporters, and managed export fulfillment.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">12%</div>
            <div className="text-sm text-muted-foreground">Cost Reduction</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <Leaf className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">4</div>
            <div className="text-sm text-muted-foreground">Export-Ready Suppliers</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">9 Days</div>
            <div className="text-sm text-muted-foreground">First Shipment</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
            <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-muted-foreground">Quality Rejections</div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Industry & Buyer Profile</h2>
            <ul className="space-y-2">
              <li><strong>Industry:</strong> Food Commodities – Pulses & Spices</li>
              <li><strong>Buyer Location:</strong> Middle East & Southeast Asia (Food Importer & Distributor)</li>
              <li><strong>Products Sourced:</strong></li>
              <ul className="ml-6 mt-2 space-y-1">
                <li>Chickpeas (Kabuli & Desi)</li>
                <li>Toor Dal, Moong Dal</li>
                <li>Turmeric, Cumin, Red Chilli Powder</li>
              </ul>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">The Challenge</h2>
            <p className="text-muted-foreground mb-4">
              The buyer wanted to source food-grade pulses and spices from India but faced significant obstacles:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Inconsistent quality across suppliers</li>
              <li>• Certification & compliance risks</li>
              <li>• Delays in export documentation</li>
              <li>• No reliable way to compare suppliers transparently</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">The Solution: ProcureSaathi Approach</h2>
            <p className="text-muted-foreground mb-4">
              Using ProcureSaathi's <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">AI-powered B2B procurement platform</Link>, the buyer posted an AI-structured RFQ specifying:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-6">
              <li>• Grade, moisture content, packaging requirements</li>
              <li>• Export certifications (FSSAI, ISO, APEDA)</li>
              <li>• Destination port and shipment timelines</li>
            </ul>
            <p className="text-muted-foreground mb-4">ProcureSaathi delivered:</p>
            <ul className="space-y-3">
              {[
                "Matched the RFQ with verified Indian agri exporters",
                "Enabled transparent multi-supplier bidding",
                "Handled export documentation & logistics coordination",
                "Provided single-point accountability"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Results</h2>
            <div className="bg-muted/50 p-6 rounded-lg">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>12% landed cost</strong> reduction</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>4 export-ready</strong> suppliers shortlisted</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>First shipment dispatched in <strong>9 days</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>Zero quality rejection</strong></span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Outcome</h2>
            <p className="text-muted-foreground">
              The buyer expanded sourcing to spices + pulses across 3 countries, making ProcureSaathi a long-term sourcing partner.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can international buyers source pulses and spices from India?</h3>
                <p className="text-muted-foreground">
                  International buyers can source pulses and spices from India using ProcureSaathi's AI-powered procurement platform. Buyers specify grade, certifications (FSSAI, ISO, APEDA), and shipping requirements. ProcureSaathi matches them with verified Indian agri exporters through transparent bidding.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">What certifications do Indian food exporters provide?</h3>
                <p className="text-muted-foreground">
                  Indian food exporters on ProcureSaathi provide FSSAI, ISO, APEDA certifications, along with phytosanitary certificates and quality analysis reports required for international food commodity imports.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">How fast can ProcureSaathi deliver food commodities from India?</h3>
                <p className="text-muted-foreground">
                  With ProcureSaathi's managed fulfillment, first shipments of pulses and spices can be dispatched within 7-10 days. The platform handles export documentation, quality verification, and logistics coordination for seamless delivery.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Start Global Food Sourcing with AI</h2>
          <p className="text-muted-foreground mb-6">
            Join food importers worldwide who trust ProcureSaathi for verified supplier sourcing from India.
          </p>
          <Link to="/post-rfq">
            <Button size="lg" className="gap-2">
              Post Your Food RFQ <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/singapore/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Singapore Buyers
            </Link>
            <Link to="/procurement/spices-whole-ground" className="text-primary hover:underline">
              → Spices Sourcing
            </Link>
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
              → Complete AI Procurement Guide
            </Link>
            <Link to="/procurement/pulses-lentils-bulk" className="text-primary hover:underline">
              → Pulses & Lentils Sourcing
            </Link>
            <Link to="/customer-stories" className="text-primary hover:underline">
              → More Customer Stories
            </Link>
            <Link to="/uae/procurement/food-additives-preservatives" className="text-primary hover:underline">
              → UAE Food Additives Sourcing
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyGlobalPulsesSpices;
