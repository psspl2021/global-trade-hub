import { useNavigate } from "react-router-dom";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Post Requirement", path: "/post-rfq" },
    { label: "Reverse Auctions", path: "/reverse-auction" },
    { label: "Categories", path: "/categories" },
    { label: "Private Label", path: "/private-label" },
    { label: "Pricing", path: "/pricing" },
  ],
  buyers: [
    { label: "How it works", path: "/buyer" },
    { label: "Solutions", path: "/solutions" },
    { label: "Industries", path: "/industries" },
    { label: "Customer stories", path: "/customer-stories" },
  ],
  suppliers: [
    { label: "Become a supplier", path: "/seller" },
    { label: "Supplier portal", path: "/login" },
    { label: "Logistics partner", path: "/signup?role=logistics_partner" },
    { label: "Affiliate program", path: "/affiliate-signup" },
  ],
  company: [
    { label: "About", path: "/about" },
    { label: "Blog", path: "/blogs" },
    { label: "Contact", path: "/contact" },
    { label: "Help center", path: "/contact" },
  ],
};

export const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4">
            <button onClick={() => navigate('/')} className="block mb-5" aria-label="ProcureSaathi home">
              <img
                src={procureSaathiLogo}
                alt="ProcureSaathi"
                className="h-10 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              The procurement operating system for enterprises. Real supplier competition, transparent price discovery, measurable savings.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:sales@procuresaathi.com" className="block text-muted-foreground hover:text-foreground transition-colors">
                sales@procuresaathi.com
              </a>
              <a href="tel:+918368127357" className="block text-muted-foreground hover:text-foreground transition-colors">
                +91 83681 27357
              </a>
              <p className="text-muted-foreground">New Delhi, India</p>
            </div>
          </div>

          {/* Link Columns */}
          {[
            { title: 'Product', links: footerLinks.product },
            { title: 'For buyers', links: footerLinks.buyers },
            { title: 'For suppliers', links: footerLinks.suppliers },
            { title: 'Company', links: footerLinks.company },
          ].map((section) => (
            <div key={section.title} className="md:col-span-2">
              <h3 className="text-[13px] font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
            <p className="text-xs text-muted-foreground">
              © {currentYear} ProcureSaathi. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </button>
              <button onClick={() => navigate('/terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/procuresaathi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
