import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { StockManagement } from '@/components/StockManagement';

interface SupplierStockManagementWrapperProps {
  userId: string;
}

export const SupplierStockManagementWrapper = ({ userId }: SupplierStockManagementWrapperProps) => {
  const [stockOpen, setStockOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Stock Management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your product inventory, update stock levels, and track stock movements.
        </p>
        <Button onClick={() => setStockOpen(true)}>
          <Package className="h-4 w-4 mr-2" />
          Open Stock Manager
        </Button>
      </div>

      <StockManagement
        open={stockOpen}
        onOpenChange={setStockOpen}
        userId={userId}
      />
    </div>
  );
};