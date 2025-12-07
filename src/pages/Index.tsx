import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, Package, Truck, Menu, X } from 'lucide-react';
import { TrustBadges } from '@/components/landing/TrustBadges';
import { StatsSection } from '@/components/landing/StatsSection';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { LiveActivityFeed } from '@/components/landing/LiveActivityFeed';
import { StickySignupBanner } from '@/components/StickySignupBanner';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { AIChatBox } from '@/components/AIChatBox';
import { CategoriesShowcase } from '@/components/landing/CategoriesShowcase';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/layout/Footer';
import procuresaathiLogo from '@/assets/procuresaathi-logo.png';

const Index = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={procuresaathiLogo} alt="ProcureSaathi" className="h-10" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                Categories
              </Link>
              <button 
                onClick={() => scrollToSection('about')} 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Contact
              </button>
              <Link to="/book-truck" className="text-sm font-medium hover:text-primary transition-colors">
                Book a Truck
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button onClick={() => navigate('/signup')}>Join Now</Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-3">
              <Link 
                to="/" 
                className="block px-2 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/categories" 
                className="block px-2 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <button 
                onClick={() => scrollToSection('about')} 
                className="block w-full text-left px-2 py-2 text-sm font-medium hover:bg-muted rounded-md"
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className="block w-full text-left px-2 py-2 text-sm font-medium hover:bg-muted rounded-md"
              >
                Contact
              </button>
              <Link 
                to="/book-truck" 
                className="block px-2 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book a Truck
              </Link>
              <div className="flex gap-2 pt-2 px-2">
                <Button variant="outline" className="flex-1" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                  Login
                </Button>
                <Button className="flex-1" onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}>
                  Join Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-muted/30 via-background to-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ProcureSaathi - India's #1{' '}
              <span className="text-primary">B2B Sourcing</span> Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Connect with verified suppliers, get competitive bids, and complete secure transactions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup?role=buyer')}>
                <ShoppingBag className="h-5 w-5 mr-2" />
                Join as Buyer
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/signup?role=supplier')}>
                <Package className="h-5 w-5 mr-2" />
                Join as Supplier
              </Button>
            </div>
          </div>
        </section>

        {/* Role Cards Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="bg-success/10 border-success/20">
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">For Buyers</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Post requirements and get competitive bids from verified suppliers.
                  </p>
                  <Button className="w-full bg-success hover:bg-success/90" onClick={() => navigate('/signup?role=buyer')}>
                    Join as Buyer
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-warning/10 border-warning/20">
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-warning mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">For Suppliers</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Connect with buyers and grow your business.
                  </p>
                  <Button className="w-full bg-warning hover:bg-warning/90" onClick={() => navigate('/signup?role=supplier')}>
                    Join as Supplier
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Truck className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-3">Logistics</h2>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Find verified trucks and warehousing services.
                  </p>
                  <Button className="w-full" onClick={() => navigate('/book-truck')}>
                    Book a Truck
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <CategoriesShowcase />
        <TrustBadges />
        <StatsSection />
        <AboutSection />
        <WhyChooseUs />
        <Testimonials />
        <ContactSection />
        <section id="faq">
          <FAQ />
        </section>
      </main>

      <Footer />

      <LiveActivityFeed />
      <StickySignupBanner />
      <ExitIntentPopup />
      <AIChatBox />
    </div>
  );
};

export default Index;
