import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { AEOFAQSection, AILinkingSection } from "@/components/seo";
import { 
  ArrowLeft, 
  ArrowRight, 
  Globe, 
  Building2, 
  FileCheck, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

const certificationData: Record<string, {
  name: string;
  region: string;
  flag: string;
  fullDescription: string;
  issuingAuthority: string;
  issuingAuthorityUrl: string;
  applicability: string[];
  requiredDocuments: string[];
  countries: string[];
  industries: string[];
  validityPeriod: string;
  renewalProcess: string;
}> = {
  "ce-marking": {
    name: "CE Marking",
    region: "European Union",
    flag: "🇪🇺",
    fullDescription: "CE Marking (Conformité Européenne) indicates that a product complies with EU legislation and allows free movement of products within the European market. It is mandatory for products sold in the European Economic Area (EEA).",
    issuingAuthority: "European Commission / Notified Bodies",
    issuingAuthorityUrl: "https://ec.europa.eu/growth/single-market/ce-marking_en",
    applicability: [
      "Products sold within the European Economic Area",
      "Products that fall under specific CE marking directives",
      "Manufacturers and importers of regulated products"
    ],
    requiredDocuments: [
      "Technical documentation",
      "Declaration of Conformity (DoC)",
      "Test reports from accredited laboratories",
      "Quality management system documentation"
    ],
    countries: ["All EU member states", "EEA countries", "Turkey", "Switzerland (limited)"],
    industries: ["Electronics", "Machinery", "Medical Devices", "Toys", "Construction Products"],
    validityPeriod: "Valid as long as product and regulations remain unchanged",
    renewalProcess: "Re-certification required if product design or applicable regulations change"
  },
  "fda-approved": {
    name: "FDA Approved",
    region: "United States",
    flag: "🇺🇸",
    fullDescription: "FDA (Food and Drug Administration) approval or registration ensures that products meet US federal standards for safety and efficacy. Required for food, drugs, medical devices, and cosmetics entering the US market.",
    issuingAuthority: "U.S. Food and Drug Administration",
    issuingAuthorityUrl: "https://www.fda.gov",
    applicability: [
      "Food products imported to or sold in the US",
      "Pharmaceutical products and drugs",
      "Medical devices and equipment",
      "Cosmetics and personal care products"
    ],
    requiredDocuments: [
      "FDA registration number",
      "Prior Notice for food imports",
      "510(k) submission for medical devices",
      "Drug Master Files (for pharmaceuticals)"
    ],
    countries: ["United States", "US territories"],
    industries: ["Food Products", "Pharmaceuticals", "Medical Devices", "Cosmetics"],
    validityPeriod: "Facility registration renewed annually (October-December)",
    renewalProcess: "Annual renewal for facility registration; product approvals vary by type"
  },
  "iso-9001-2015": {
    name: "ISO 9001:2015",
    region: "International",
    flag: "🌐",
    fullDescription: "ISO 9001:2015 is an international standard for Quality Management Systems (QMS). It provides a framework for consistent quality, customer satisfaction, and continuous improvement in any organization.",
    issuingAuthority: "Accredited Certification Bodies (ISO member bodies)",
    issuingAuthorityUrl: "https://www.iso.org/iso-9001-quality-management.html",
    applicability: [
      "Organizations of any size or industry",
      "Companies seeking to demonstrate quality commitment",
      "Suppliers to government or large enterprises"
    ],
    requiredDocuments: [
      "Quality manual and procedures",
      "Process documentation",
      "Internal audit records",
      "Management review minutes"
    ],
    countries: ["Recognized globally in 170+ countries"],
    industries: ["All Industries", "Manufacturing", "Services", "Healthcare", "IT"],
    validityPeriod: "3 years with annual surveillance audits",
    renewalProcess: "Re-certification audit every 3 years"
  },
  "iso-22000": {
    name: "ISO 22000",
    region: "International",
    flag: "🌐",
    fullDescription: "ISO 22000 is the international standard for Food Safety Management Systems (FSMS). It combines HACCP principles with prerequisite programs to ensure food safety throughout the supply chain.",
    issuingAuthority: "Accredited Certification Bodies",
    issuingAuthorityUrl: "https://www.iso.org/iso-22000-food-safety-management.html",
    applicability: [
      "Food manufacturers and processors",
      "Food packaging companies",
      "Food service and catering",
      "Food transport and storage"
    ],
    requiredDocuments: [
      "HACCP plan documentation",
      "Food safety manual",
      "Traceability records",
      "Prerequisite programs (PRPs)"
    ],
    countries: ["Recognized globally"],
    industries: ["Food Processing", "Packaging", "Agriculture", "Food Service"],
    validityPeriod: "3 years with annual surveillance audits",
    renewalProcess: "Re-certification audit every 3 years"
  },
  "bis-certification": {
    name: "BIS Certification",
    region: "India",
    flag: "🇮🇳",
    fullDescription: "BIS (Bureau of Indian Standards) certification is India's national standards body certification. It ensures products meet Indian quality and safety standards, mandatory for many product categories under Quality Control Orders.",
    issuingAuthority: "Bureau of Indian Standards",
    issuingAuthorityUrl: "https://www.bis.gov.in",
    applicability: [
      "Products covered under mandatory QCO (Quality Control Orders)",
      "Electronics and IT goods",
      "Steel and cement products",
      "Household electrical appliances"
    ],
    requiredDocuments: [
      "Application form and fees",
      "Factory inspection clearance",
      "Test reports from BIS-recognized labs",
      "Quality management documentation"
    ],
    countries: ["India"],
    industries: ["Electronics", "Machinery", "Steel", "Cement", "Consumer Goods"],
    validityPeriod: "1-2 years depending on product category",
    renewalProcess: "Renewal application with continued compliance verification"
  },
  "fssai-license": {
    name: "FSSAI License",
    region: "India",
    flag: "🇮🇳",
    fullDescription: "FSSAI (Food Safety and Standards Authority of India) license is mandatory for all food businesses operating in India. It ensures food products meet safety and hygiene standards for manufacturing, storage, distribution, and sale.",
    issuingAuthority: "Food Safety and Standards Authority of India",
    issuingAuthorityUrl: "https://fssai.gov.in",
    applicability: [
      "Food manufacturers and processors",
      "Food importers and exporters",
      "Food retailers and restaurants",
      "Food storage and transport businesses"
    ],
    requiredDocuments: [
      "Identity and address proof",
      "Business incorporation documents",
      "Food safety management plan",
      "List of food products and categories"
    ],
    countries: ["India"],
    industries: ["Food Products", "Beverages", "Food Service", "Food Retail"],
    validityPeriod: "1-5 years based on license type",
    renewalProcess: "Apply for renewal 30 days before expiry"
  },
  "halal-certified": {
    name: "HALAL Certified",
    region: "Middle East & Southeast Asia",
    flag: "🌙",
    fullDescription: "HALAL certification confirms that products and processes comply with Islamic dietary laws. Essential for food, cosmetics, and pharmaceutical products targeting Muslim consumers in the Middle East, Southeast Asia, and globally.",
    issuingAuthority: "Recognized HALAL certification bodies (varies by country)",
    issuingAuthorityUrl: "https://www.halalrc.org",
    applicability: [
      "Food products for Muslim consumers",
      "Cosmetics and personal care products",
      "Pharmaceutical products",
      "Food service and hospitality"
    ],
    requiredDocuments: [
      "Product ingredient list and sources",
      "Manufacturing process documentation",
      "Supplier HALAL certificates",
      "Sanitation and hygiene procedures"
    ],
    countries: ["Saudi Arabia", "UAE", "Malaysia", "Indonesia", "Global Muslim markets"],
    industries: ["Food Products", "Cosmetics", "Pharmaceuticals", "Food Service"],
    validityPeriod: "1-2 years depending on certification body",
    renewalProcess: "Annual audit and renewal application"
  },
  "kosher-certified": {
    name: "KOSHER Certified",
    region: "Global",
    flag: "✡️",
    fullDescription: "KOSHER certification confirms that products comply with Jewish dietary laws (kashrut). Required for food products targeting Jewish consumers and increasingly valued by health-conscious consumers worldwide.",
    issuingAuthority: "Recognized Kosher certification agencies (OU, OK, Star-K, etc.)",
    issuingAuthorityUrl: "https://oukosher.org",
    applicability: [
      "Food products for Jewish consumers",
      "Ingredients used in food manufacturing",
      "Food service establishments",
      "Health-conscious consumer products"
    ],
    requiredDocuments: [
      "Complete ingredient list with sources",
      "Manufacturing equipment documentation",
      "Production schedule",
      "Supplier kosher certificates"
    ],
    countries: ["Israel", "United States", "Global Jewish communities"],
    industries: ["Food Products", "Beverages", "Food Ingredients"],
    validityPeriod: "1 year with periodic inspections",
    renewalProcess: "Annual contract renewal and facility inspection"
  },
  "ukca-marking": {
    name: "UKCA Marking",
    region: "United Kingdom",
    flag: "🇬🇧",
    fullDescription: "UKCA (UK Conformity Assessed) marking is the UK's post-Brexit product marking for goods sold in Great Britain (England, Wales, Scotland). It replaces CE marking for the UK market and covers similar product categories.",
    issuingAuthority: "UK Approved Bodies",
    issuingAuthorityUrl: "https://www.gov.uk/guidance/using-the-ukca-marking",
    applicability: [
      "Products sold in Great Britain (not Northern Ireland)",
      "Products previously requiring CE marking",
      "Manufacturers and importers to UK market"
    ],
    requiredDocuments: [
      "UK Declaration of Conformity",
      "Technical documentation",
      "Test reports from UK Approved Bodies",
      "Quality management documentation"
    ],
    countries: ["England", "Wales", "Scotland"],
    industries: ["Electronics", "Machinery", "Medical Devices", "Construction Products"],
    validityPeriod: "Valid as long as product and regulations remain unchanged",
    renewalProcess: "Re-assessment if product design or UK regulations change"
  },
  "gmp-certified": {
    name: "GMP Certified",
    region: "International",
    flag: "🌐",
    fullDescription: "GMP (Good Manufacturing Practice) certification ensures products are consistently produced and controlled according to quality standards. Essential for pharmaceuticals, cosmetics, food, and medical devices manufacturing.",
    issuingAuthority: "National regulatory agencies and certification bodies",
    issuingAuthorityUrl: "https://www.who.int/teams/health-product-and-policy-standards/standards-and-specifications/gmp",
    applicability: [
      "Pharmaceutical manufacturers",
      "Cosmetics and personal care manufacturers",
      "Food processing facilities",
      "Medical device manufacturers"
    ],
    requiredDocuments: [
      "Quality management documentation",
      "Standard Operating Procedures (SOPs)",
      "Batch manufacturing records",
      "Validation and qualification reports"
    ],
    countries: ["Recognized globally by regulatory agencies"],
    industries: ["Pharmaceuticals", "Cosmetics", "Food Processing", "Medical Devices"],
    validityPeriod: "2-3 years with periodic inspections",
    renewalProcess: "Re-certification audit required"
  },
  "saso-certified": {
    name: "SASO Certified",
    region: "Saudi Arabia",
    flag: "🇸🇦",
    fullDescription: "SASO (Saudi Standards, Metrology and Quality Organization) certification is required for products exported to Saudi Arabia. It ensures products meet Saudi technical regulations and quality standards.",
    issuingAuthority: "Saudi Standards, Metrology and Quality Organization",
    issuingAuthorityUrl: "https://www.saso.gov.sa",
    applicability: [
      "All regulated products exported to Saudi Arabia",
      "Consumer goods and electronics",
      "Automotive products",
      "Building materials and equipment"
    ],
    requiredDocuments: [
      "Product conformity certificate",
      "Test reports from accredited labs",
      "Technical documentation",
      "Shipment documentation"
    ],
    countries: ["Saudi Arabia"],
    industries: ["All Consumer Products", "Electronics", "Automotive", "Construction"],
    validityPeriod: "Per shipment or product registration validity",
    renewalProcess: "New certification for each shipment or product change"
  },
  "oeko-tex": {
    name: "OEKO-TEX",
    region: "International",
    flag: "🌐",
    fullDescription: "OEKO-TEX certification is the world's leading label for textiles tested for harmful substances. It ensures textiles and leather products are safe for human health and produced sustainably.",
    issuingAuthority: "OEKO-TEX Association",
    issuingAuthorityUrl: "https://www.oeko-tex.com",
    applicability: [
      "Textile raw materials (fibers, yarns)",
      "Finished textile products",
      "Leather products",
      "Textile and leather production facilities"
    ],
    requiredDocuments: [
      "Product samples for testing",
      "Manufacturing process documentation",
      "Chemical inventory and MSDS",
      "Supply chain documentation"
    ],
    countries: ["Recognized globally in 100+ countries"],
    industries: ["Textiles", "Garments", "Leather", "Home Textiles"],
    validityPeriod: "1 year with annual renewal",
    renewalProcess: "Annual testing and certification renewal"
  }
};

const ExportCertificationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const certification = slug ? certificationData[slug] : null;

  useSEO({
    title: certification 
      ? `${certification.name} Certification Guide | Export Compliance | ProcureSaathi`
      : "Export Certification | ProcureSaathi",
    description: certification
      ? `Complete guide to ${certification.name} certification for ${certification.region}. Learn requirements, documents needed, and how to get certified for international trade.`
      : "Export certification guides for international trade compliance.",
    keywords: certification
      ? `${certification.name}, export certification, ${certification.region} compliance, international trade, export documentation`
      : "export certification, international trade, compliance",
    canonical: `https://procuresaathi.com/export-certification/${slug}`,
  });

  useEffect(() => {
    if (certification) {
      injectStructuredData(getBreadcrumbSchema([
        { name: "Home", url: "https://procuresaathi.com" },
        { name: "Export-Import Guide", url: "https://procuresaathi.com/export-import-sourcing-guide" },
        { name: certification.name, url: `https://procuresaathi.com/export-certification/${slug}` },
      ]), "cert-breadcrumb");

      injectStructuredData({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": `${certification.name} Certification Guide`,
        "description": certification.fullDescription,
        "author": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ProcureSaathi"
        }
      }, "cert-article");
    }
  }, [certification, slug]);

  if (!certification) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Certification Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The requested certification guide could not be found.
          </p>
          <Button onClick={() => navigate('/export-import-sourcing-guide')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Export Guide
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/export-import-sourcing-guide')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Export Guide
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{certification.flag}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                {certification.name}
              </h1>
              <p className="text-muted-foreground">{certification.region}</p>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-3xl">
            {certification.fullDescription}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Issuing Authority */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Issuing Authority</h2>
                  </div>
                  <p className="text-muted-foreground mb-3">{certification.issuingAuthority}</p>
                  <a 
                    href={certification.issuingAuthorityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Visit Official Website →
                  </a>
                </CardContent>
              </Card>

              {/* Applicability */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Applicability</h2>
                  </div>
                  <ul className="space-y-2">
                    {certification.applicability.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Required Documents */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Required Documents</h2>
                  </div>
                  <ul className="space-y-2">
                    {certification.requiredDocuments.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Validity & Renewal */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Validity & Renewal</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Validity Period</p>
                      <p className="font-medium">{certification.validityPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Renewal Process</p>
                      <p className="font-medium">{certification.renewalProcess}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Info */}
            <div className="space-y-6">
              
              {/* Countries */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Applicable Countries</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {certification.countries.map((country, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Industries */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Applicable Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {certification.industries.map((industry, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Need Certified Suppliers?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with verified suppliers holding {certification.name} certification.
                  </p>
                  <Button 
                    className="w-full gradient-primary"
                    onClick={() => navigate('/post-rfq')}
                  >
                    Post RFQ – Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Citation */}
      <section className="py-8 bg-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground text-center max-w-4xl mx-auto">
            ProcureSaathi is an AI-powered B2B procurement platform that verifies supplier certifications 
            including {certification.name}. Our platform connects buyers with certified suppliers 
            for domestic and international trade.
          </p>
        </div>
      </section>

      <AEOFAQSection schemaId={`cert-${slug}-faq`} />
      <AILinkingSection />

      <Footer />
    </div>
  );
};

export default ExportCertificationPage;
