import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { Menu, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "About Us", path: "/" },
  { label: "Buyer", path: "/buyer" },
  { label: "Seller", path: "/seller" },
  { label: "Private Label", path: "/private-label" },
  { label: "Categories", path: "/categories" },
  { label: "Blogs", path: "/blogs" },
  { label: "Contact", path: "/contact" },
];

export const PageHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center cursor-pointer group shrink-0"
          onClick={() => navigate('/')}
        >
          <img 
            src={procureSaathiLogo} 
            alt="ProcureSaathi Logo" 
            className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            width={160}
            height={72}
            loading="eager"
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <button 
              key={link.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.path) 
                  ? 'text-primary bg-accent' 
                  : 'text-foreground/70 hover:text-foreground hover:bg-accent/50'
              }`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </button>
          ))}
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Looking to Buy? */}
          <Button 
            size="sm" 
            variant="outline"
            className="font-semibold hidden md:inline-flex h-9 px-4 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all" 
            onClick={() => navigate('/post-rfq')}
          >
            Looking to Buy?
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-medium hidden sm:inline-flex h-9 text-foreground/70 hover:text-foreground" 
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button 
            size="sm" 
            className="font-semibold shadow-md hover:shadow-lg transition-all h-9 px-5" 
            onClick={() => navigate('/signup')}
          >
            Partner with Us
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0">
              <div className="p-6 border-b border-border">
                <img 
                  src={procureSaathiLogo} 
                  alt="ProcureSaathi" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => (
                  <button 
                    key={link.path}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(link.path) 
                        ? 'text-primary bg-accent' 
                        : 'text-foreground/80 hover:bg-accent/50'
                    }`}
                    onClick={() => handleNavigation(link.path)}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}

                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <Button 
                    className="w-full font-semibold" 
                    onClick={() => handleNavigation('/post-rfq')}
                  >
                    Looking to Buy?
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full font-semibold" 
                    onClick={() => handleNavigation('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full text-sm" 
                    onClick={() => handleNavigation('/signup?role=supplier')}
                  >
                    Join as Supplier
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
