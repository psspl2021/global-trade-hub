import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { Menu, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const navLinks = [
  { label: "For Buyers", path: "/buyer" },
  { label: "For Suppliers", path: "/seller" },
  { label: "Solutions", path: "/solutions" },
  { label: "Categories", path: "/categories" },
  { label: "Resources", path: "/blogs" },
  { label: "Contact", path: "/contact" },
];

export const PageHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const go = (path: string, eventName?: string) => {
    if (eventName) trackEvent(eventName, { source: "header", path });
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="bg-background border-b border-border sticky top-0 z-50"
      style={{ height: "60px" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        {/* Logo */}
        <button
          className="flex items-center shrink-0 -ml-1 px-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => go("/")}
          aria-label="ProcureSaathi home"
        >
          <img
            src={procureSaathiLogo}
            alt="ProcureSaathi"
            className="h-9 w-auto object-contain"
            width={140}
            height={36}
            loading="eager"
          />
        </button>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 ml-8"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <button
              key={link.path}
              className={`relative px-3 h-15 inline-flex items-center text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md ${
                isActive(link.path)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ height: "60px" }}
              onClick={() => go(link.path)}
            >
              {link.label}
              {isActive(link.path) && (
                <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {/* Tertiary: Sign in (text) */}
          <Button
            variant="ghost"
            size="sm"
            className="font-medium hidden sm:inline-flex h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => go("/login", "header_sign_in_click")}
          >
            Sign in
          </Button>
          {/* Secondary: Get started (outline) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex h-9 px-4 text-[13.5px] font-medium"
            onClick={() => go("/signup", "header_get_started_click")}
          >
            Get started
          </Button>
          {/* Primary: Post requirement (solid) */}
          <Button
            size="sm"
            className="h-9 px-4 text-[13.5px] font-medium shadow-none"
            onClick={() => go("/post-rfq", "header_post_requirement_click")}
          >
            Post requirement
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 -mr-1"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0">
              <div className="px-6 py-5 border-b border-border">
                <img
                  src={procureSaathiLogo}
                  alt="ProcureSaathi"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <nav className="flex flex-col p-3 gap-0.5">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive(link.path)
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                    onClick={() => go(link.path)}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  </button>
                ))}

                <div className="border-t border-border mt-3 pt-3 px-1 space-y-2">
                  <Button
                    className="w-full font-medium h-10"
                    onClick={() => go("/post-rfq", "header_post_requirement_click")}
                  >
                    Post requirement
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-medium h-10"
                    onClick={() => go("/signup", "header_get_started_click")}
                  >
                    Get started
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full font-medium h-10"
                    onClick={() => go("/login", "header_sign_in_click")}
                  >
                    Sign in
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
