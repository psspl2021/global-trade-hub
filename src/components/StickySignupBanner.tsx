import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const StickySignupBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Don't show for logged-in users
    if (user) return;

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem('signup-banner-dismissed');
    if (dismissed) return;

    const handleScroll = () => {
      // Show after scrolling 50% of the page
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 30 && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('signup-banner-dismissed', 'true');
  };

  if (!isVisible || user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base truncate">
            Ready to transform your B2B sourcing?
          </p>
          <p className="text-xs md:text-sm text-primary-foreground/80 hidden sm:block">
            Join 5,000+ verified suppliers and buyers on ProcureSaathi.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate('/signup')}
            className="gap-1 whitespace-nowrap"
          >
            Sign Up Free <ArrowRight className="w-4 h-4" />
          </Button>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
