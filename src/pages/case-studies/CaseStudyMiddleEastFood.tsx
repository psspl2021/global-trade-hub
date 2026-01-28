import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, XCircle, Leaf, Globe, TrendingDown, Clock, Shield, FileCheck, Quote } from "lucide-react";

const CaseStudyMiddleEastFood = () => {
  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How a Middle East Importer Sourced Pulses & Spices from India Using ProcureSaathi",
    "description": "A Middle East food importer achieved 14% landed cost reduction and zero shipment rejections sourcing pulses and spices from India using ProcureSaathi's managed export procurement platform.",
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
    "dateModified": "2026-01-27",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.procuresaathi.com/case-study-middle-east-pulses-spices-import"
    },
    "about": {
      "@type": "Thing",
      "name": "Food Commodities Export from India to Middle East"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can Middle East buyers source food products from India safely?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "By using a managed procurement platform like ProcureSaathi that ensures verified suppliers, export compliance, and quality checks before dispatch."
        }
      },
      {
        "@type": "Question",
        "name": "Does ProcureSaathi handle export documentation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. ProcureSaathi manages phytosanitary certificates, COO, packaging norms, and logistics coordination for seamless food exports from India."
        }
      },
      {
        "@type": "Question",
        "name": "Is ProcureSaathi suitable for large-volume food imports?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The platform supports enterprise-scale food sourcing with consistent quality and pricing for volumes exceeding 1,000 MT annually."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>How a Middle East Importer Sourced Pulses & Spices from India | ProcureSaathi Case Study</title>
        <meta name="description" content="A Middle East food importer achieved 14% landed cost reduction and zero shipment rejections sourcing pulses and spices from India using ProcureSaathi's managed export procurement platform." />
        <meta name="keywords" content="Middle East food import, pulses sourcing India, spices export India, UAE food suppliers, B2B food procurement, AI procurement platform" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-middle-east-pulses-spices-import" />
        <script type="application/ld+json">{JSON.stringify(caseStudySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium mb-4">
            Case Study: Food Import & Distribution
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How a Middle East Buyer Secured Reliable Pulses & Spices Supply from India in 21 Days
          </h1>
          <p className="text-xl text-muted-foreground">
            A leading food importer based in the Middle East was facing inconsistent quality, delayed shipments, and compliance challenges while sourcing pulses and spices from India. Using ProcureSaathi's AI-powered B2B procurement platform, the buyer streamlined supplier discovery, ensured export compliance, and secured reliable long-term supply — without dealing with multiple suppliers directly.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">14%</div>
            <div className="text-sm text-muted-foreground">Landed Cost Reduction</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <FileCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <div className="text-sm text-muted-foreground">Export Compliance</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">21 Days</div>
            <div className="text-sm text-muted-foreground">End-to-End Cycle</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
            <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-muted-foreground">Shipment Rejections</div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Buyer Profile</h2>
            <div className="bg-muted/30 p-6 rounded-lg">
              <ul className="space-y-2 list-none pl-0">
                <li><strong>Region:</strong> Middle East (UAE / Saudi market)</li>
                <li><strong>Industry:</strong> Food Import & Distribution</li>
                <li><strong>Products:</strong> Pulses (Chickpeas, Lentils), Whole & Ground Spices</li>
                <li><strong>Annual Import Volume:</strong> 1,200+ MT</li>
                <li><strong>Primary Challenge:</strong> Quality consistency, export documentation, delivery timelines</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Problems Before ProcureSaathi</h2>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Solution by ProcureSaathi</h2>
            <p className="text-muted-foreground mb-4">
              ProcureSaathi implemented a <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">managed export procurement model</Link>:
            </p>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">How It Worked (Step-by-Step)</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Buyer posted requirement via ProcureSaathi" },
                { step: "2", title: "AI matched verified food exporters" },
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Results Achieved</h2>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>14% landed cost reduction</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>100% export compliance</strong> (FSSAI, phytosanitary, COO)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>21-day</strong> end-to-end procurement cycle</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>Zero shipment rejections</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>Long-term supplier lock-in</strong></span>
                </li>
              </ul>
            </div>
          </section>

          {/* Testimonial */}
          <section className="mb-10">
            <div className="bg-primary/5 p-8 rounded-xl border-l-4 border-primary">
              <Quote className="h-10 w-10 text-primary/40 mb-4" />
              <blockquote className="text-xl text-foreground italic mb-4">
                "ProcureSaathi gave us confidence to source from India without risk. We didn't deal with multiple exporters — one contract, one accountable partner, full compliance."
              </blockquote>
              <p className="text-muted-foreground font-medium">
                — Head of Imports, Middle East Food Distributor
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can Middle East buyers source food products from India safely?</h3>
                <p className="text-muted-foreground">
                  By using a managed procurement platform like ProcureSaathi that ensures verified suppliers, export compliance, and quality checks before dispatch.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">Does ProcureSaathi handle export documentation?</h3>
                <p className="text-muted-foreground">
                  Yes. ProcureSaathi manages phytosanitary certificates, COO, packaging norms, and logistics coordination for seamless food exports from India.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Is ProcureSaathi suitable for large-volume food imports?</h3>
                <p className="text-muted-foreground">
                  Yes. The platform supports enterprise-scale food sourcing with consistent quality and pricing for volumes exceeding 1,000 MT annually.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Start Your Food Sourcing Journey</h2>
          <p className="text-muted-foreground mb-6">
            Join Middle East importers who trust ProcureSaathi for verified, compliant food sourcing from India.
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
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
              → Complete AI Procurement Guide
            </Link>
            <Link to="/export-import-sourcing-guide" className="text-primary hover:underline">
              → Export-Import Sourcing Guide
            </Link>
            <Link to="/customer-stories" className="text-primary hover:underline">
              → More Customer Stories
            </Link>
            <Link to="/europe/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Europe
            </Link>
            <Link to="/singapore/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Singapore
            </Link>
            <Link to="/case-study-global-steel-procurement" className="text-primary hover:underline">
              → Global Steel Procurement Case Study
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyMiddleEastFood;
