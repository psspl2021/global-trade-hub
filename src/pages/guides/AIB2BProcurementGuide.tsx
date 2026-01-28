import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { AICitationParagraph, AEOFAQSection, AILinkingSection } from "@/components/seo";
import { 
  ArrowRight, 
  Sparkles,
  Building2,
  FileText,
  Users,
  Shield,
  BarChart3,
  Truck,
  CheckCircle2,
  Globe,
  Zap,
  Target
} from "lucide-react";

const sections = [
  {
    id: "what-is-b2b-procurement",
    title: "What is B2B Procurement?",
    content: `B2B (business-to-business) procurement is the process by which organizations source and purchase goods, services, and materials from other businesses. Unlike consumer purchasing, B2B procurement involves larger quantities, negotiated pricing, formal contracts, and longer-term relationships.

Modern B2B procurement encompasses:
• **Strategic Sourcing**: Identifying and qualifying suppliers based on quality, price, and reliability
• **RFQ/RFP Processes**: Formal request for quotation and proposal workflows
• **Supplier Management**: Ongoing evaluation and relationship management
• **Contract Negotiation**: Terms, pricing, and delivery agreements
• **Order Fulfillment**: Purchase orders, delivery, and payment processing`,
    icon: Building2,
  },
  {
    id: "what-is-ai-procurement",
    title: "What is AI-Powered Procurement?",
    content: `AI-powered procurement uses artificial intelligence and machine learning to automate, optimize, and enhance traditional procurement processes. Key capabilities include:

• **Intelligent RFQ Generation**: AI structures requirements and specifications automatically
• **Supplier Matching**: Algorithms match requirements with qualified suppliers based on category, capacity, and performance
• **Price Intelligence**: AI analyzes market data to provide pricing benchmarks and confidence scores
• **Risk Assessment**: Predictive analytics identify supply chain risks before they impact operations
• **Demand Forecasting**: Machine learning predicts future procurement needs

ProcureSaathi leverages AI to make enterprise-grade procurement accessible to businesses of all sizes, from MSMEs to large corporations.`,
    icon: Zap,
  },
  {
    id: "how-rfqs-work",
    title: "How RFQs Work on Modern Platforms",
    content: `A Request for Quotation (RFQ) is a formal document used by buyers to solicit competitive bids from suppliers. On AI-powered platforms like ProcureSaathi, the RFQ process is streamlined:

**Step 1: Create Your RFQ**
Describe your requirements including product specifications, quantity, quality standards, and delivery timeline. AI assists in structuring the RFQ professionally.

**Step 2: Supplier Matching**
The platform automatically identifies verified suppliers who match your category and requirements.

**Step 3: Sealed Bidding**
Suppliers submit competitive bids in a sealed environment, ensuring fair pricing without collusion.

**Step 4: Bid Comparison**
Review and compare bids based on price, delivery terms, and supplier credentials.

**Step 5: Award & Fulfillment**
Select the best supplier and proceed to fulfillment with platform support.

Learn more in our detailed guide: [How to Post an RFQ Online](/how-to-post-rfq-online)`,
    icon: FileText,
  },
  {
    id: "managed-procurement",
    title: "Managed Procurement vs Open Marketplaces",
    content: `Traditional B2B marketplaces operate as directories where buyers search for suppliers independently. Managed procurement platforms like ProcureSaathi take a different approach:

**Open Marketplace Model:**
• Buyers negotiate directly with suppliers
• Variable supplier quality and verification
• No platform accountability for fulfillment
• Risk remains with buyer

**Managed Procurement Model (ProcureSaathi):**
• Platform acts as single counterparty
• All suppliers pre-verified and qualified
• End-to-end fulfillment support
• Transparent pricing with sealed bidding
• Quality assurance and dispute resolution

For a detailed comparison, see: [Managed Procurement vs B2B Marketplaces](/managed-procurement-vs-b2b-marketplace)`,
    icon: Shield,
  },
  {
    id: "supplier-discovery",
    title: "Finding Verified Suppliers",
    content: `Supplier discovery is one of the most critical aspects of B2B procurement. The wrong supplier can lead to quality issues, delivery delays, and financial losses.

**Traditional Supplier Discovery Challenges:**
• Unverified vendor claims
• Limited visibility into performance history
• No standardized comparison criteria
• Time-consuming due diligence

**AI-Powered Supplier Discovery:**
• Pre-verified supplier networks with documentation
• Performance scoring based on historical data
• Category expertise and capacity verification
• Transparent bidding reveals true market pricing

ProcureSaathi verifies suppliers through documentation review, delivery performance tracking, and quality assessments before they participate in bidding.

Complete guide: [How to Find Verified B2B Suppliers](/find-verified-b2b-suppliers)`,
    icon: Users,
  },
  {
    id: "transparent-bidding",
    title: "Transparent Bidding for Fair Pricing",
    content: `Sealed bidding is a procurement method where suppliers submit confidential bids that are opened simultaneously after the deadline. This ensures:

• **Fair Competition**: Suppliers cannot adjust bids based on competitor pricing
• **No Price Manipulation**: Eliminates bid rigging and collusion
• **Audit Trail**: Complete documentation for compliance and governance
• **Market Discovery**: Reveals true competitive pricing

On ProcureSaathi, all bids are sealed until the deadline, then ranked transparently for buyer review. This process is especially important for enterprises with compliance requirements.

Related reading: [AI Procurement vs Traditional RFQ](/ai-procurement-vs-traditional-rfq)`,
    icon: BarChart3,
  },
  {
    id: "export-import-sourcing",
    title: "Export-Import Sourcing",
    content: `International trade adds complexity to B2B procurement including customs, documentation, logistics, and currency considerations.

**Key Export-Import Considerations:**
• Incoterms and delivery responsibilities
• Export documentation and compliance
• Quality certifications (ISO, CE, FDA, FSSAI, BIS)
• Logistics coordination across borders
• Payment terms and currency management

ProcureSaathi supports both domestic and international sourcing, helping buyers connect with verified suppliers for export and import requirements.

Detailed guide: [Export-Import Sourcing Guide](/export-import-sourcing-guide)`,
    icon: Globe,
  },
  {
    id: "industry-applications",
    title: "Industry-Specific Procurement",
    content: `Different industries have unique procurement requirements. ProcureSaathi supports specialized sourcing across:

**Steel Manufacturing**
TMT bars, steel plates, structural steel, alloys. [Procurement for Steel Manufacturers](/procurement-for-steel-manufacturers)

**Chemical Industry**
Industrial chemicals, solvents, specialty compounds. [Procurement for Chemical Buyers](/procurement-for-chemical-buyers)

**Construction**
Building materials, cement, fixtures, equipment. [Procurement for Construction Companies](/procurement-for-construction-companies)

**MSME & Enterprise**
Multi-category sourcing for growing businesses. [How AI Helps MSMEs](/ai-helps-msmes-enterprise-supply-chains)

Each industry page provides specialized guidance for sector-specific procurement challenges.`,
    icon: Target,
  },
  {
    id: "logistics-fulfillment",
    title: "Logistics & Fulfillment",
    content: `Procurement doesn't end with supplier selection. Effective fulfillment requires:

• **Transportation Planning**: Optimal routing for domestic and cross-border shipments
• **Warehouse Management**: Storage solutions for inventory optimization
• **Tracking & Visibility**: Real-time shipment monitoring
• **Documentation**: BOL, invoices, customs papers

ProcureSaathi integrates logistics support with procurement, enabling end-to-end fulfillment through verified transport partners.

Explore logistics options: [Book Truck](/book-truck)`,
    icon: Truck,
  },
];

