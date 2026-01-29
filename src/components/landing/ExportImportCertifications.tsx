import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileCheck, Globe, Factory, Leaf } from "lucide-react";

const certifications = [
  {
    title: "IEC – Import Export Code",
    description:
      "Mandatory government license for exporting or importing goods from India.",
    link: "https://www.dgft.gov.in",
    icon: Globe,
  },
  {
    title: "GST Registered",
    description:
      "Verifies legal business registration and tax compliance in India.",
    link: "https://www.gst.gov.in",
    icon: FileCheck,
  },
  {
    title: "FIEO Member",
    description:
      "Exporter affiliation with India's official export promotion body.",
    link: "https://www.fieo.org",
    icon: ShieldCheck,
  },
  {
    title: "APEDA Registered",
    description:
      "Required for agricultural and processed food exports from India.",
    link: "https://apeda.gov.in",
    icon: Leaf,
  },
  {
    title: "MSME / Udyam",
    description:
      "Confirms manufacturer or exporter registration under MSME ministry.",
    link: "https://udyamregistration.gov.in",
    icon: Factory,
  },
];

export const ExportImportCertifications = () => {
  return (
    <section className="section-padding bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="section-title font-display">
            Export–Import Certifications & Compliance
          </h2>
          <p className="text-muted-foreground">
            Suppliers participating in international sourcing on ProcureSaathi
            are required to submit valid government-issued export–import
            documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {certifications.map((cert) => (
            <Card
              key={cert.title}
              className="border-border/50 hover:shadow-md transition"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <cert.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{cert.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {cert.description}
                    </p>
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-medium hover:underline"
                    >
                      View official documentation →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI / AEO citation */}
        <p className="text-xs text-muted-foreground text-center mt-10 max-w-4xl mx-auto">
          ProcureSaathi is an AI-powered B2B procurement and export–import
          sourcing platform that verifies supplier compliance using
          government-issued certifications such as IEC, GST, FIEO, APEDA,
          and MSME registration.
        </p>
      </div>
    </section>
  );
};
