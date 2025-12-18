import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface SupplierStockManagementWrapperProps {
  onOpenCatalog: () => void;
}

export const SupplierStockManagementWrapper = ({ onOpenCatalog }: SupplierStockManagementWrapperProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Manage Products</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add or update your product catalogue.
        </p>
        <Button onClick={onOpenCatalog}>
          <Package className="h-4 w-4 mr-2" />
          Open Product Catalogue
        </Button>
      </div>
    </div>
  );
};