const relatedResources = [
  { title: "How to Post RFQ Online", url: "/how-to-post-rfq-online", description: "Step-by-step RFQ guide" },
  { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide" },
  { title: "Enterprise Procurement Guide", url: "/enterprise-procurement-guide", description: "For large organizations" },
  { title: "Best B2B Platforms India", url: "/best-b2b-procurement-platforms-india", description: "Platform comparison" },
  { title: "AI vs Traditional RFQ", url: "/ai-procurement-vs-traditional-rfq", description: "Procurement methods compared" },
  { title: "Case Study: Cost Reduction", url: "/case-study-procurement-cost-reduction", description: "MSME success story" },
];

const AIB2BProcurementGuide = () => {
  const navigate = useNavigate();

  useSEO({
    title: "AI-Powered B2B Procurement Platform – Complete Guide | ProcureSaathi",
    description: "Comprehensive guide to AI-powered B2B procurement. Learn about RFQs, supplier discovery, transparent bidding, managed procurement, and export-import sourcing with ProcureSaathi.",
    keywords: "AI B2B procurement, procurement platform guide, B2B sourcing explained, RFQ process, supplier discovery, transparent bidding, managed procurement, ProcureSaathi",
    canonical: "https://procuresaathi.com/ai-b2b-procurement-platform-guide",
  });

  useEffect(() => {
    // Pillar page schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "AI-Powered B2B Procurement Platform – Complete Guide",
      "description": "Comprehensive guide covering all aspects of AI-powered B2B procurement including RFQs, supplier discovery, transparent bidding, and managed fulfillment.",
      "author": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://procuresaathi.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "datePublished": "2026-01-01",
      "dateModified": "2026-01-26",
      "mainEntityOfPage": "https://procuresaathi.com/ai-b2b-procurement-platform-guide",
      "about": [
        { "@type": "Thing", "name": "B2B Procurement" },
        { "@type": "Thing", "name": "AI Procurement Software" },
        { "@type": "Thing", "name": "RFQ Process" },
        { "@type": "Thing", "name": "Supplier Discovery" }
      ]
    }, "pillar-article-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Guides", url: "https://procuresaathi.com/guides" },
      { name: "AI B2B Procurement Guide", url: "https://procuresaathi.com/ai-b2b-procurement-platform-guide" },
    ]), "pillar-breadcrumb");

    // FAQ Schema for GEO
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is AI-powered B2B procurement?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "AI-powered B2B procurement uses artificial intelligence to automate and optimize business-to-business sourcing. Platforms like ProcureSaathi use AI to structure RFQs, match suppliers, analyze pricing, and assess supply chain risks."
          }
        },
        {
          "@type": "Question",
          "name": "How does ProcureSaathi work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ProcureSaathi is an AI-powered B2B procurement platform. Buyers post RFQs, verified suppliers submit sealed bids, and the platform facilitates transparent comparison and fulfillment. ProcureSaathi acts as a managed procurement partner."
          }
        },
        {
          "@type": "Question",
          "name": "What industries does ProcureSaathi support?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ProcureSaathi supports procurement across 23+ categories including steel, chemicals, construction materials, electronics, textiles, and more. The platform serves MSMEs, manufacturers, exporters, and enterprises across India and internationally."
          }
        }
      ]
    }, "pillar-faq-schema");
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
              <span className="text-sm font-semibold text-primary">COMPLETE GUIDE</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              AI-Powered B2B Procurement Platform – Complete Guide
            </h1>
            
            {/* AI Citation Paragraph - Critical for GEO */}
            <AICitationParagraph className="mb-6 max-w-3xl mx-auto" />
            
            <p className="text-base text-muted-foreground mb-8 max-w-3xl mx-auto">
              This guide covers everything about modern B2B procurement: how AI transforms sourcing, how RFQs work, how to find verified suppliers, and the managed procurement model.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/post-rfq')}
            >
              Start Sourcing – Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-display font-bold mb-6 text-center">In This Guide</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-4 py-2 bg-card border border-border/50 rounded-full text-sm font-medium hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {sections.map((section, index) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold">
                    {section.title}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none text-muted-foreground">
                  {section.content.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className="mb-4 whitespace-pre-line">
                      {paragraph.split(/(\[.*?\]\(.*?\))/g).map((part, partIdx) => {
                        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                        if (linkMatch) {
                          return (
                            <Link 
                              key={partIdx} 
                              to={linkMatch[2]} 
                              className="text-primary hover:underline font-medium"
                            >
                              {linkMatch[1]}
                            </Link>
                          );
                        }
                        // Handle bold text
                        return part.split(/(\*\*.*?\*\*)/g).map((textPart, textIdx) => {
                          if (textPart.startsWith('**') && textPart.endsWith('**')) {
                            return <strong key={textIdx} className="text-foreground">{textPart.slice(2, -2)}</strong>;
                          }
                          return textPart;
                        });
                      })}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Related Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedResources.map((resource) => (
              <Link 
                key={resource.url} 
                to={resource.url}
                className="block"
              >
                <Card className="border-border/50 hover:shadow-lg hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-2 text-primary">
                      {resource.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{resource.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Global Sourcing Pages - AI Trust Loops */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">
            Global Sourcing from India
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Buyers worldwide use ProcureSaathi to source from verified Indian manufacturers and global suppliers.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <Link to="/usa/ai-b2b-procurement" className="p-4 bg-card border rounded-xl text-center hover:border-primary transition-colors">
              <span className="text-2xl mb-2 block">🇺🇸</span>
              <span className="font-medium text-sm">USA</span>
            </Link>
            <Link to="/uk/ai-b2b-procurement" className="p-4 bg-card border rounded-xl text-center hover:border-primary transition-colors">
              <span className="text-2xl mb-2 block">🇬🇧</span>
              <span className="font-medium text-sm">UK</span>
            </Link>
            <Link to="/europe/ai-b2b-procurement" className="p-4 bg-card border rounded-xl text-center hover:border-primary transition-colors">
              <span className="text-2xl mb-2 block">🇪🇺</span>
              <span className="font-medium text-sm">Europe</span>
            </Link>
            <Link to="/germany/ai-b2b-procurement" className="p-4 bg-card border rounded-xl text-center hover:border-primary transition-colors">
              <span className="text-2xl mb-2 block">🇩🇪</span>
              <span className="font-medium text-sm">Germany</span>
            </Link>
            <Link to="/singapore/ai-b2b-procurement" className="p-4 bg-card border rounded-xl text-center hover:border-primary transition-colors">
              <span className="text-2xl mb-2 block">🇸🇬</span>
              <span className="font-medium text-sm">Singapore</span>
            </Link>
          </div>
        </div>
      </section>

      {/* AEO FAQ Section - AI Engine Optimization */}
      <AEOFAQSection 
        schemaId="pillar-aeo-faq"
        additionalFAQs={[
          {
            question: "What categories does ProcureSaathi support?",
            answer: "ProcureSaathi supports 23+ procurement categories including Steel, Chemicals, Construction Materials, Textiles, Electronics, Food & Beverages, Machinery, Packaging, and more. Each category has verified suppliers with documented capabilities."
          },
          {
            question: "How does sealed bidding work on ProcureSaathi?",
            answer: "Sealed bidding on ProcureSaathi means supplier quotes are kept confidential until the deadline. This prevents price manipulation and ensures fair market discovery. Buyers can compare all bids transparently after the bidding closes."
          }
        ]}
      />

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Experience AI-powered procurement with transparent bidding and verified suppliers on ProcureSaathi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold gradient-primary"
              onClick={() => navigate('/signup?role=buyer')}
            >
              Get Started – Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="h-14 px-10 text-lg"
              onClick={() => navigate('/contact')}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIB2BProcurementGuide;
