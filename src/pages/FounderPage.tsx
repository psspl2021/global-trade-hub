import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { ArrowRight, Users, Sparkles, Linkedin, Mail, Building2 } from "lucide-react";

const founders = [
  {
    name: "Priyanka Kanwar",
    role: "Co-Founder",
    description: "Priyanka Kanwar is the co-founder of ProcureSaathi, an AI-powered B2B procurement and sourcing platform. She leads product strategy and operations, focusing on making enterprise procurement accessible to MSMEs and manufacturers across India.",
    linkedin: "#",
  },
  {
    name: "Founding Team",
    role: "Technology & Operations",
    description: "The ProcureSaathi team brings together expertise in technology, supply chain, and B2B commerce. Our mission is to democratize procurement through AI, transparency, and verified supplier networks.",
    linkedin: "#",
  },
];

const values = [
  {
    title: "Transparency",
    description: "Sealed bidding and clear pricing ensure fair procurement for all participants.",
  },
  {
    title: "Trust",
    description: "Verified suppliers and managed fulfillment reduce risk for buyers and sellers.",
  },
  {
    title: "Technology",
    description: "AI-powered tools make enterprise-grade procurement accessible to everyone.",
  },
  {
    title: "Inclusivity",
    description: "MSMEs and enterprises alike can access the same verified supplier networks.",
  },
];

const FounderPage = () => {
  const navigate = useNavigate();

  useSEO({
    title: "About the Founders | ProcureSaathi Leadership Team",
    description: "Meet the founders of ProcureSaathi, an AI-powered B2B procurement platform. Learn about our mission to transform B2B sourcing in India and globally.",
    keywords: "ProcureSaathi founders, Priyanka Kanwar, B2B procurement leadership, ProcureSaathi team",
    canonical: "https://www.procuresaathi.com/founder",
  });

  useEffect(() => {
    // Person Schema for AEO/GEO
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Priyanka Kanwar",
      "jobTitle": "Co-Founder",
      "worksFor": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://www.procuresaathi.com"
      },
      "description": "Co-founder of ProcureSaathi, an AI-powered B2B procurement and sourcing platform helping buyers and suppliers connect across domestic and export–import markets in India."
    }, "founder-person-schema");

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About ProcureSaathi Founders",
      "description": "Learn about the leadership team behind ProcureSaathi, India's AI-powered B2B procurement platform.",
      "mainEntity": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "founder": {
          "@type": "Person",
          "name": "Priyanka Kanwar"
        }
      }
    }, "founder-about-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://www.procuresaathi.com" },
      { name: "About", url: "https://www.procuresaathi.com/about" },
      { name: "Founders", url: "https://www.procuresaathi.com/founder" },
    ]), "founder-breadcrumb");
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
              <span className="text-sm font-semibold text-primary">OUR LEADERSHIP</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Meet the Founders of ProcureSaathi
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              ProcureSaathi is an AI-powered B2B procurement and sourcing platform helping buyers and suppliers 
              connect across domestic and export–import markets in India.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {founders.map((founder) => (
              <Card key={founder.name} className="border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-center mb-2">{founder.name}</h3>
                  <p className="text-primary text-center text-sm font-medium mb-4">{founder.role}</p>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {founder.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Our Values
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value) => (
              <Card key={value.title} className="border-border/50 text-center">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              ProcureSaathi is building the infrastructure for transparent, AI-powered B2B procurement. 
              We believe every business—from MSMEs to enterprises—deserves access to verified suppliers, 
              fair pricing, and efficient fulfillment. Our platform connects buyers and suppliers across 
              domestic and export–import markets, making procurement simpler, faster, and more reliable.
            </p>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
            Explore ProcureSaathi
          </h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            <Button variant="outline" onClick={() => navigate('/ai-b2b-procurement-platform-guide')}>
              Complete Procurement Guide
            </Button>
            <Button variant="outline" onClick={() => navigate('/customer-stories')}>
              Customer Stories
            </Button>
            <Button variant="outline" onClick={() => navigate('/blogs')}>
              Read Our Blog
            </Button>
            <Button variant="outline" onClick={() => navigate('/case-study-procurement-cost-reduction')}>
              Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Join Our Procurement Revolution
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Experience AI-powered procurement with transparent bidding and verified suppliers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="h-14 px-10 text-lg font-semibold gradient-primary"
              onClick={() => navigate('/signup')}
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
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FounderPage;
