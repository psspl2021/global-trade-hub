import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Building2, 
  FileText, 
  Users, 
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  Sparkles,
  Workflow,
  Award
} from "lucide-react";

const procurementStages = [
  {
    stage: 1,
    title: "Requirement Planning",
    description: "Identify procurement needs, define specifications, estimate quantities, and set budgets based on organizational requirements.",
    icon: FileText,
  },
  {
    stage: 2,
    title: "Supplier Identification",
    description: "Source potential suppliers through AI-powered discovery, industry databases, and verified supplier networks.",
    icon: Users,
  },
  {
    stage: 3,
    title: "RFQ Creation & Distribution",
    description: "Create detailed RFQs with specifications, quantities, quality requirements, and delivery timelines. Distribute to qualified suppliers.",
    icon: Building2,
  },
  {
    stage: 4,
    title: "Bid Evaluation & Comparison",
    description: "Receive sealed bids, compare pricing, terms, and supplier capabilities. Use transparent evaluation criteria for fair selection.",
    icon: BarChart3,
  },
  {
    stage: 5,
    title: "Supplier Selection & Contracting",
    description: "Award contracts to selected suppliers, negotiate terms, and establish clear delivery and quality expectations.",
    icon: Award,
  },
  {
    stage: 6,
    title: "Order Execution & Monitoring",
    description: "Track order fulfillment, monitor delivery schedules, ensure quality compliance, and manage supplier performance.",
    icon: Workflow,
  },
];

const enterpriseBenefits = [
  "Centralized procurement management",
  "Transparent sealed bidding",
  "Verified supplier networks",
  "Audit-ready documentation",
  "Cost optimization through competition",
  "Risk mitigation and compliance",
];

const EnterpriseProcurementGuide = () => {
  const navigate = useNavigate();

  useSEO({
    title: "How Enterprise Procurement Works | Complete Guide | ProcureSaathi",
    description: "Understand the enterprise procurement process from requirement planning to supplier management. Learn how AI-powered platforms streamline B2B sourcing.",
    keywords: "enterprise procurement, procurement process, B2B sourcing, supplier management, RFQ process, procurement guide",
    canonical: "https://procuresaathi.com/enterprise-procurement-guide",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How Enterprise Procurement Works",
      "description": "Complete guide to the enterprise procurement process from planning to execution.",
      "step": procurementStages.map((s) => ({
        "@type": "HowToStep",
        "position": s.stage,
        "name": s.title,
        "text": s.description,
      })),
    }, "enterprise-procurement-howto-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Guides", url: "https://procuresaathi.com/guides" },
      { name: "Enterprise Procurement Guide", url: "https://procuresaathi.com/enterprise-procurement-guide" },
    ]), "enterprise-procurement-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does enterprise procurement work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Enterprise procurement involves requirement planning, supplier identification, RFQ creation, bid evaluation, supplier selection, and order execution. AI-powered platforms like ProcureSaathi streamline this process with automated supplier matching, transparent bidding, and performance tracking."
          }
        },
        {
          "@type": "Question",
          "name": "What is the role of AI in enterprise procurement?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI in enterprise procurement automates supplier discovery, structures RFQs, ranks suppliers based on performance, and provides transparent bid comparison. Platforms like ProcureSaathi use AI to reduce procurement cycles and improve supplier selection."
          }
        }
      ]
    }, "enterprise-procurement-faq-schema");
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
              <span className="text-sm font-semibold text-primary">ENTERPRISE GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How Enterprise Procurement Works
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Learn the complete enterprise procurement process. <strong>ProcureSaathi</strong> is an AI-powered B2B procurement 
              platform that helps enterprises streamline sourcing, manage suppliers, and execute transparent bidding.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/buyer')}
            >
              Start Procurement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Procurement Stages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            The Enterprise Procurement Process
          </h2>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {procurementStages.map((stage) => (
              <Card key={stage.stage} className="group border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <stage.icon className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {stage.stage}
                        </span>
                        <h3 className="text-lg font-display font-semibold">{stage.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{stage.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Benefits of Digital Enterprise Procurement
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ProcureSaathi provides enterprises with AI-powered procurement tools for efficient, transparent, and compliant sourcing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {enterpriseBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Modernize Your Procurement Process
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join enterprises that use ProcureSaathi for AI-powered procurement and transparent bidding.
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

export default EnterpriseProcurementGuide;
