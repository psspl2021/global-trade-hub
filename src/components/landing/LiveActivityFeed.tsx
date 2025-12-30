import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, TrendingUp, Package, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Activity {
  id: number;
  type: "requirement" | "bid" | "deal" | "signup";
  message: string;
  location: string;
  time: string;
}

// Simulated activities for social proof - more variety and FOMO-inducing
const mockActivities: Activity[] = [
  { id: 1, type: "signup", message: "New buyer joined from textile industry", location: "Mumbai", time: "Just now" },
  { id: 2, type: "requirement", message: "₹15L Steel Pipes requirement posted", location: "Delhi", time: "2 min ago" },
  { id: 3, type: "bid", message: "5 suppliers bidding on Chemical order", location: "Chennai", time: "3 min ago" },
  { id: 4, type: "deal", message: "₹8.5L deal closed for Aluminium Ingots", location: "Ahmedabad", time: "5 min ago" },
  { id: 5, type: "signup", message: "Verified manufacturer joined", location: "Pune", time: "7 min ago" },
  { id: 6, type: "requirement", message: "Bulk order for Electronic Components", location: "Bangalore", time: "10 min ago" },
  { id: 7, type: "bid", message: "Lowest bid: ₹42/kg for HDPE Granules", location: "Surat", time: "12 min ago" },
  { id: 8, type: "deal", message: "₹22L Textile order fulfilled", location: "Coimbatore", time: "15 min ago" },
  { id: 9, type: "signup", message: "Chemical supplier verified", location: "Vadodara", time: "18 min ago" },
  { id: 10, type: "requirement", message: "Private label cosmetics inquiry", location: "Hyderabad", time: "20 min ago" },
  { id: 11, type: "bid", message: "8 competitive bids on Machinery RFQ", location: "Kolkata", time: "22 min ago" },
  { id: 12, type: "deal", message: "International buyer ordered ₹35L goods", location: "UAE", time: "25 min ago" },
];

export const LiveActivityFeed = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity>(mockActivities[0]);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if dismissed this session
    if (sessionStorage.getItem("liveFeedDismissed")) {
      setIsDismissed(true);
      return;
    }

    let activityIndex = 0;
    
    // Show first activity after delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Rotate activities
    const rotationInterval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        activityIndex = (activityIndex + 1) % mockActivities.length;
        setCurrentActivity(mockActivities[activityIndex]);
        setIsVisible(true);
      }, 400);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(rotationInterval);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem("liveFeedDismissed", "true");
  };

  const getIcon = () => {
    switch (currentActivity.type) {
      case "requirement":
        return <Package className="h-4 w-4" />;
      case "bid":
        return <TrendingUp className="h-4 w-4" />;
      case "deal":
        return <CheckCircle className="h-4 w-4" />;
      case "signup":
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (currentActivity.type) {
      case "requirement":
        return "bg-blue-500/10 text-blue-600";
      case "bid":
        return "bg-amber-500/10 text-amber-600";
      case "deal":
        return "bg-green-500/10 text-green-600";
      case "signup":
        return "bg-purple-500/10 text-purple-600";
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 max-w-xs sm:max-w-sm transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full flex-shrink-0 ${getTypeColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-2">
              {currentActivity.message}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {currentActivity.location}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentActivity.time}
              </span>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* CTA */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-600 font-medium">Live activity</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-xs text-primary hover:text-primary"
            onClick={() => navigate('/signup')}
          >
            Join Free →
          </Button>
        </div>
      </div>
    </div>
  );
};
