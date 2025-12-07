// Rebuild: 2025-12-07T19:05:00Z - Minimal test version
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ShoppingBag, MessageSquare, MapPin, Mail, 
  Clock, FileText, CheckCircle, Send, Building2,
  Package, Trophy, Users, Shield, Target, Eye, Search,
  Truck, Route, ClipboardCheck
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSEO, injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';
import { LazyFAQ } from '@/components/landing/LazyFAQ';
import { StickySignupBanner } from '@/components/StickySignupBanner';
import { NewsletterSignup } from '@/components/landing/NewsletterSignup';
import { DemoRequestForm } from '@/components/landing/DemoRequestForm';

// Direct imports - no lazy loading
import LiveSupplierStock from '@/components/LiveSupplierStock';
import BrowseRequirements from '@/components/BrowseRequirements';
import Testimonials from '@/components/landing/Testimonials';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import StatsSection from '@/components/landing/StatsSection';
import ExitIntentPopup from '@/components/landing/ExitIntentPopup';
import LiveActivityFeed from '@/components/landing/LiveActivityFeed';
import TrustBadges from '@/components/landing/TrustBadges';
import InternationalTestimonials from '@/components/landing/InternationalTestimonials';
import ExportCertifications from '@/components/landing/ExportCertifications';

console.log("Index.tsx: All imports loaded successfully");

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLiveStock, setShowLiveStock] = useState(false);
  const [showLiveRequirements, setShowLiveRequirements] = useState(false);

  // SEO setup
  useSEO({
    title: "ProcureSaathi - India's #1 B2B Sourcing & Procurement Platform",
    description: "India's leading B2B marketplace. Connect with 5000+ verified suppliers, get competitive bids, and save 15-30% on sourcing. Free signup!",
    canonical: "https://procuresaathi.com/",
    keywords: "B2B marketplace, procurement platform, sourcing India, wholesale suppliers, bulk buying, industrial suppliers"
  });

  // Inject Organization schema
  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');
  }, []);

  const handleLiveStockClick = () => {
    setShowLiveStock(true);
  };

  const handleLiveRequirementsClick = () => {
    setShowLiveRequirements(true);
  };

  const categories = [
    { name: 'Auto Vehicle & Accessories', icon: '🚗' },
    { name: 'Beauty & Personal Care', icon: '💄' },
    { name: 'Consumer Electronics', icon: '📱' },
    { name: 'Electronic Components', icon: '🔌' },
    { name: 'Fashion Accessories & Footwear', icon: '👟' },
    { name: 'Fashion Apparel & Fabrics', icon: '👔' },
    { name: 'Food & Beverages', icon: '🍽️' },
    { name: 'Furniture & Home Decor', icon: '🛋️' },
    { name: 'Gifts & Festival Products', icon: '🎁' },
    { name: 'Hardware & Tools', icon: '🔧' },
    { name: 'Health Care Products', icon: '🏥' },
    { name: 'Home Appliances', icon: '🏠' },
    { name: 'Household & Pets', icon: '🐕' },
    { name: 'Industrial Supplies', icon: '🏭' },
    { name: 'Machinery & Equipment', icon: '⚙️' },
    { name: 'Metals - Ferrous (Steel, Iron)', icon: '🔩' },
    { name: 'Metals - Non-Ferrous (Copper, Aluminium)', icon: '🥉' },
    { name: 'Mobile Electronics', icon: '📲' },
    { name: 'Mother, Kids & Toys', icon: '🧸' },
    { name: 'Printing & Packaging', icon: '📦' },
    { name: 'School & Office Supplies', icon: '✏️' },
    { name: 'Sports & Outdoor', icon: '⚽' },
    { name: 'Telecommunication', icon: '📡' },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/browse?category=${encodeURIComponent(categoryName)}`);
  };

  const buyerSteps = [
    { icon: FileText, title: 'Post Requirement', description: 'Submit your sourcing needs with detailed specifications' },
    { icon: Mail, title: 'Receive Sealed Bids', description: 'Get competitive bids from verified suppliers' },
    { icon: CheckCircle, title: 'Accept Best Bid', description: 'Review and accept the lowest bid' },
    { icon: Users, title: 'Complete Transaction', description: 'Finalize with ProcureSaathi support' },
  ];

  const supplierSteps = [
    { icon: Search, title: 'Browse Requirements', description: 'View active buyer requirements in your category' },
    { icon: Send, title: 'Submit Sealed Bid', description: 'Place your competitive bid (hidden from others)' },
    { icon: Trophy, title: 'Win Contract', description: 'Get notified when your bid is accepted' },
    { icon: Package, title: 'Fulfill Order', description: 'Deliver and complete the transaction' },
  ];

  const logisticsSteps = [
    { icon: Truck, title: 'Register Assets', description: 'Add your vehicles and warehouses to the platform' },
    { icon: Route, title: 'Receive Requests', description: 'Get booking requests from verified businesses' },
    { icon: FileText, title: 'Provide Quotes', description: 'Submit competitive quotes for transport/storage' },
    { icon: ClipboardCheck, title: 'Complete Service', description: 'Fulfill orders and grow your business' },
  ];

  const stats = [
    { label: 'Established', value: '2021' },
    { label: 'Suppliers', value: '1000+' },
    { label: 'Buyers', value: '500+' },
    { label: 'Categories', value: '23' },
  ];

  const coreValues = [
    { icon: Shield, title: 'Trust & Transparency', description: 'Sealed bidding ensures fair pricing' },
    { icon: CheckCircle, title: 'Verified Partners', description: 'All suppliers and buyers are verified' },
    { icon: Users, title: 'End-to-End Support', description: 'From requirement to delivery' },
    { icon: Target, title: 'Secure Transactions', description: 'Protected business dealings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Info Bar */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Important:</span> ProcureSaathi - The future of B2B procurement. 
            Search 23+ product categories, browse live supplier stock, and get competitive sealed bids from verified partners.
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-40 w-auto object-contain"
              width={160}
              height={160}
              loading="eager"
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => scrollToSection('about')}>About Us</Button>
            <Button variant="ghost" onClick={() => scrollToSection('how-it-works')}>How It Works</Button>
            <Button variant="ghost" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" onClick={() => scrollToSection('contact')}>Contact</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/signup')}>Join Now</Button>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted/30 via-background to-muted/50 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              ProcureSaathi - India's #1{' '}
              <span className="text-primary">B2B Sourcing</span> &{' '}
              <span className="text-warning">Procurement Platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Search across 23+ product categories and connect with live stock from registered suppliers. Post requirements, receive competitive sealed bids, and complete secure transactions — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="h-14 text-lg px-8"
                onClick={() => navigate('/signup?role=buyer')}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Join as Buyer
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 text-lg px-8"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <Package className="h-5 w-5 mr-2" />
                Join as Supplier
              </Button>
              <DemoRequestForm />
            </div>
            
            {/* Feature Highlights */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 pt-8 border-t border-border/50">
              <button 
                onClick={() => navigate('/categories')}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer transition-all group"
              >
                <Search className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Search Categories</span>
              </button>
              <button 
                onClick={handleLiveStockClick}
                className="flex items-center gap-2 text-muted-foreground hover:text-success cursor-pointer transition-all group"
              >
                <Package className="h-5 w-5 text-success group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Live Stock</span>
              </button>
              <button 
                onClick={handleLiveRequirementsClick}
                className="flex items-center gap-2 text-muted-foreground hover:text-warning cursor-pointer transition-all group"
              >
                <FileText className="h-5 w-5 text-warning group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Live Requirements</span>
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary cursor-pointer transition-all group"
              >
                <CheckCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Verified Partners</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Triple CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Buyer CTA */}
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-6 text-center">
                <ShoppingBag className="h-12 w-12 text-success mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Sourcing Products? It's FREE, Forever!
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Post requirements and get competitive bids from verified suppliers worldwide.
                </p>
                <Button 
                  size="lg" 
                  className="w-full bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => navigate('/signup?role=buyer')}
                >
                  Join as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Supplier CTA */}
            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-warning mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Manufacturer? Connect with Global Buyers!
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  List your company and start connecting with buyers. Multiple subscription tiers.
                </p>
                <Button 
                  size="lg"
                  className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                  onClick={() => navigate('/signup?role=supplier')}
                >
                  Join as Supplier
                </Button>
              </CardContent>
            </Card>

            {/* Logistics CTA */}
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-3 text-foreground">
                  Need Transportation? Book a Truck!
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Find verified trucks, trailers & warehousing services across India.
                </p>
                <Button 
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/book-truck')}
                >
                  Book a Truck
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">About ProcureSaathi</h2>
            <p className="text-center text-muted-foreground mb-12">Your Trusted B2B Procurement Partner</p>
            
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Our Mission</h3>
                  </div>
                  <p className="text-muted-foreground">
                    To revolutionize B2B procurement by creating a transparent, efficient, and secure platform 
                    that connects verified buyers and suppliers across India and globally.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Our Vision</h3>
                  </div>
                  <p className="text-muted-foreground">
                    To become India's most trusted B2B sourcing platform, enabling businesses to source 
                    remotely with confidence and complete transparency.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {stats.map((stat) => (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-6">
                    <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Core Values */}
            <h3 className="text-xl font-semibold text-center mb-6">Our Core Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {coreValues.map((value) => (
                <Card key={value.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <value.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <h4 className="font-medium text-sm mb-1">{value.title}</h4>
                    <p className="text-xs text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12">Simple steps for buyers, suppliers, and logistics partners</p>
          
          <Tabs defaultValue="buyer" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="buyer">For Buyers</TabsTrigger>
              <TabsTrigger value="supplier">For Suppliers</TabsTrigger>
              <TabsTrigger value="logistics">For Logistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buyer">
              <div className="grid md:grid-cols-4 gap-6">
                {buyerSteps.map((step, index) => (
                  <Card key={step.title} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                      <h3 className="font-semibold mt-1 mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="supplier">
              <div className="grid md:grid-cols-4 gap-6">
                {supplierSteps.map((step, index) => (
                  <Card key={step.title} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-6 w-6 text-warning" />
                      </div>
                      <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                      <h3 className="font-semibold mt-1 mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="logistics">
              <div className="grid md:grid-cols-4 gap-6">
                {logisticsSteps.map((step, index) => (
                  <Card key={step.title} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                      <h3 className="font-semibold mt-1 mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Product Categories</h2>
          <p className="text-center text-muted-foreground mb-12">Browse 23+ categories across industries</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {categories.slice(0, 12).map((category) => (
              <Card 
                key={category.name} 
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-3xl mb-2 block">{category.icon}</span>
                  <p className="text-sm font-medium">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate('/categories')}>
              View All Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Stats Section */}
      <StatsSection />

      {/* International Testimonials Section */}
      <InternationalTestimonials />

      {/* Export Certifications Section */}
      <ExportCertifications />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <LazyFAQ />

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Contact Us</h2>
          <p className="text-center text-muted-foreground mb-12">Get in touch with our team</p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <Mail className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email Us</h3>
                <a 
                  href="mailto:sales@procuresaathi.com" 
                  className="text-primary hover:underline"
                >
                  sales@procuresaathi.com
                </a>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Our Location</h3>
                <p className="text-muted-foreground text-sm">
                  Corporate office: Ahmedabad, Gujarat, India
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Business Hours</h3>
                <p className="text-muted-foreground text-sm">
                  Mon - Sat: 9:00 AM - 6:00 PM IST
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your B2B Sourcing?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of verified buyers and suppliers on India's most trusted procurement platform.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/signup')}
          >
            Get Started for Free
          </Button>
        </div>
      </section>
      </main>

      {/* Lead Generation Components */}
      <ExitIntentPopup />
      <LiveActivityFeed />
      
      {/* Sticky Signup Banner */}
      <StickySignupBanner />

      {/* Footer */}
      <footer className="bg-card border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">ProcureSaathi</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                India's #1 B2B Sourcing & Procurement Platform connecting verified buyers and suppliers.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>GSTIN:</strong> Coming Soon
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => scrollToSection('about')}>About Us</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => scrollToSection('how-it-works')}>How It Works</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/categories')}>Categories</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => scrollToSection('contact')}>Contact</Button></li>
              </ul>
            </div>

            {/* For Business */}
            <div>
              <h4 className="font-semibold mb-4">For Business</h4>
              <ul className="space-y-2">
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/signup?role=buyer')}>Register as Buyer</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/signup?role=supplier')}>Register as Supplier</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/signup?role=logistics')}>Logistics Partner</Button></li>
                <li><Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/book-truck')}>Book a Truck</Button></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to our newsletter for latest updates and market insights.
              </p>
              <NewsletterSignup />
            </div>
          </div>

          {/* International Markets */}
          <div className="border-t mt-8 pt-8">
            <h4 className="font-semibold mb-4 text-center">International Markets</h4>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/source/usa')}>🇺🇸 USA</Button>
              <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/source/uae')}>🇦🇪 UAE</Button>
              <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/source/uk')}>🇬🇧 UK</Button>
              <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/source/germany')}>🇩🇪 Germany</Button>
              <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate('/source/africa')}>🌍 Africa</Button>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ProcureSaathi Solutions Pvt Ltd. All rights reserved.</p>
            <p className="mt-2">India's #1 B2B Sourcing & Procurement Platform</p>
          </div>
        </div>
      </footer>
      {/* Live Stock Dialog - Only loaded when needed */}
      {showLiveStock && (
        <LiveSupplierStock 
          open={showLiveStock} 
          onOpenChange={setShowLiveStock}
          userId={user?.id}
        />
      )}

      {/* Live Requirements Dialog - Only loaded when needed */}
      {showLiveRequirements && (
        <BrowseRequirements 
          open={showLiveRequirements} 
          onOpenChange={setShowLiveRequirements}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default Index;