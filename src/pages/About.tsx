import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { Footer } from "@/components/landing/Footer";
import { 
  Building2, 
  Target, 
  Users, 
  Shield, 
  Globe, 
  Award,
  CheckCircle2,
  TrendingUp,
  Handshake,
  Lightbulb,
  ArrowRight
} from "lucide-react";

const stats = [
  { value: "2021", label: "Founded", icon: Building2 },
  { value: "1000+", label: "Verified Suppliers", icon: Users },
  { value: "500+", label: "Active Buyers", icon: TrendingUp },
  { value: "50+", label: "Countries Served", icon: Globe },
];

const values = [
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "We believe in sealed bidding and transparent pricing. Every transaction is fair, with no hidden fees or middlemen manipulation.",
  },
  {
    icon: CheckCircle2,
    title: "Verified Network",
    description: "Every supplier and buyer on our platform is thoroughly verified. We ensure you're dealing with legitimate businesses.",
  },
  {
    icon: Handshake,
    title: "End-to-End Support",
    description: "From requirement posting to delivery, our team supports you at every step. We're your procurement partner, not just a platform.",
  },
  {
    icon: Lightbulb,
    title: "Innovation-First",
    description: "AI-powered matching, smart analytics, and continuous platform improvements to make B2B procurement effortless.",
  },
];

const team = [
  {
    name: "Leadership Team",
    description: "Experienced professionals from procurement, technology, and trade backgrounds driving ProcureSaathi's vision.",
  },
  {
    name: "Technology Team",
    description: "Building cutting-edge AI and platform solutions to revolutionize B2B trade in India and globally.",
  },
  {
    name: "Operations Team",
    description: "Ensuring smooth transactions, quality verification, and exceptional customer experience.",
  },
];

const About = () => {
  const navigate = useNavigate();

  useSEO({
    title: "About ProcureSaathi | India's Trusted B2B Procurement Platform",
    description: "Learn about ProcureSaathi's mission to revolutionize B2B procurement in India. Connecting verified buyers with trusted suppliers since 2021. Transparent, efficient, and reliable.",
    keywords: "about ProcureSaathi, B2B procurement India, trusted supplier network, transparent bidding platform, Indian export platform",
    canonical: "https://procuresaathi.com/about",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ProcureSaathi",
      "url": "https://procuresaathi.com",
      "logo": "https://procuresaathi.com/procuresaathi-logo.png",
      "description": "India's trusted B2B procurement platform connecting verified buyers with trusted suppliers.",
      "foundingDate": "2021",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IN"
      },
      "sameAs": [
        "https://www.linkedin.com/company/procuresaathi"
      ]
    }, 'about-organization-schema');

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "About Us", url: "https://procuresaathi.com/about" }
    ]), 'about-breadcrumb-schema');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden gradient-mesh">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-6 animate-fade-in">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">ABOUT PROCURESAATHI</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-slide-up">
              Transforming B2B
              <span className="text-primary"> Procurement</span> in India
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up delay-100 leading-relaxed">
              ProcureSaathi is India's trusted B2B marketplace, connecting verified buyers with reliable suppliers 
              through transparent sealed bidding. We're on a mission to make industrial procurement 
              simple, fair, and efficient.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="group border-border/50 bg-card hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Making B2B Trade Simple, Transparent & Fair
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We started ProcureSaathi with a simple belief: B2B procurement shouldn't be complicated. 
                Traditional procurement is plagued by opaque pricing, unreliable suppliers, and endless negotiations.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our platform uses sealed bidding, verified supplier networks, and AI-powered matching 
                to create a marketplace where both buyers and suppliers win. No middlemen, no hidden fees—just 
                honest, efficient trade.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 md:p-10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Verified Partners Only</h3>
                    <p className="text-sm text-muted-foreground">Every supplier and buyer is thoroughly vetted before joining our network.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sealed Bidding System</h3>
                    <p className="text-sm text-muted-foreground">Fair, competitive pricing through our transparent bidding mechanism.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Handshake className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">End-to-End Support</h3>
                    <p className="text-sm text-muted-foreground">We assist you from requirement posting to successful delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Award className="h-4 w-4" />
              Our Values
            </div>
            <h2 className="section-title font-display">What We Stand For</h2>
            <p className="section-subtitle">
              These core values guide every decision we make and every feature we build.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value) => (
              <Card key={value.title} className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <value.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              Our Team
            </div>
            <h2 className="section-title font-display">The People Behind ProcureSaathi</h2>
            <p className="section-subtitle">
              A dedicated team of professionals passionate about transforming B2B trade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((dept) => (
              <Card key={dept.name} className="group border-border/50 hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-3">{dept.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{dept.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Ready to Transform Your Procurement?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Join thousands of businesses already benefiting from transparent, efficient B2B trade on ProcureSaathi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Start as Buyer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-10 text-lg font-medium bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-all"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Join as Supplier
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <StickySignupBanner />
    </div>
  );
};

export default About;