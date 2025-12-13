import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { SEOTools } from "./SEOTools";

export function GlobalSEOTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    setIsAdmin(roles && roles.length > 0);
    setIsLoading(false);
  };

  // Don't render anything if not admin
  if (isLoading || !isAdmin) return null;

  return (
    <>
      {/* Floating SEO Button - positioned above the AI chat button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-green-600 hover:bg-green-700 text-white"
        )}
        size="icon"
        aria-label="Open SEO Tools"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* SEO Tools Modal */}
      <SEOTools open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
