// Group C Test: 2025-12-07T19:20:00Z - Landing Sections
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Users, TrendingUp } from "lucide-react";

// Group B - Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

// Group C - Landing Sections (Testing StatsSection only)
import StatsSection from "@/components/landing/StatsSection";
// import WhyChooseUs from "@/components/landing/WhyChooseUs";
// import { LazyFAQ } from "@/components/landing/LazyFAQ";

const Index = () => {
  const { user, loading } = useAuth();
  useSEO({ title: "Test - ProcureSaathi", description: "Testing Group C" });
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Testing StatsSection Only
        </h1>
        <p className="text-muted-foreground mb-4">
          If this works, StatsSection is fine.
        </p>
        
        <div className="flex justify-center gap-4 mb-4">
          <Search className="h-6 w-6" />
          <Package className="h-6 w-6" />
          <Users className="h-6 w-6" />
          <TrendingUp className="h-6 w-6" />
        </div>
        
        <Card className="max-w-sm mx-auto mb-4">
          <CardHeader><CardTitle>Auth Status</CardTitle></CardHeader>
          <CardContent>
            <p>Loading: {loading ? "Yes" : "No"}</p>
            <p>User: {user ? user.email : "Not logged in"}</p>
          </CardContent>
        </Card>
        
        <Button onClick={() => toast({ title: "Toast works!" })}>Test Toast</Button>
        <Link to="/login" className="text-primary underline block mt-4">Login</Link>
      </div>
      
      {/* Test StatsSection Only */}
      <StatsSection />
    </div>
  );
};

export default Index;
