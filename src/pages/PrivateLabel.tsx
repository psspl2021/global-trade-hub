import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/landing/PageHeader";
import { FreeCRMSection } from "@/components/landing/FreeCRMSection";
import { 
  ArrowRight, 
  Factory,
  Shield,
  Zap,
  Clock,
  Layers,
  UserCheck,
  CheckCircle,
  MessageSquare,
  Package,
  Sparkles,
  Globe,
  FileCheck,
  Truck
} from "lucide-react";

const stats = [
  { value: "1000+", label: "Verified Manufacturers", icon: Factory },
  { value: "50+", label: "Product Categories", icon: Package },
  { value: "100+", label: "Countries Served", icon: Globe },
  { value: "48hrs", label: "Sample Delivery", icon: Clock },
];

const features = [
  {
    icon: Factory,
    title: "Private Label & Custom Manufacturing",
    description: "Source supplements, skincare, wellness, and more—tailored to your formulation, branding, and MOQ needs"
  },
  {
    icon: Shield,
    title: "Verified Supplier Network",
    description: "Work only with pre-screened Indian manufacturers meeting international quality and compliance standards"
  },
  {
    icon: Zap,
    title: "Smart Vendor Matching",
    description: "We shortlist partners based on your exact brief, saving you weeks of searching"
  },
  {
    icon: Clock,
    title: "Faster Time to Market",
    description: "Cut back-and-forth delays and move from idea to ready-to-ship products quicker"
  },
  {
    icon: Layers,
    title: "End-to-End Coordination",
    description: "From sampling to bulk production, we manage the entire process for you"
  },
  {
    icon: UserCheck,
    title: "One Platform, Multiple Categories",
    description: "Explore products, packaging, and accessories without switching between multiple platforms"
  }
];

const conciergeServices = [
  { title: "Understanding your specs & product goals", icon: FileCheck },
  { title: "Shortlisting vetted, relevant manufacturers", icon: Factory },
  { title: "Coordinating meetings, calls, or site visits", icon: MessageSquare },
  { title: "Guiding certification & compliance needs", icon: Shield },
];

const categories = [
  "Supplements & Nutraceuticals",
  "Skincare & Cosmetics",
  "Hair Care Products",
  "Wellness & Ayurveda",
  "Food & Beverages",
  "Pet Care Products",
  "Home Care Products",
  "Baby Care Products"
];

const howItWorks = [
  {
    step: 1,
    title: "Share Your Requirements",
    description: "Tell us about your product idea, specifications, and target market.",
    icon: FileCheck,
  },
  {
    step: 2,
    title: "Get Matched",
    description: "Our team shortlists verified manufacturers matching your needs.",
    icon: Zap,
  },
  {
    step: 3,
    title: "Request Samples",
    description: "Order samples from selected manufacturers for quality evaluation.",
    icon: Package,
  },
  {
    step: 4,
    title: "Start Production",
    description: "Finalize terms and begin production with full support.",
    icon: Factory,
  },
];

const PrivateLabel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              1000+ Verified Manufacturers
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Source Private Label Products{" "}
              <span className="text-primary">Direct from India</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              From supplements to skincare, ProcureSaathi makes sourcing simple, smart, 
              and supported—powered by AI and backed by human expertise
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Start Sourcing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/login')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Talk to Concierge
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

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">Private Label</span> with Us
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to launch your own branded product line
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

      {/* White-Glove Concierge Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 md:p-12 border border-border">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    White-Glove Concierge for Every Buyer
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Our sourcing experts personally support you by:
                  </p>
                  <ul className="space-y-4">
                    {conciergeServices.map((service, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{service.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-muted/50 rounded-xl p-8 text-center mb-6 w-full max-w-xs">
                    <div className="text-5xl md:text-6xl font-bold text-primary mb-2">85%</div>
                    <p className="text-muted-foreground">Matched in 5 days</p>
                  </div>
                  <Button 
                    size="lg"
                    className="w-full max-w-xs h-14"
                    onClick={() => navigate('/signup?role=buyer')}
                  >
                    Get Personalized Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Popular Private Label Categories
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore products across diverse categories
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From idea to finished product in 4 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((item) => (
              <Card key={item.step} className="relative border border-border">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Free CRM Section */}
      <FreeCRMSection role="buyer" />

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Factory className="h-12 w-12 text-primary-foreground mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Launch Your Brand?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Connect with verified manufacturers and bring your product vision to life.
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
                onClick={() => navigate('/categories')}
              >
                Explore Categories
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

export default PrivateLabel;
