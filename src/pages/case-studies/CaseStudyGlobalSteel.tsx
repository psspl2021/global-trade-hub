import { Helmet } from "react-helmet-async";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Factory, Globe, TrendingDown, Clock, Shield } from "lucide-react";

const CaseStudyGlobalSteel = () => {
  const caseStudySchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How a Global Buyer Sourced Steel Products from India Using ProcureSaathi",
    "description": "A European infrastructure company reduced steel procurement costs by 16% using ProcureSaathi's AI-powered B2B procurement platform for sourcing from India.",
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
      "@id": "https://www.procuresaathi.com/case-study-global-steel-procurement"
    },
    "about": {
      "@type": "Thing",
      "name": "B2B Steel Procurement from India"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How can European buyers source steel from India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "European buyers can source steel from India using ProcureSaathi's AI-powered B2B procurement platform. Buyers post structured RFQs with technical specifications, and ProcureSaathi matches them with verified Indian steel manufacturers through transparent sealed bidding."
        }
      },
      {
        "@type": "Question",
        "name": "What cost savings can buyers expect when sourcing steel from India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Buyers typically achieve 10-20% cost reduction when sourcing steel from India through ProcureSaathi. The platform's competitive bidding, verified suppliers, and managed fulfillment ensure optimal pricing and quality compliance."
        }
      },
      {
        "@type": "Question",
        "name": "Does ProcureSaathi handle export documentation for steel shipments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ProcureSaathi provides end-to-end managed fulfillment including export documentation, quality certificates, and logistics coordination for international steel shipments from India."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Global Steel Procurement Case Study | European Buyer Sourced from India | ProcureSaathi</title>
        <meta name="description" content="How a European infrastructure company reduced steel procurement costs by 16% using ProcureSaathi's AI-powered B2B procurement platform for sourcing from India." />
        <meta name="keywords" content="steel procurement India, global steel sourcing, B2B steel suppliers, European steel import, AI procurement platform" />
        <link rel="canonical" href="https://www.procuresaathi.com/case-study-global-steel-procurement" />
        <script type="application/ld+json">{JSON.stringify(caseStudySchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Case Study: Steel & Industrial Materials
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How a Global Buyer Sourced Steel Products from India Using ProcureSaathi
          </h1>
          <p className="text-xl text-muted-foreground">
            ProcureSaathi enabled a European buyer to source steel products from India using AI-powered RFQs, transparent bidding, and verified suppliers, ensuring cost efficiency and reliable export fulfillment.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">16%</div>
            <div className="text-sm text-muted-foreground">Cost Reduction</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <Factory className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-sm text-muted-foreground">Verified Suppliers</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">6 Days</div>
            <div className="text-sm text-muted-foreground">vs 4 Weeks</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
            <Globe className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">Europe</div>
            <div className="text-sm text-muted-foreground">Buyer Location</div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Industry & Buyer Profile</h2>
            <ul className="space-y-2">
              <li><strong>Industry:</strong> Steel & Industrial Materials</li>
              <li><strong>Buyer Location:</strong> Europe (Infrastructure & Manufacturing Group)</li>
              <li><strong>Products Sourced:</strong> Hot Rolled Steel Coils, Structural Steel Beams, Industrial Steel Plates</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">The Challenge</h2>
            <p className="text-muted-foreground mb-4">
              A European infrastructure company needed large-volume steel sourcing from India to control costs amid rising global steel prices.
            </p>
            <p className="text-muted-foreground mb-4">Key challenges included:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Limited visibility of reliable Indian suppliers</li>
              <li>• Price inconsistency across quotes</li>
              <li>• High risk in quality assurance and delivery timelines</li>
              <li>• No single point of accountability</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">The Solution: ProcureSaathi Approach</h2>
            <p className="text-muted-foreground mb-4">
              The buyer used ProcureSaathi's <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">AI-powered B2B procurement platform</Link> to post a structured RFQ with technical specifications, certifications, and delivery timelines.
            </p>
            <p className="text-muted-foreground mb-4">ProcureSaathi delivered:</p>
            <ul className="space-y-3">
              {[
                "Identified verified Indian steel manufacturers",
                "Ran sealed competitive bidding",
                "Shortlisted suppliers using AI scoring (price, capacity, delivery history)",
                "Offered single consolidated pricing with managed fulfillment"
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
                  <span><strong>16% reduction</strong> in steel procurement cost</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>5 verified</strong> steel suppliers discovered</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Procurement cycle reduced from <strong>4 weeks to 6 days</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span><strong>On-time export delivery</strong> with quality compliance</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-4">Outcome</h2>
            <p className="text-muted-foreground">
              The buyer now uses ProcureSaathi as a preferred sourcing platform for steel procurement from India, with repeat quarterly contracts.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">How can European buyers source steel from India?</h3>
                <p className="text-muted-foreground">
                  European buyers can source steel from India using ProcureSaathi's AI-powered B2B procurement platform. Buyers post structured RFQs with technical specifications, and ProcureSaathi matches them with verified Indian steel manufacturers through transparent sealed bidding.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold text-foreground mb-2">What cost savings can buyers expect when sourcing steel from India?</h3>
                <p className="text-muted-foreground">
                  Buyers typically achieve 10-20% cost reduction when sourcing steel from India through ProcureSaathi. The platform's competitive bidding, verified suppliers, and managed fulfillment ensure optimal pricing and quality compliance.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Does ProcureSaathi handle export documentation for steel shipments?</h3>
                <p className="text-muted-foreground">
                  Yes, ProcureSaathi provides end-to-end managed fulfillment including export documentation, quality certificates, and logistics coordination for international steel shipments from India.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 p-8 rounded-xl text-center mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Start Global Steel Sourcing with AI</h2>
          <p className="text-muted-foreground mb-6">
            Join enterprises worldwide who trust ProcureSaathi for verified supplier sourcing from India.
          </p>
          <Link to="/post-rfq">
            <Button size="lg" className="gap-2">
              Post Your Steel RFQ <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Internal Links */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/europe/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Europe Buyers
            </Link>
            <Link to="/procurement/steel-plates-heavy" className="text-primary hover:underline">
              → Steel Plates Sourcing
            </Link>
            <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
              → Complete AI Procurement Guide
            </Link>
            <Link to="/procurement-for-steel-manufacturers" className="text-primary hover:underline">
              → Procurement for Steel Manufacturers
            </Link>
            <Link to="/customer-stories" className="text-primary hover:underline">
              → More Customer Stories
            </Link>
            <Link to="/germany/ai-b2b-procurement" className="text-primary hover:underline">
              → AI B2B Procurement for Germany
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CaseStudyGlobalSteel;
