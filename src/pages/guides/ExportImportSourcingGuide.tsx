import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Globe, 
  FileText, 
  Ship, 
  BadgeCheck,
  CheckCircle2,
  Sparkles,
  Package,
  Shield,
  Landmark
} from "lucide-react";

const exportImportSteps = [
  {
    step: 1,
    title: "Identify Export/Import Requirements",
    description: "Define the products, specifications, quantities, and target markets. Understand HS codes, tariffs, and regulatory requirements.",
    icon: FileText,
  },
  {
    step: 2,
    title: "Find Verified International Suppliers",
    description: "Use AI-powered platforms like ProcureSaathi to discover verified suppliers capable of export-quality production and compliance.",
    icon: Globe,
  },
  {
    step: 3,
    title: "Verify Certifications & Compliance",
    description: "Ensure suppliers have required certifications (CE, FDA, ISO, BIS, FSSAI) and meet destination country regulatory standards.",
    icon: BadgeCheck,
  },
  {
    step: 4,
    title: "Request Quotes with Export Terms",
    description: "Post RFQs specifying Incoterms (FOB, CIF, DDP), payment terms, shipping requirements, and documentation needs.",
    icon: Package,
  },
  {
    step: 5,
    title: "Manage Documentation & Logistics",
    description: "Handle export documentation (commercial invoice, packing list, certificate of origin) and coordinate international shipping.",
    icon: Ship,
  },
  {
    step: 6,
    title: "Ensure Customs Clearance & Delivery",
    description: "Complete customs formalities, pay applicable duties, and track shipment until final delivery to destination.",
    icon: Landmark,
  },
];

const exportCertifications = [
  "CE Marking (European Union)",
  "FDA Registration (USA)",
  "ISO Certifications",
  "BIS Standards (India)",
  "FSSAI (Food Products)",
  "REACH Compliance (EU)",
];

const ExportImportSourcingGuide = () => {
  const navigate = useNavigate();

  useSEO({
    title: "How Export-Import Sourcing Works | International Trade Guide | ProcureSaathi",
    description: "Complete guide to export-import sourcing. Learn how to find verified international suppliers, manage documentation, and execute cross-border procurement.",
    keywords: "export import sourcing, international trade, cross-border procurement, export suppliers India, import sourcing guide",
    canonical: "https://procuresaathi.com/export-import-sourcing-guide",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "How Export-Import Sourcing Works",
      "description": "Complete guide to international sourcing, export documentation, and cross-border procurement.",
      "step": exportImportSteps.map((s) => ({
        "@type": "HowToStep",
        "position": s.step,
        "name": s.title,
        "text": s.description,
      })),
    }, "export-import-howto-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Guides", url: "https://procuresaathi.com/guides" },
      { name: "Export-Import Sourcing Guide", url: "https://procuresaathi.com/export-import-sourcing-guide" },
    ]), "export-import-breadcrumb");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does export-import sourcing work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Export-import sourcing involves identifying requirements, finding verified international suppliers, verifying certifications, requesting quotes with export terms (Incoterms), managing documentation, and coordinating logistics. Platforms like ProcureSaathi connect buyers with verified export-ready suppliers from India."
          }
        },
        {
          "@type": "Question",
          "name": "What certifications are needed for international trade?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Common certifications for international trade include CE Marking (EU), FDA Registration (USA), ISO certifications, BIS standards (India), FSSAI for food products, and REACH compliance for chemicals. ProcureSaathi verifies supplier certifications before onboarding."
          }
        }
      ]
    }, "export-import-faq-schema");
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
              <span className="text-sm font-semibold text-primary">INTERNATIONAL TRADE GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              How AI-Powered Export–Import Sourcing Works
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
              Start International Sourcing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            6 Steps to Export-Import Sourcing
          </h2>
          
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportImportSteps.map((step) => (
              <Card key={step.step} className="group border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <step.icon className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {step.step}
                        </span>
                        <h3 className="text-lg font-display font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Key Export Certifications
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ProcureSaathi verifies supplier certifications to ensure compliance with international trade requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {exportCertifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50">
                <Shield className="h-5 w-5 text-success flex-shrink-0" />
                <span className="font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Source Globally with Confidence
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Connect with verified export-ready suppliers from India through ProcureSaathi.
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

export default ExportImportSourcingGuide;
