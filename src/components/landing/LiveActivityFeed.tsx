import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Package } from "lucide-react";

interface Activity {
  id: number;
  type: "requirement" | "bid" | "deal";
  message: string;
  location: string;
  time: string;
}

// Simulated activities for social proof
const mockActivities: Activity[] = [
  { id: 1, type: "requirement", message: "New requirement posted for Steel Pipes", location: "Mumbai", time: "2 min ago" },
  { id: 2, type: "bid", message: "Supplier submitted competitive bid", location: "Delhi", time: "5 min ago" },
  { id: 3, type: "deal", message: "Deal closed for ₹4.5L worth of chemicals", location: "Chennai", time: "8 min ago" },
  { id: 4, type: "requirement", message: "Bulk order request for Electronic Components", location: "Bangalore", time: "12 min ago" },
  { id: 5, type: "bid", message: "3 new bids received on Textile requirement", location: "Ahmedabad", time: "15 min ago" },
  { id: 6, type: "deal", message: "Successfully sourced Industrial Equipment", location: "Pune", time: "20 min ago" },
  { id: 7, type: "requirement", message: "Urgent requirement for Packaging Materials", location: "Hyderabad", time: "25 min ago" },
  { id: 8, type: "bid", message: "Best price bid accepted", location: "Kolkata", time: "30 min ago" },
];

export const LiveActivityFeed = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity>(mockActivities[0]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let activityIndex = 0;
    
    // Show first activity after delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Rotate activities
    const rotationInterval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        activityIndex = (activityIndex + 1) % mockActivities.length;
        setCurrentActivity(mockActivities[activityIndex]);
        setIsVisible(true);
      }, 500);
    }, 6000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(rotationInterval);
    };
  }, []);

  const getIcon = () => {
    switch (currentActivity.type) {
      case "requirement":
        return <Package className="h-4 w-4" />;
      case "bid":
        return <TrendingUp className="h-4 w-4" />;
      case "deal":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (currentActivity.type) {
      case "requirement":
        return "bg-blue-500/10 text-blue-500";
      case "bid":
        return "bg-amber-500/10 text-amber-500";
      case "deal":
        return "bg-green-500/10 text-green-500";
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className={`p-2 rounded-full ${getTypeColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentActivity.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {currentActivity.location}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {currentActivity.time}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-500 font-medium">Live</span>
        </div>
      </div>
    </div>
  );
};
