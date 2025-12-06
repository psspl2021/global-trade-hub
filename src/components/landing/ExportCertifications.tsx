import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle2 } from "lucide-react";

const certifications = [
  {
    name: "CE Marking",
    region: "European Union",
    flag: "🇪🇺",
    description: "Conformité Européenne - Product safety standard for EU markets",
    categories: ["Electronics", "Machinery", "Medical Devices", "Toys"]
  },
  {
    name: "FDA Approved",
    region: "United States",
    flag: "🇺🇸",
    description: "Food and Drug Administration certification for USA imports",
    categories: ["Food Products", "Pharmaceuticals", "Medical Devices", "Cosmetics"]
  },
  {
    name: "ISO 9001:2015",
    region: "International",
    flag: "🌍",
    description: "Quality Management System certification",
    categories: ["All Industries", "Manufacturing", "Services"]
  },
  {
    name: "ISO 22000",
    region: "International",
    flag: "🌍",
    description: "Food Safety Management System",
    categories: ["Food Processing", "Packaging", "Agriculture"]
  },
  {
    name: "BIS Certification",
    region: "India",
    flag: "🇮🇳",
    description: "Bureau of Indian Standards - Required for many exports from India",
    categories: ["Electronics", "Cement", "Steel", "Chemicals"]
  },
  {
    name: "FSSAI License",
    region: "India",
    flag: "🇮🇳",
    description: "Food Safety and Standards Authority of India",
    categories: ["Food Products", "Beverages", "Spices", "Agricultural Products"]
  },
  {
    name: "HALAL Certified",
    region: "Middle East & SEA",
    flag: "🌙",
    description: "Islamic dietary standard certification",
    categories: ["Food Products", "Cosmetics", "Pharmaceuticals"]
  },
  {
    name: "KOSHER Certified",
    region: "Global",
    flag: "✡️",
    description: "Jewish dietary law certification",
    categories: ["Food Products", "Beverages", "Ingredients"]
  },
  {
    name: "UKCA Mark",
    region: "United Kingdom",
    flag: "🇬🇧",
    description: "UK Conformity Assessed - Post-Brexit product certification",
    categories: ["Electronics", "Machinery", "Medical Devices"]
  },
  {
    name: "GMP Certified",
    region: "International",
    flag: "🌍",
    description: "Good Manufacturing Practice - Quality assurance",
    categories: ["Pharmaceuticals", "Cosmetics", "Food Processing"]
  },
  {
    name: "SASO",
    region: "Saudi Arabia",
    flag: "🇸🇦",
    description: "Saudi Standards, Metrology and Quality Organization",
    categories: ["All Consumer Products", "Electronics", "Textiles"]
  },
  {
    name: "OEKO-TEX",
    region: "International",
    flag: "🌍",
    description: "Textile product safety and sustainability certification",
    categories: ["Textiles", "Garments", "Fabrics", "Home Furnishings"]
  }
];

export const ExportCertifications = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Export Certifications Directory
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find suppliers with the certifications you need for your target market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {certifications.map((cert, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cert.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-sm">{cert.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{cert.region}</p>
                    <p className="text-xs text-muted-foreground mt-2">{cert.description}</p>
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
      </div>
    </section>
  );
};
