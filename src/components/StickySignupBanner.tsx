import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles, Gift } from "lucide-react";
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
      // Show after scrolling 25% of the page
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 25 && !isDismissed) {
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground shadow-2xl animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Offer */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/20 items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-300 flex-shrink-0" />
                <span className="truncate">Early Adopter Offer: Post RFQs FREE!</span>
              </p>
              <p className="text-xs sm:text-sm text-primary-foreground/80 hidden sm:block">
                Join 5,000+ businesses. Get 3+ quotes in 48hrs. Limited time offer.
              </p>
            </div>
          </div>
          
          {/* Right: CTA + Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/signup')}
              className="gap-1.5 whitespace-nowrap font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Join Free <ArrowRight className="w-4 h-4" />
            </Button>
            <button 
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
