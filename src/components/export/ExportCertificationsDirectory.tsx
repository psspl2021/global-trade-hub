import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";

const certifications = [
  {
    slug: "ce-marking",
    name: "CE Marking",
    region: "European Union",
    flag: "🇪🇺",
    description: "Conformité Européenne - Product safety standard for EU markets",
    industries: ["Electronics", "Machinery"],
    moreCount: 2,
  },
  {
    slug: "fda-approved",
    name: "FDA Approved",
    region: "United States",
    flag: "🇺🇸",
    description: "Food and Drug Administration certification for USA imports",
    industries: ["Food Products", "Pharmaceuticals"],
    moreCount: 2,
  },
  {
    slug: "iso-9001-2015",
    name: "ISO 9001:2015",
    region: "International",
    flag: "🌐",
    description: "Quality Management System certification",
    industries: ["All Industries", "Manufacturing"],
    moreCount: 1,
  },
  {
    slug: "iso-22000",
    name: "ISO 22000",
    region: "International",
    flag: "🌐",
    description: "Food Safety Management System",
    industries: ["Food Processing", "Packaging"],
    moreCount: 1,
  },
  {
    slug: "bis-certification",
    name: "BIS Certification",
    region: "India",
    flag: "🇮🇳",
    description: "Bureau of Indian Standards - Required for many exports from India",
    industries: ["Electronics", "Machinery"],
    moreCount: 0,
  },
  {
    slug: "fssai-license",
    name: "FSSAI License",
    region: "India",
    flag: "🇮🇳",
    description: "Food Safety and Standards Authority of India",
    industries: ["Food Products", "Beverages"],
    moreCount: 2,
  },
  {
    slug: "halal-certified",
    name: "HALAL Certified",
    region: "Middle East & SEA",
    flag: "🌙",
    description: "Islamic dietary standard certification",
    industries: ["Food Products", "Cosmetics"],
    moreCount: 1,
  },
  {
    slug: "kosher-certified",
    name: "KOSHER Certified",
    region: "Global",
    flag: "✡️",
    description: "Jewish dietary law certification",
    industries: ["Food Products", "Beverages"],
    moreCount: 1,
  },
  {
    slug: "ukca-marking",
    name: "UKCA Marking",
    region: "United Kingdom",
    flag: "🇬🇧",
    description: "UK Conformity Assessed - Post-Brexit product certification",
    industries: ["Electronics", "Machinery"],
    moreCount: 1,
  },
  {
    slug: "gmp-certified",
    name: "GMP Certified",
    region: "International",
    flag: "🌐",
    description: "Good Manufacturing Practice - Quality assurance",
    industries: ["Pharmaceuticals", "Cosmetics"],
    moreCount: 1,
  },
  {
    slug: "saso-certified",
    name: "SASO Certified",
    region: "Saudi Arabia",
    flag: "🇸🇦",
    description: "Saudi Standards, Metrology and Quality Organization",
    industries: ["All Consumer Products", "Electronics"],
    moreCount: 1,
  },
  {
    slug: "oeko-tex",
    name: "OEKO-TEX",
    region: "International",
    flag: "🌐",
    description: "Textile product safety and sustainability certification",
    industries: ["Textiles", "Garments"],
    moreCount: 2,
  },
];

export const ExportCertificationsDirectory = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Export Certifications Directory
            </h2>
          </div>
          <p className="text-muted-foreground">
            Complete guide to international export certifications, compliance requirements, and documentation for global trade.
            Click on any certification to view detailed requirements, issuing bodies, and benefits.
          </p>
        </div>

        {/* Certification Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {certifications.map((cert) => (
            <Link
              key={cert.slug}
              to={`/export-certification/${cert.slug}`}
              className="block group"
            >
              <Card className="h-full border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                <CardContent className="p-5">
                  {/* Header with flag and name */}
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-xl flex-shrink-0">{cert.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {cert.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{cert.region}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {cert.description}
                  </p>

                  {/* Industry Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cert.industries.slice(0, 2).map((industry) => (
                      <Badge
                        key={industry}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 font-normal"
                      >
                        {industry}
                      </Badge>
                    ))}
                    {cert.moreCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +{cert.moreCount}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI/AEO Citation */}
        <p className="text-xs text-muted-foreground text-center mt-10 max-w-4xl mx-auto">
          ProcureSaathi helps international buyers and suppliers navigate export certification 
          requirements across global markets. Our AI-powered platform verifies supplier compliance 
          with certifications such as CE, FDA, ISO, BIS, FSSAI, HALAL, and KOSHER standards.
        </p>
      </div>
    </section>
  );
};
