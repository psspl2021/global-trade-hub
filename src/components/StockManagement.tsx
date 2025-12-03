import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Save } from 'lucide-react';

interface ProductWithStock {
  id: string;
  name: string;
  category: string;
  stock_inventory: {
    id: string;
    quantity: number;
    unit: string;
    low_stock_threshold: number;
  } | null;
}

interface StockManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const StockManagement = ({ open, onOpenChange, userId }: StockManagementProps) => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, category,
        stock_inventory (id, quantity, unit, low_stock_threshold)
      `)
      .eq('supplier_id', userId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchProducts();
    }
  }, [open, userId]);

  const handleStockUpdate = async (product: ProductWithStock) => {
    const newQuantity = stockUpdates[product.id];
    if (newQuantity === undefined) return;

    setSaving(product.id);
    try {
      if (product.stock_inventory) {
        // Update existing stock
        const { error: updateError } = await supabase
          .from('stock_inventory')
          .update({ quantity: newQuantity })
          .eq('id', product.stock_inventory.id);

        if (updateError) throw updateError;

        // Log the update
        await supabase.from('stock_updates').insert({
          product_id: product.id,
          previous_quantity: product.stock_inventory.quantity,
          new_quantity: newQuantity,
          updated_by: userId,
          change_reason: 'Manual update',
        });
      } else {
        // Create new stock entry
        const { error: insertError } = await supabase
          .from('stock_inventory')
          .insert({
            product_id: product.id,
            quantity: newQuantity,
            unit: 'units',
          });

        if (insertError) throw insertError;
      }

      toast({ title: 'Success', description: 'Stock updated successfully' });
      fetchProducts();
      setStockUpdates(prev => ({ ...prev, [product.id]: undefined as any }));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSaving(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Management</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products in catalog. Add products first to manage stock.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(product => {
              const currentStock = product.stock_inventory?.quantity ?? 0;
              const isLowStock = product.stock_inventory && currentStock <= product.stock_inventory.low_stock_threshold;

              return (
                <Card key={product.id} className={isLowStock ? 'border-destructive' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <p className="text-sm">
                          Current: <span className={isLowStock ? 'text-destructive font-medium' : ''}>{currentStock} {product.stock_inventory?.unit || 'units'}</span>
                          {isLowStock && <span className="ml-2 text-destructive">(Low Stock!)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <Label className="text-xs">New Quantity</Label>
                          <Input
                            type="number"
                            min="0"
                            className="w-24"
                            value={stockUpdates[product.id] ?? ''}
                            onChange={(e) => setStockUpdates(prev => ({ 
                              ...prev, 
                              [product.id]: parseInt(e.target.value) || 0 
                            }))}
                            placeholder={String(currentStock)}
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStockUpdate(product)}
                          disabled={saving === product.id || stockUpdates[product.id] === undefined}
                        >
                          {saving === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
