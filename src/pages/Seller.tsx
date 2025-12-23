import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  Users, 
  Globe, 
  ArrowLeftRight, 
  Network,
  Package,
  FileText,
  Sparkles,
  Truck,
  Shield,
  BarChart3,
  CheckCircle2,
  Star,
  TrendingUp,
  Zap
} from "lucide-react";

const stats = [
  { value: "500+", label: "Businesses", icon: Users },
  { value: "50+", label: "Countries", icon: Globe },
  { value: "1000+", label: "Transactions", icon: ArrowLeftRight },
  { value: "10K+", label: "Connections", icon: Network },
];

const benefits = [
  { title: "One Listing, Many Marketplaces", icon: Package },
  { title: "B2B Feature Catalogue", icon: FileText },
  { title: "AI-Powered Product Descriptions", icon: Sparkles },
  { title: "Integrated Logistics Support", icon: Truck },
  { title: "Secure Payment Processing", icon: Shield },
  { title: "Analytics & Insights Dashboard", icon: BarChart3 },
];

const howItWorks = [
  {
    step: 1,
    title: "Create Your Profile",
    description: "Sign up and complete your business profile with company details and certifications.",
    icon: Users,
  },
  {
    step: 2,
    title: "List Your Products",
    description: "Add your products with AI-powered descriptions, specifications, and competitive pricing.",
    icon: Package,
  },
  {
    step: 3,
    title: "Receive Buyer Inquiries",
    description: "Get matched with verified buyers looking for your products from across the globe.",
    icon: FileText,
  },
  {
    step: 4,
    title: "Close Deals & Grow",
    description: "Negotiate, finalize orders, and build long-term business relationships.",
    icon: TrendingUp,
  },
];

const features = [
  {
    title: "Global Reach",
    description: "Connect with buyers from 50+ countries and expand your business internationally.",
    icon: Globe,
  },
  {
    title: "Verified Buyers",
    description: "All buyers are verified to ensure genuine business inquiries and reduce fraud.",
    icon: CheckCircle2,
  },
  {
    title: "AI-Powered Tools",
    description: "Leverage AI for product descriptions, pricing recommendations, and market insights.",
    icon: Sparkles,
  },
  {
    title: "Zero Commission",
    description: "List your products for free. Pay only a small service fee when you close a deal.",
    icon: Star,
  },
  {
    title: "Logistics Support",
    description: "Integrated shipping and logistics partners to help you deliver worldwide.",
    icon: Truck,
  },
  {
    title: "Real-time Analytics",
    description: "Track views, inquiries, and conversions with detailed analytics dashboard.",
    icon: BarChart3,
  },
];

const Seller = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/80 mb-6">
              <span className="text-sm font-medium text-muted-foreground">ALL-IN-ONE PLATFORM</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              World of Opportunities on a{" "}
              <span className="text-primary">Single Platform</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Boost your business's global visibility and reach. Connect with verified buyers 
              from 50+ countries and grow your exports.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Sign Up For Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="link" 
                className="text-primary text-lg"
                onClick={() => navigate('/login')}
              >
                Already a Seller? Sign In
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

      {/* Why Sell Section */}
      <section className="py-16 bg-amber-50/50 dark:bg-amber-950/10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Sell on ProcureSaathi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {benefits.map((benefit) => (
              <div 
                key={benefit.title} 
                className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border"
              >
                <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="font-medium">{benefit.title}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              size="lg" 
              className="h-14 px-10 text-lg bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => navigate('/signup?role=supplier')}
            >
              Start Selling Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and start receiving inquiries from global buyers.
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

      {/* Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-primary">Succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and features designed to help you grow your export business.
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
            <Zap className="h-12 w-12 text-primary-foreground mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join thousands of suppliers already selling on ProcureSaathi. 
              Start for free and scale globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-8 text-lg"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                onClick={() => navigate('/login')}
              >
                Sign In
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

export default Seller;
