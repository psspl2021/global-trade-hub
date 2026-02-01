import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { Menu, X } from "lucide-react";

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
    <header className="bg-card/98 backdrop-blur-md border-b border-border/60 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Logo container - INCREASED SIZE by 25-35% */}
        <div 
          className="flex items-center cursor-pointer group p-1 -ml-1 rounded-lg hover:bg-primary/5 transition-colors"
          onClick={() => navigate('/')}
        >
          <img 
            src={procureSaathiLogo} 
            alt="ProcureSaathi Logo" 
            className="h-14 sm:h-16 md:h-[72px] w-auto object-contain transition-transform group-hover:scale-[1.02] drop-shadow-md"
            width={140}
            height={72}
            loading="eager"
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Button 
              key={link.path}
              variant="ghost" 
              size="sm" 
              className={`font-medium transition-colors ${
                isActive(link.path) 
                  ? 'text-primary bg-primary/5' 
                  : 'hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => navigate(link.path)}
            >
              {link.label}
            </Button>
          ))}
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="font-medium hidden sm:inline-flex h-9" 
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button 
            size="sm" 
            className="font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 h-9 px-5" 
            onClick={() => navigate('/signup')}
          >
            Join Now
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px] bg-card/95 backdrop-blur-lg">
              <nav className="flex flex-col gap-2 mt-8">
                <Button 
                  variant="ghost" 
                  className="justify-start text-base font-medium" 
                  onClick={() => handleNavigation('/login')}
                >
                  Login
                </Button>
                
                <div className="border-t border-border/50 my-3" />
                
                {navLinks.map((link) => (
                  <Button 
                    key={link.path}
                    variant="ghost" 
                    className={`justify-start text-base ${
                      isActive(link.path) ? 'text-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleNavigation(link.path)}
                  >
                    {link.label}
                  </Button>
                ))}

                <div className="border-t border-border/50 pt-5 mt-4 space-y-3">
                  <Button 
                    className="w-full font-semibold" 
                    onClick={() => handleNavigation('/signup?role=buyer')}
                  >
                    Join as Buyer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleNavigation('/signup?role=supplier')}
                  >
                    Join as Supplier
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleNavigation('/signup?role=logistics_partner')}
                  >
                    Join as Logistics Partner
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