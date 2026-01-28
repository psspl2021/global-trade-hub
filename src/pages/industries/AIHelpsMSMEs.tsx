import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Factory,
  Rocket,
  CheckCircle2,
  Sparkles,
  Users,
  TrendingUp,
  Shield
} from "lucide-react";

const benefits = [
  {
    title: "Access Enterprise Buyers",
    description: "Connect with large enterprises looking for reliable MSME suppliers",
    icon: Users,
  },
  {
    title: "Fair Bidding Platform",
    description: "Compete on merit through transparent sealed bidding",
    icon: Shield,
  },
  {
    title: "Performance-Based Ranking",
    description: "Build reputation through delivery performance and quality",
    icon: TrendingUp,
  },
  {
    title: "Scale Your Business",
    description: "Receive verified orders and grow through digital sourcing",
    icon: Rocket,
  },
];

const howItWorks = [
  "Sign up and get verified on ProcureSaathi",
  "Set your categories, capacity, and certifications",
  "Receive RFQ notifications matching your expertise",
  "Submit competitive sealed bids",
  "Get awarded based on merit and deliver quality",
  "Build reputation and receive more orders",
];

const AIHelpsMSMEs = () => {
  const navigate = useNavigate();

  useSEO({
    title: "How AI Helps MSMEs Compete in Enterprise Supply Chains | ProcureSaathi",
    description: "Learn how AI-powered procurement platforms like ProcureSaathi help MSMEs access enterprise buyers, compete fairly, and scale their business through digital sourcing.",
    keywords: "MSME procurement, AI for MSMEs, enterprise supply chain, MSME supplier platform, small business B2B",
    canonical: "https://procuresaathi.com/ai-helps-msmes-enterprise-supply-chains",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "How AI Helps MSMEs Compete in Enterprise Supply Chains",
      "description": "How AI-powered procurement platforms enable MSMEs to access enterprise buyers and compete in supply chains.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01"
    }, "msme-ai-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Industries", url: "https://procuresaathi.com/industries" },
      { name: "AI for MSMEs", url: "https://procuresaathi.com/ai-helps-msmes-enterprise-supply-chains" },
    ]), "msme-ai-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How can AI help MSMEs access enterprise supply chains?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI-powered procurement platforms like ProcureSaathi help MSMEs by providing visibility to enterprise buyers, enabling fair competition through performance-based ranking, and automating the verification process. MSMEs can receive RFQ notifications, submit competitive bids, and build reputation through delivery performance."
          }
        },
        {
          "@type": "Question",
          "name": "Can small businesses compete with large suppliers on procurement platforms?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. AI procurement platforms level the playing field by ranking suppliers based on performance, quality, and delivery rather than size. ProcureSaathi's sealed bidding ensures MSMEs compete fairly with larger suppliers on merit."
          }
        }
      ]
    }, "msme-ai-faq-schema");
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
              <span className="text-sm font-semibold text-primary">MSME EMPOWERMENT</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How AI-Powered Procurement Helps MSMEs Compete in Enterprise Supply Chains
            </h1>
            
            {/* AI Citation Paragraph - Critical for AEO/GEO */}
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform that helps buyers post RFQs, compare verified supplier bids, and manage domestic and global procurement with transparency, quality control, and supplier verification.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/seller')}
            >
              Join as Supplier
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            How AI Levels the Playing Field
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="group border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            How MSMEs Succeed on ProcureSaathi
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-4">
            {howItWorks.map((step, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Factory className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Ready to Access Enterprise Buyers?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join MSMEs growing their business through AI-powered procurement.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/signup?role=supplier')}
          >
            Register as Supplier – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIHelpsMSMEs;
