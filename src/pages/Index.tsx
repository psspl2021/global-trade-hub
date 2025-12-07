// Group A Test: 2025-12-07T19:00:00Z - UI Components
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, Users, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold text-primary mb-4">
          ✓ Group A Working!
        </h1>
        <p className="text-muted-foreground mb-4">
          UI Components: Button, Card, Tabs, Lucide icons
        </p>
        
        {/* Test Icons */}
        <div className="flex justify-center gap-4 mb-4">
          <Search className="h-6 w-6" />
          <Package className="h-6 w-6" />
          <Users className="h-6 w-6" />
          <TrendingUp className="h-6 w-6" />
        </div>
        
        {/* Test Button */}
        <Button>Test Button</Button>
        
        {/* Test Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>Card content works!</CardContent>
        </Card>
        
        {/* Test Tabs */}
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Tab 1 content</TabsContent>
          <TabsContent value="tab2">Tab 2 content</TabsContent>
        </Tabs>
        
        <Link to="/login" className="text-primary underline block mt-4">
          Test Link to Login
        </Link>
      </div>
    </div>
  );
};

export default Index;
