import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/landing/PageHeader";
import { 
  ArrowRight, 
  Users, 
  Globe, 
  Search,
  FileText,
  CheckCircle2,
  Shield,
  Clock,
  TrendingDown,
  Zap,
  Package,
  Target,
  BadgeCheck,
  Factory,
  ShoppingCart,
  Building2
} from "lucide-react";

const stats = [
  { value: "1000+", label: "Verified Suppliers", icon: Users },
  { value: "23+", label: "Categories", icon: Package },
  { value: "50%", label: "Avg. Savings", icon: TrendingDown },
  { value: "48hrs", label: "Quote Time", icon: Clock },
];

const benefits = [
  { title: "Verified Supplier Network", icon: BadgeCheck },
  { title: "Sealed Competitive Bidding", icon: Shield },
  { title: "AI-Powered Matching", icon: Zap },
  { title: "End-to-End Support", icon: Users },
  { title: "Quality Assured Products", icon: CheckCircle2 },
  { title: "Transparent Pricing", icon: Target },
];

const buyerTypes = [
  {
    title: "Private Label Buyers",
    description: "Get custom products made by verified Indian manufacturers with your branding",
    icon: Factory,
    features: ["Custom Manufacturing", "Quality Control", "Brand Development", "Low MOQs"],
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "E-commerce Sellers",
    description: "Source white-label goods fast, with competitive pricing and low minimum orders",
    icon: ShoppingCart,
    features: ["Fast Sourcing", "White-label Ready", "Competitive Prices", "Quick Delivery"],
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    title: "Procurement Managers",
    description: "Raise bulk RFQs, manage multiple suppliers efficiently with enterprise tools",
    icon: Building2,
    features: ["Bulk Orders", "Supplier Management", "RFQ System", "Compliance Tools"],
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Foreign Buyers",
    description: "Trusted sourcing from India with dedicated concierge support and guidance",
    icon: Globe,
    features: ["Cultural Bridge", "Export Assistance", "Quality Assurance", "End-to-end Support"],
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Describe What You Need",
    description: "Tell us your product specs, quantity, timeline, and budget requirements.",
    icon: FileText,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    badgeColor: "bg-primary text-primary-foreground",
  },
  {
    step: 2,
    title: "AI + Team Finds Suppliers",
    description: "Our AI matches you with verified suppliers. Our team onboards new ones if needed.",
    icon: Search,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badgeColor: "bg-amber-500 text-white",
  },
  {
    step: 3,
    title: "Evaluate & Place Orders",
    description: "Compare quotes, negotiate terms, and place your purchase order with confidence.",
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeColor: "bg-green-500 text-white",
  },
];

const features = [
  {
    title: "Verified Suppliers",
    description: "Every supplier is vetted for quality, compliance, and reliability.",
    icon: BadgeCheck,
  },
  {
    title: "Sealed Bidding",
    description: "Suppliers can't see each other's bids, ensuring competitive pricing.",
    icon: Shield,
  },
  {
    title: "AI Matching",
    description: "Smart algorithms match your requirements with the right suppliers.",
    icon: Zap,
  },
  {
    title: "Global Sourcing",
    description: "Access suppliers from across India and international markets.",
    icon: Globe,
  },
  {
    title: "Quality Assurance",
    description: "Comprehensive quality checks and inspection services available.",
    icon: CheckCircle2,
  },
  {
    title: "Dedicated Support",
    description: "Expert procurement team to guide you through every step.",
    icon: Users,
  },
];

const Buyer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/80 mb-6">
              <span className="text-sm font-medium text-muted-foreground">SMART PROCUREMENT</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Source Smarter with{" "}
              <span className="text-primary">Verified Suppliers</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Post your requirements and receive competitive sealed bids from 1000+ 
              verified suppliers across 23+ categories.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Start Sourcing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="link" 
                className="text-primary text-lg"
                onClick={() => navigate('/login')}
              >
                Already a Buyer? Sign In
              </Button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat) => (
              <Card key={stat.label} className="border border-border bg-card">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Buy Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Buy on ProcureSaathi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {benefits.map((benefit) => (
              <div 
                key={benefit.title} 
                className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border"
              >
                <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                <span className="font-medium">{benefit.title}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg"
              onClick={() => navigate('/signup?role=buyer')}
            >
              Post Your First Requirement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Built for Every B2B Buyer */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Every B2B Buyer
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're sourcing for private label, bulk procurement, or e-commerce, 
              we have the right solution for your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {buyerTypes.map((type) => (
              <Card 
                key={type.title}
                className="bg-card border border-border hover:shadow-lg transition-all"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${type.iconBg} flex items-center justify-center mb-4`}>
                    <type.icon className={`h-7 w-7 ${type.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {type.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/signup?role=buyer')}
                  >
                    Know more
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent sourcing process designed for modern B2B buyers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((item) => (
              <Card key={item.step} className="relative border border-border text-center">
                <CardContent className="p-8">
                  <div className="relative inline-block mb-4">
                    <div className={`w-16 h-16 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                      <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                    </div>
                    <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full ${item.badgeColor} flex items-center justify-center text-sm font-bold`}>
                      {String(item.step).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Procurement Made <span className="text-primary">Simple</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to source quality products at the best prices.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Search className="h-12 w-12 text-primary-foreground mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Sourcing?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of buyers already saving time and money on ProcureSaathi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary"
                onClick={() => navigate('/browse')}
              >
                Browse Suppliers
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Link */}
      <section className="py-8 text-center">
        <Button 
          variant="link" 
          className="text-muted-foreground"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </section>
    </div>
  );
};

export default Buyer;
