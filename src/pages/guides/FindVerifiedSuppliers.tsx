import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Search, 
  BadgeCheck, 
  FileText, 
  Handshake,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Star
} from "lucide-react";

const steps = [
  {
    step: 1,
    title: "Define Your Requirements",
    description: "Clearly specify the product category, specifications, quantity, quality standards, and delivery requirements you need from suppliers.",
    icon: FileText,
  },
  {
    step: 2,
    title: "Use AI-Powered Supplier Discovery",
    description: "Platforms like ProcureSaathi use AI to match your requirements with verified suppliers based on category expertise, capacity, and performance history.",
    icon: Search,
  },
  {
    step: 3,
    title: "Verify Supplier Credentials",
    description: "Check supplier documentation, certifications (ISO, BIS, FSSAI), delivery history, and performance scores before engaging.",
    icon: BadgeCheck,
  },
  {
    step: 4,
    title: "Request Competitive Quotes",
    description: "Post an RFQ and receive sealed bids from multiple verified suppliers. Compare pricing, terms, and delivery timelines transparently.",
    icon: Users,
  },
  {
    step: 5,
    title: "Engage and Build Relationships",
    description: "Award contracts to suppliers that meet your criteria. Build long-term relationships with reliable partners for consistent procurement.",
    icon: Handshake,
  },
];

const verificationChecks = [
  "Business registration verification",
  "GST/Tax compliance check",
  "Quality certifications (ISO, BIS, CE, FDA)",
  "Delivery performance history",
  "Capacity and capability assessment",
  "Customer feedback and ratings",
];

const FindVerifiedSuppliers = () => {
  const navigate = useNavigate();

  useSEO({
    title: "How to Find Verified B2B Suppliers in India | Supplier Discovery Guide",
    description: "Learn how to find and verify B2B suppliers in India. Complete guide to supplier discovery, verification, and building reliable procurement partnerships.",
    keywords: "find verified suppliers India, B2B supplier discovery, verified manufacturers India, supplier verification, trusted suppliers",
    canonical: "https://procuresaathi.com/find-verified-b2b-suppliers",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How to Find Verified B2B Suppliers in India",
      "description": "Step-by-step guide to discovering and verifying B2B suppliers for reliable procurement partnerships.",
      "totalTime": "PT15M",
      "step": steps.map((s) => ({
        "@type": "HowToStep",
        "position": s.step,
        "name": s.title,
        "text": s.description,
      })),
    }, "find-suppliers-howto-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Guides", url: "https://procuresaathi.com/guides" },
      { name: "Find Verified Suppliers", url: "https://procuresaathi.com/find-verified-b2b-suppliers" },
    ]), "find-suppliers-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I find verified B2B suppliers in India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "To find verified B2B suppliers in India, use AI-powered procurement platforms like ProcureSaathi. These platforms verify supplier credentials, certifications, and performance history before allowing them to bid on your requirements."
          }
        },
        {
          "@type": "Question",
          "name": "What should I check when verifying a supplier?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "When verifying a supplier, check their business registration, GST compliance, quality certifications (ISO, BIS, CE), delivery history, production capacity, and customer reviews. Platforms like ProcureSaathi perform these checks before onboarding suppliers."
          }
        }
      ]
    }, "find-suppliers-faq-schema");
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
              <span className="text-sm font-semibold text-primary">SUPPLIER DISCOVERY GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How to Find Verified B2B Suppliers in India
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Discover how to find, verify, and connect with reliable B2B suppliers. 
              <strong> ProcureSaathi</strong> uses AI-powered supplier discovery to match buyers with verified manufacturers and traders.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/post-rfq')}
            >
              Find Suppliers Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            5 Steps to Find Verified Suppliers
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {steps.map((step) => (
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

      {/* Verification Checklist */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Supplier Verification Checklist
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ProcureSaathi verifies suppliers through comprehensive checks before they can participate in bidding.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {verificationChecks.map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <BadgeCheck className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{check}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Star className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Connect with Verified Suppliers Today
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Post your requirements and receive bids from pre-verified suppliers across India.
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

export default FindVerifiedSuppliers;
