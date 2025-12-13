import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, CheckCircle2, ExternalLink, FileText, Globe, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Certification {
  name: string;
  region: string;
  flag: string;
  description: string;
  categories: string[];
  fullDescription: string;
  issuingBody: string;
  validityPeriod: string;
  requirements: string[];
  benefits: string[];
  officialLink: string;
}

const certifications: Certification[] = [
  {
    name: "CE Marking",
    region: "European Union",
    flag: "🇪🇺",
    description: "Conformité Européenne - Product safety standard for EU markets",
    categories: ["Electronics", "Machinery", "Medical Devices", "Toys"],
    fullDescription: "CE marking indicates that a product complies with EU health, safety, and environmental protection standards. It is mandatory for products sold within the European Economic Area (EEA).",
    issuingBody: "Notified Bodies designated by EU member states",
    validityPeriod: "Valid as long as product design remains unchanged",
    requirements: [
      "Product must meet all applicable EU Directives",
      "Technical documentation and risk assessment",
      "Declaration of Conformity",
      "Third-party testing for high-risk products"
    ],
    benefits: [
      "Access to 27 EU member state markets",
      "Consumer trust and confidence",
      "Legal compliance for export",
      "Competitive advantage in European markets"
    ],
    officialLink: "https://ec.europa.eu/growth/single-market/ce-marking_en"
  },
  {
    name: "FDA Approved",
    region: "United States",
    flag: "🇺🇸",
    description: "Food and Drug Administration certification for USA imports",
    categories: ["Food Products", "Pharmaceuticals", "Medical Devices", "Cosmetics"],
    fullDescription: "FDA approval ensures products meet strict safety and efficacy standards set by the U.S. Food and Drug Administration. Required for food, drugs, medical devices, and cosmetics entering the US market.",
    issuingBody: "U.S. Food and Drug Administration",
    validityPeriod: "Varies by product type; requires periodic renewal and facility inspections",
    requirements: [
      "Pre-market approval or clearance application",
      "Clinical trials for drugs and medical devices",
      "Good Manufacturing Practice (GMP) compliance",
      "Facility registration and product listing"
    ],
    benefits: [
      "Access to the world's largest consumer market",
      "High credibility and consumer trust",
      "Streamlined customs clearance",
      "Foundation for other regulatory approvals"
    ],
    officialLink: "https://www.fda.gov/"
  },
  {
    name: "ISO 9001:2015",
    region: "International",
    flag: "🌍",
    description: "Quality Management System certification",
    categories: ["All Industries", "Manufacturing", "Services"],
    fullDescription: "ISO 9001:2015 is the international standard for Quality Management Systems (QMS). It provides a framework for consistent quality, customer satisfaction, and continuous improvement.",
    issuingBody: "Accredited Certification Bodies (ISO member organizations)",
    validityPeriod: "3 years with annual surveillance audits",
    requirements: [
      "Documented Quality Management System",
      "Process approach and risk-based thinking",
      "Internal audits and management reviews",
      "Customer focus and continuous improvement"
    ],
    benefits: [
      "Improved operational efficiency",
      "Enhanced customer satisfaction",
      "International recognition and credibility",
      "Requirement for many B2B contracts"
    ],
    officialLink: "https://www.iso.org/iso-9001-quality-management.html"
  },
  {
    name: "ISO 22000",
    region: "International",
    flag: "🌍",
    description: "Food Safety Management System",
    categories: ["Food Processing", "Packaging", "Agriculture"],
    fullDescription: "ISO 22000 specifies requirements for a food safety management system covering all organizations in the food chain. It combines HACCP principles with prerequisite programs.",
    issuingBody: "Accredited Certification Bodies",
    validityPeriod: "3 years with annual surveillance audits",
    requirements: [
      "HACCP-based food safety management",
      "Prerequisite programs (PRPs)",
      "Traceability system implementation",
      "Hazard analysis and critical control points"
    ],
    benefits: [
      "Global food safety recognition",
      "Reduced risk of foodborne hazards",
      "Compliance with international trade requirements",
      "Integration with other ISO management systems"
    ],
    officialLink: "https://www.iso.org/iso-22000-food-safety-management.html"
  },
  {
    name: "BIS Certification",
    region: "India",
    flag: "🇮🇳",
    description: "Bureau of Indian Standards - Required for many exports from India",
    categories: ["Electronics", "Cement", "Steel", "Chemicals"],
    fullDescription: "BIS certification is India's national standards body certification. It ensures products conform to Indian standards and is mandatory for many product categories sold in India.",
    issuingBody: "Bureau of Indian Standards (Government of India)",
    validityPeriod: "1-2 years depending on product category",
    requirements: [
      "Application with product specifications",
      "Factory inspection and audit",
      "Product testing at BIS-recognized labs",
      "Quality management system documentation"
    ],
    benefits: [
      "Mandatory for selling in Indian market",
      "ISI mark enhances consumer trust",
      "Government tender eligibility",
      "Export documentation support"
    ],
    officialLink: "https://www.bis.gov.in/"
  },
  {
    name: "FSSAI License",
    region: "India",
    flag: "🇮🇳",
    description: "Food Safety and Standards Authority of India",
    categories: ["Food Products", "Beverages", "Spices", "Agricultural Products"],
    fullDescription: "FSSAI license is mandatory for all food business operators in India. It ensures food products meet safety and quality standards established by the Food Safety and Standards Authority of India.",
    issuingBody: "Food Safety and Standards Authority of India",
    validityPeriod: "1-5 years (renewable)",
    requirements: [
      "Business registration and premise details",
      "Food safety management plan",
      "Hygiene and sanitation compliance",
      "Product labeling as per FSSAI norms"
    ],
    benefits: [
      "Legal authorization to operate food business",
      "Consumer trust with FSSAI logo",
      "Access to organized retail channels",
      "Export compliance documentation"
    ],
    officialLink: "https://www.fssai.gov.in/"
  },
  {
    name: "HALAL Certified",
    region: "Middle East & SEA",
    flag: "🌙",
    description: "Islamic dietary standard certification",
    categories: ["Food Products", "Cosmetics", "Pharmaceuticals"],
    fullDescription: "HALAL certification confirms products are prepared according to Islamic law. Essential for exports to Muslim-majority countries and increasingly demanded globally.",
    issuingBody: "Recognized HALAL certification bodies (varies by country)",
    validityPeriod: "1-2 years with periodic audits",
    requirements: [
      "Ingredients must be HALAL-compliant",
      "Segregated production facilities",
      "No cross-contamination with HARAM products",
      "Traceability and documentation"
    ],
    benefits: [
      "Access to 1.8 billion Muslim consumers",
      "Growing demand in non-Muslim markets",
      "Premium pricing opportunities",
      "Requirement for GCC and Southeast Asian markets"
    ],
    officialLink: "https://www.jakim.gov.my/en/"
  },
  {
    name: "KOSHER Certified",
    region: "Global",
    flag: "✡️",
    description: "Jewish dietary law certification",
    categories: ["Food Products", "Beverages", "Ingredients"],
    fullDescription: "KOSHER certification indicates products comply with Jewish dietary laws. Beyond religious observance, it's valued by health-conscious consumers worldwide.",
    issuingBody: "Orthodox Union (OU), OK Kosher, Star-K, and other agencies",
    validityPeriod: "1 year with regular inspections",
    requirements: [
      "Ingredient verification and approval",
      "Dedicated equipment or proper cleaning",
      "Rabbinical supervision during production",
      "Documentation and traceability"
    ],
    benefits: [
      "Access to Jewish consumer market",
      "Perception of higher quality and purity",
      "Mainstream retail acceptance",
      "Complementary to HALAL certification"
    ],
    officialLink: "https://www.oukosher.org/"
  },
  {
    name: "UKCA Mark",
    region: "United Kingdom",
    flag: "🇬🇧",
    description: "UK Conformity Assessed - Post-Brexit product certification",
    categories: ["Electronics", "Machinery", "Medical Devices"],
    fullDescription: "UKCA (UK Conformity Assessed) marking is the UK's product marking requirement post-Brexit. It replaced CE marking for products placed on the Great Britain market.",
    issuingBody: "UK Approved Bodies",
    validityPeriod: "Valid as long as product design remains unchanged",
    requirements: [
      "Compliance with UK regulations",
      "Technical documentation",
      "UK Declaration of Conformity",
      "Assessment by UK Approved Body (if required)"
    ],
    benefits: [
      "Legal requirement for UK market access",
      "Shows compliance with UK safety standards",
      "Consumer confidence in UK market",
      "Separate from EU CE requirements"
    ],
    officialLink: "https://www.gov.uk/guidance/using-the-ukca-marking"
  },
  {
    name: "GMP Certified",
    region: "International",
    flag: "🌍",
    description: "Good Manufacturing Practice - Quality assurance",
    categories: ["Pharmaceuticals", "Cosmetics", "Food Processing"],
    fullDescription: "GMP certification ensures products are consistently produced and controlled according to quality standards. It minimizes risks in pharmaceutical and food production.",
    issuingBody: "National regulatory authorities (FDA, CDSCO, EMA, etc.)",
    validityPeriod: "Varies; requires regular inspections",
    requirements: [
      "Documented procedures and processes",
      "Qualified personnel and training",
      "Validated equipment and facilities",
      "Quality control and record-keeping"
    ],
    benefits: [
      "Mandatory for pharmaceutical manufacturing",
      "Reduced product recalls and liability",
      "International market access",
      "Consumer safety assurance"
    ],
    officialLink: "https://www.who.int/teams/health-product-and-policy-standards/standards-and-specifications/gmp"
  },
  {
    name: "SASO",
    region: "Saudi Arabia",
    flag: "🇸🇦",
    description: "Saudi Standards, Metrology and Quality Organization",
    categories: ["All Consumer Products", "Electronics", "Textiles"],
    fullDescription: "SASO certification is mandatory for most products entering Saudi Arabia. It ensures compliance with Saudi Arabian standards and technical regulations.",
    issuingBody: "Saudi Standards, Metrology and Quality Organization",
    validityPeriod: "1 year (Certificate of Conformity per shipment)",
    requirements: [
      "Product testing at accredited laboratories",
      "Factory audit (for some products)",
      "SABER platform registration",
      "Certificate of Conformity (CoC) per shipment"
    ],
    benefits: [
      "Mandatory for Saudi Arabian market entry",
      "Access to GCC markets (mutual recognition)",
      "Streamlined customs clearance",
      "Growing market with high purchasing power"
    ],
    officialLink: "https://www.saso.gov.sa/"
  },
  {
    name: "OEKO-TEX",
    region: "International",
    flag: "🌍",
    description: "Textile product safety and sustainability certification",
    categories: ["Textiles", "Garments", "Fabrics", "Home Furnishings"],
    fullDescription: "OEKO-TEX certification tests textiles for harmful substances. STANDARD 100 is the most common label, ensuring products are safe for human health.",
    issuingBody: "OEKO-TEX Association (18 member institutes worldwide)",
    validityPeriod: "1 year with annual renewal testing",
    requirements: [
      "Laboratory testing for harmful substances",
      "Compliance with limit values for chemicals",
      "Random testing and market surveillance",
      "Full supply chain traceability"
    ],
    benefits: [
      "Consumer confidence in textile safety",
      "Requirement for major fashion retailers",
      "Sustainability credentials",
      "Differentiation in competitive markets"
    ],
    officialLink: "https://www.oeko-tex.com/"
  }
];

