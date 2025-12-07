import { Link } from 'react-router-dom';
import { NewsletterSignup } from '@/components/landing/NewsletterSignup';
import { Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import procuresaathiLogo from '@/assets/procuresaathi-logo.png';

export const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <img src={procuresaathiLogo} alt="ProcureSaathi" className="h-10 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              India's leading B2B sourcing platform connecting buyers with verified suppliers 
              through transparent competitive bidding.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">Categories</Link>
              </li>
              <li>
                <button onClick={() => scrollToSection('about')} className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')} className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </button>
              </li>
              <li>
                <Link to="/book-truck" className="text-muted-foreground hover:text-primary transition-colors">Book a Truck</Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h3 className="font-semibold mb-4">For Business</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/signup?role=buyer" className="text-muted-foreground hover:text-primary transition-colors">
                  Join as Buyer
                </Link>
              </li>
              <li>
                <Link to="/signup?role=supplier" className="text-muted-foreground hover:text-primary transition-colors">
                  Join as Supplier
                </Link>
              </li>
              <li>
                <Link to="/signup?role=logistics_partner" className="text-muted-foreground hover:text-primary transition-colors">
                  Logistics Partner
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <NewsletterSignup variant="inline" source="homepage_footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ProcureSaathi Solutions Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
