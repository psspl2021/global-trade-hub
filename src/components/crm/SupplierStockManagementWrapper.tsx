import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { SupplierInventorySaleAI } from '@/components/SupplierInventorySaleAI';

interface SupplierStockManagementWrapperProps {
  onOpenCatalog: () => void;
  userId: string;
}

export const SupplierStockManagementWrapper = ({ onOpenCatalog, userId }: SupplierStockManagementWrapperProps) => {
  return (
    <div className="space-y-6">
      {/* Product Catalog Access */}
      <div className="text-center py-6 border rounded-lg bg-muted/30">
        <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Manage Products</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add or update your product catalogue.
        </p>
        <Button onClick={onOpenCatalog}>
          <Package className="h-4 w-4 mr-2" />
          Open Product Catalogue
        </Button>
      </div>

      {/* AI-Powered Inventory Matching */}
      <SupplierInventorySaleAI userId={userId} userRole="supplier" />
    </div>
  );
};