export const ExportCertifications = () => {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  // SEO: Inject JSON-LD structured data
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Export Certifications Directory",
      "description": "Complete guide to international export certifications including CE Marking, FDA, ISO, BIS, FSSAI, HALAL, KOSHER, and more for global trade compliance.",
      "numberOfItems": certifications.length,
      "itemListElement": certifications.map((cert, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Service",
          "name": cert.name,
          "description": cert.fullDescription,
          "areaServed": cert.region,
          "provider": {
            "@type": "Organization",
            "name": cert.issuingBody
          },
          "category": cert.categories.join(", ")
        }
      }))
    };

    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is CE marking and why is it required?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CE marking indicates that a product complies with EU health, safety, and environmental protection standards. It is mandatory for products sold within the European Economic Area (EEA) covering electronics, machinery, medical devices, and toys."
          }
        },
        {
          "@type": "Question",
          "name": "How do I get FDA approval for exporting to USA?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "FDA approval requires pre-market approval or clearance application, clinical trials for drugs and medical devices, Good Manufacturing Practice (GMP) compliance, and facility registration with product listing."
          }
        },
        {
          "@type": "Question",
          "name": "What certifications are required for exporting food products from India?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For exporting food products from India, you typically need FSSAI license, and depending on destination: FDA approval (USA), ISO 22000 (international), HALAL certification (Middle East/SEA), or KOSHER certification (global Jewish markets)."
          }
        }
      ]
    };

    // Remove existing scripts
    const existingScript = document.getElementById('export-cert-schema');
    const existingFaqScript = document.getElementById('export-cert-faq-schema');
    if (existingScript) existingScript.remove();
    if (existingFaqScript) existingFaqScript.remove();

    // Add structured data
    const script = document.createElement('script');
    script.id = 'export-cert-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    const faqScript = document.createElement('script');
    faqScript.id = 'export-cert-faq-schema';
    faqScript.type = 'application/ld+json';
    faqScript.text = JSON.stringify(faqData);
    document.head.appendChild(faqScript);

    return () => {
      const scriptToRemove = document.getElementById('export-cert-schema');
      const faqScriptToRemove = document.getElementById('export-cert-faq-schema');
      if (scriptToRemove) scriptToRemove.remove();
      if (faqScriptToRemove) faqScriptToRemove.remove();
    };
  }, []);

  return (
    <section className="py-16 bg-background" id="export-certifications" aria-labelledby="certifications-heading">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
            <h2 id="certifications-heading" className="text-3xl md:text-4xl font-bold">
              Export Certifications Directory
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Complete guide to international export certifications for global trade compliance. 
            Click on any certification to view detailed requirements, issuing bodies, and benefits.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {certifications.map((cert, index) => (
            <Card 
              key={index} 
              className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50 group"
              onClick={() => setSelectedCert(cert)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cert.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{cert.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cert.region}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cert.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {cert.categories.slice(0, 2).map((cat, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {cert.categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{cert.categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certification Details Modal */}
        <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedCert && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{selectedCert.flag}</span>
                    <div>
                      <DialogTitle className="text-2xl flex items-center gap-2">
                        {selectedCert.name}
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </DialogTitle>
                      <DialogDescription className="text-base mt-1">
                        {selectedCert.region}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Overview */}
                  <div>
                    <p className="text-muted-foreground">{selectedCert.fullDescription}</p>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Issuing Body</p>
                        <p className="text-sm text-muted-foreground">{selectedCert.issuingBody}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Validity Period</p>
                        <p className="text-sm text-muted-foreground">{selectedCert.validityPeriod}</p>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Applicable Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCert.categories.map((cat, i) => (
                        <Badge key={i} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Key Requirements
                    </h4>
                    <ul className="space-y-2">
                      {selectedCert.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Benefits
                    </h4>
                    <ul className="space-y-2">
                      {selectedCert.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Official Link */}
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedCert.officialLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Official Website
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
