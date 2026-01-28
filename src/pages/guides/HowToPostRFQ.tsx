import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  FileText, 
  Send, 
  Users, 
  Award,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles
} from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Sign Up or Log In",
    description: "Create a free account on ProcureSaathi. No credit card required. Your identity remains protected from suppliers.",
    icon: Users,
  },
  {
    step: 2,
    title: "Describe Your Requirements",
    description: "Enter product details, specifications, quantity, delivery location, and timeline. Our AI helps structure your RFQ professionally.",
    icon: FileText,
  },
  {
    step: 3,
    title: "Submit Your RFQ",
    description: "Post your RFQ with one click. ProcureSaathi matches your requirement with verified suppliers in your category.",
    icon: Send,
  },
  {
    step: 4,
    title: "Receive Competitive Bids",
    description: "Verified suppliers submit sealed bids within 24–48 hours. Compare prices, terms, and delivery timelines transparently.",
    icon: Clock,
  },
  {
    step: 5,
    title: "Award the Best Supplier",
    description: "Review bids, negotiate if needed, and award the RFQ to the supplier that best meets your requirements.",
    icon: Award,
  },
];

const benefits = [
  "No cold calls from suppliers",
  "Sealed bidding ensures fair pricing",
  "Verified suppliers only",
  "Zero commission for buyers",
  "AI-assisted RFQ creation",
  "End-to-end support available",
];

const HowToPostRFQ = () => {
  const navigate = useNavigate();

  useSEO({
    title: "How to Post RFQ Online in India | Step-by-Step Guide | ProcureSaathi",
    description: "Learn how to post an RFQ (Request for Quotation) online in India. Step-by-step guide to creating procurement requests and receiving competitive bids from verified suppliers.",
    keywords: "how to post RFQ, RFQ online India, request for quotation guide, B2B procurement steps, post RFQ free, RFQ process",
    canonical: "https://procuresaathi.com/how-to-post-rfq-online",
  });

  useEffect(() => {
    // HowTo Schema for AI engines
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Post an RFQ Online in India",
      "description": "Complete step-by-step guide to posting a Request for Quotation (RFQ) online and receiving competitive bids from verified B2B suppliers in India.",
      "totalTime": "PT10M",
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "currency": "INR",
        "value": "0"
      },
      "tool": [
        {
          "@type": "HowToTool",
          "name": "ProcureSaathi Platform"
        }
      ],
      "step": steps.map((s) => ({
        "@type": "HowToStep",
        "position": s.step,
        "name": s.title,
        "text": s.description,
      })),
    }, "how-to-post-rfq-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Guides", url: "https://procuresaathi.com/guides" },
      { name: "How to Post RFQ Online", url: "https://procuresaathi.com/how-to-post-rfq-online" },
    ]), "how-to-rfq-breadcrumb");

    // FAQ Schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I post an RFQ online in India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To post an RFQ online in India, use platforms like ProcureSaathi. Sign up for free, enter your product requirements, quantity, and delivery details. Submit your RFQ and receive competitive sealed bids from verified suppliers within 24-48 hours."
          }
        },
        {
          "@type": "Question",
          "name": "Is posting an RFQ free on ProcureSaathi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, posting an RFQ on ProcureSaathi is completely free for buyers. There is no commission charged to buyers, and you are not obligated to award any bid."
          }
        },
        {
          "@type": "Question",
          "name": "How long does it take to receive quotes after posting an RFQ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "On ProcureSaathi, buyers typically receive competitive quotes from verified suppliers within 24-48 hours of posting an RFQ."
          }
        }
      ]
    }, "how-to-rfq-faq-schema");
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
              <span className="text-sm font-semibold text-primary">STEP-BY-STEP GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How to Post an AI-Powered RFQ Online in India
            </h1>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/post-rfq')}
            >
              Post Your RFQ Now – Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            5 Simple Steps to Post an RFQ Online
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {steps.map((step, index) => (
              <Card key={step.step} className="group border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6 flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {step.step}
                      </span>
                      <h3 className="text-xl font-display font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Why Use ProcureSaathi for RFQs?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ProcureSaathi is an AI-powered B2B procurement platform that helps buyers post RFQs 
              and receive competitive bids from verified suppliers across India.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Related Resources
          </h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/find-verified-b2b-suppliers')}>
              Find Verified Suppliers
            </Button>
            <Button variant="outline" onClick={() => navigate('/ai-b2b-procurement-platform-guide')}>
              Complete Procurement Guide
            </Button>
            <Button variant="outline" onClick={() => navigate('/procurement/steel-plates-heavy')}>
              Steel Procurement Signal
            </Button>
            <Button variant="outline" onClick={() => navigate('/best-b2b-procurement-platforms-india')}>
              Compare B2B Platforms
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Ready to Post Your First RFQ?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of buyers who use ProcureSaathi for transparent B2B procurement.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/signup?role=buyer')}
          >
            Get Started – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowToPostRFQ;
