/**
 * Supplier Compliance Hook
 * Checks global supplier compliance status before PO creation
 */
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSupplierCompliance() {
  const { toast } = useToast();

  const checkCompliance = async (supplierId: string, regionType: string): Promise<boolean> => {
    if (regionType !== 'global') return true;

    const { data, error } = await supabase.rpc("check_supplier_compliance" as any, {
      p_supplier_id: supplierId,
      p_region_type: regionType,
    });

    if (error) {
      toast({
        title: "Compliance Check Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    if (!data) {
      toast({
        title: "Compliance Required",
        description: "This supplier has not been verified for global trade compliance. Please complete compliance screening first.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { checkCompliance };
}
