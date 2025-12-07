// Group B Test: 2025-12-07T19:10:00Z - Hooks
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Users, TrendingUp } from "lucide-react";

// Group B - Hooks
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  // Test useAuth hook
  const { user, loading } = useAuth();
  
  // Test useSEO hook
  useSEO({
    title: "Test - ProcureSaathi",
    description: "Testing hooks",
  });
  
  // Test useToast hook
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-4">
          ✓ Group B Working!
        </h1>
        <p className="text-muted-foreground mb-4">
          Hooks: useAuth, useSEO, useToast
        </p>
        
        {/* Test Icons */}
        <div className="flex justify-center gap-4 mb-4">
          <Search className="h-6 w-6" />
          <Package className="h-6 w-6" />
          <Users className="h-6 w-6" />
          <TrendingUp className="h-6 w-6" />
        </div>
        
        {/* Test useAuth output */}
        <Card>
          <CardHeader>
            <CardTitle>useAuth Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Loading: {loading ? "Yes" : "No"}</p>
            <p>User: {user ? user.email : "Not logged in"}</p>
          </CardContent>
        </Card>
        
        {/* Test useToast */}
        <Button onClick={() => toast({ title: "Toast works!" })}>
          Test Toast
        </Button>
        
        <Link to="/login" className="text-primary underline block mt-4">
          Test Link to Login
        </Link>
      </div>
    </div>
  );
};

export default Index;
