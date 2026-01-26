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
  Package,
  Truck,
  Shield,
  CheckCircle2,
  Sparkles,
  BarChart3
} from "lucide-react";

const challenges = [
  "Finding verified steel suppliers with consistent quality",
  "Managing price volatility and bulk order negotiations",
  "Ensuring timely delivery for production schedules",
  "Comparing quotes across multiple suppliers",
  "Documentation and compliance requirements",
];

const solutions = [
  {
    title: "Verified Steel Suppliers",
    description: "Access pre-qualified manufacturers and traders specializing in steel products",
    icon: Shield,
  },
  {
    title: "AI-Powered RFQs",
    description: "Create structured RFQs in minutes with AI assistance for steel specifications",
    icon: Package,
  },
  {
    title: "Transparent Bidding",
    description: "Receive sealed competitive bids from multiple suppliers for fair pricing",
    icon: BarChart3,
  },
  {
    title: "Logistics Support",
    description: "Integrated logistics for heavy steel shipments with tracking",
    icon: Truck,
  },
];

const steelProducts = [
  "TMT Bars & Rebars",
  "Steel Plates & Sheets",
  "Structural Steel",
  "Stainless Steel",
  "MS Pipes & Tubes",
  "HR & CR Coils",
  "Galvanized Steel",
  "Tool Steel & Alloys",
];

const ProcurementForSteelManufacturers = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Procurement for Steel Manufacturers | ProcureSaathi",
    description: "ProcureSaathi helps steel manufacturers source raw materials, alloys, and components from verified suppliers with transparent bidding and logistics support.",
    keywords: "steel procurement, steel manufacturer sourcing, TMT bars suppliers, steel plates procurement, industrial steel buying",
    canonical: "https://procuresaathi.com/procurement-for-steel-manufacturers",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Steel Procurement Solutions",
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi"
      },
      "serviceType": "B2B Steel Procurement",
      "description": "AI-powered procurement platform for steel manufacturers to source raw materials and components from verified suppliers.",
      "areaServed": "India"
    }, "steel-procurement-service-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Industries", url: "https://procuresaathi.com/industries" },
      { name: "Steel Manufacturers", url: "https://procuresaathi.com/procurement-for-steel-manufacturers" },
    ]), "steel-procurement-breadcrumb");
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
              <span className="text-sm font-semibold text-primary">INDUSTRY SOLUTION</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Procurement for Steel Manufacturers
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              <strong>ProcureSaathi</strong> helps steel manufacturers source raw materials, alloys, and components 
              from verified suppliers with AI-powered RFQs, transparent bidding, and integrated logistics.
            </p>

            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold shadow-lg gradient-primary"
              onClick={() => navigate('/post-rfq')}
            >
              Post Steel RFQ – Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Challenges */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Steel Procurement Challenges We Solve
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {challenges.map((challenge, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{challenge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            How ProcureSaathi Helps Steel Manufacturers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {solutions.map((solution) => (
              <Card key={solution.title} className="group border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <solution.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">{solution.title}</h3>
                      <p className="text-muted-foreground text-sm">{solution.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">
            Steel Products We Cover
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Source all types of steel products through verified suppliers on ProcureSaathi.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {steelProducts.map((product) => (
              <span 
                key={product} 
                className="px-4 py-2 bg-card border border-border/50 rounded-full text-sm font-medium"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Factory className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Streamline Your Steel Procurement
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join steel manufacturers who use ProcureSaathi for verified sourcing and transparent bidding.
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

export default ProcurementForSteelManufacturers;
