import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { TrustSignalsGlobal } from "@/components/seo/TrustSignalsGlobal";
import { 
  Mail, 
  Phone, 
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  ArrowRight,
  Globe
} from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Blogs", path: "/blogs" },
    { label: "Careers", path: "/contact" },
  ],
  buyers: [
    { label: "How It Works", path: "/buyer" },
    { label: "Post RFQ", path: "/post-rfq" },
    { label: "Browse Categories", path: "/categories" },
    { label: "Private Label", path: "/private-label" },
  ],
  suppliers: [
    { label: "Become a Seller", path: "/seller" },
    { label: "Supplier Portal", path: "/login" },
    { label: "AI Detected Demand – List Products", path: "/signup?role=supplier" },
    { label: "Logistics Partner", path: "/signup?role=logistics_partner" },
  ],
  resources: [
    { label: "Help Center", path: "/contact" },
    { label: "FAQs", path: "/#faq" },
    { label: "Affiliate Program", path: "/affiliate-signup" },
    { label: "Invoice Generator", path: "/invoice-generator" },
  ],
};

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      {/* Global Trust Signals Banner */}
      <div className="bg-background/5 border-b border-background/10 py-3">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-2 text-sm text-background/80">
          <Globe className="h-4 w-4 text-primary" />
          <span>Serving B2B buyers and suppliers across <strong>195 countries</strong></span>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="mb-6">
              <img 
                src={procureSaathiLogo} 
                alt="ProcureSaathi Logo" 
                className="h-20 md:h-24 w-auto object-contain brightness-0 invert opacity-90"
              />
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6 max-w-xs">
              India's trusted B2B procurement platform. Connecting verified buyers with 
              reliable suppliers through transparent sealed bidding.
            </p>
            <div className="space-y-3">
              <a href="mailto:sales@procuresaathi.com" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Mail className="h-4 w-4" />
                sales@procuresaathi.com
              </a>
              <a href="tel:+918368127357" className="flex items-center gap-2 text-sm text-background/70 hover:text-background transition-colors">
                <Phone className="h-4 w-4" />
                +91 8368127357
              </a>
              <div className="flex items-center gap-2 text-sm text-background/70">
                <MapPin className="h-4 w-4" />
                New Delhi, India
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-background/90">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Buyers Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-background/90">For Buyers</h3>
            <ul className="space-y-2.5">
              {footerLinks.buyers.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Suppliers Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-background/90">For Suppliers</h3>
            <ul className="space-y-2.5">
              {footerLinks.suppliers.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-background/90">Resources</h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => navigate(link.path)}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">Ready to transform your procurement?</h3>
              <p className="text-sm text-background/70">Join thousands of businesses on ProcureSaathi.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/signup?role=buyer')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/contact')}
                className="border-background/30 bg-background text-foreground hover:bg-background/90"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-background/60">
                © {currentYear} ProcureSaathi. All rights reserved.
              </p>
              <p className="text-xs text-background/50 max-w-md">
                ProcureSaathi does not sell leads. AI matches verified buyers and suppliers based on real demand signals.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-xs text-background/60 hover:text-background transition-colors">
                Privacy Policy
              </button>
              <button className="text-xs text-background/60 hover:text-background transition-colors">
                Terms of Service
              </button>
              <div className="flex items-center gap-3">
                <a 
                  href="https://www.linkedin.com/company/procuresaathi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a 
                  href="#" 
                  className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};