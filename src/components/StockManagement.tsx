import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Save, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface ParsedStockRow {
  productName: string;
  quantity: number;
  unit?: string;
}

export const StockManagement = ({ open, onOpenChange, userId }: StockManagementProps) => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<ParsedStockRow[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setUploadPreview([]);
      setUploadErrors([]);
    }
  }, [open, userId]);

  const handleStockUpdate = async (product: ProductWithStock) => {
    const newQuantity = stockUpdates[product.id];
    if (newQuantity === undefined) return;

    setSaving(product.id);
    try {
      if (product.stock_inventory) {
        const { error: updateError } = await supabase
          .from('stock_inventory')
          .update({ quantity: newQuantity })
          .eq('id', product.stock_inventory.id);

        if (updateError) throw updateError;

        await supabase.from('stock_updates').insert({
          product_id: product.id,
          previous_quantity: product.stock_inventory.quantity,
          new_quantity: newQuantity,
          updated_by: userId,
          change_reason: 'Manual update',
        });
      } else {
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

  const parseCSV = (text: string): ParsedStockRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const nameIndex = headers.findIndex(h => h.includes('product') || h.includes('name') || h.includes('item'));
    const qtyIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('stock'));
    const unitIndex = headers.findIndex(h => h.includes('unit'));

    if (nameIndex === -1 || qtyIndex === -1) {
      throw new Error('CSV must have columns for product name and quantity');
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return {
        productName: values[nameIndex] || '',
        quantity: parseInt(values[qtyIndex]) || 0,
        unit: unitIndex !== -1 ? values[unitIndex] : undefined,
      };
    }).filter(row => row.productName && row.quantity >= 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadErrors([]);
    setUploadPreview([]);

    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        setUploadErrors(['No valid data found in file']);
        return;
      }

      // Match with existing products
      const errors: string[] = [];
      const validRows: ParsedStockRow[] = [];

      parsed.forEach(row => {
        const matchedProduct = products.find(p => 
          p.name.toLowerCase() === row.productName.toLowerCase()
        );
        if (matchedProduct) {
          validRows.push(row);
        } else {
          errors.push(`Product not found: "${row.productName}"`);
        }
      });

      setUploadPreview(validRows);
      setUploadErrors(errors);
    } catch (error: any) {
      setUploadErrors([error.message || 'Failed to parse file']);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyBulkUpdate = async () => {
    if (uploadPreview.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of uploadPreview) {
      const product = products.find(p => p.name.toLowerCase() === row.productName.toLowerCase());
      if (!product) continue;

      try {
        if (product.stock_inventory) {
          const { error } = await supabase
            .from('stock_inventory')
            .update({ quantity: row.quantity })
            .eq('id', product.stock_inventory.id);

          if (error) throw error;

          await supabase.from('stock_updates').insert({
            product_id: product.id,
            previous_quantity: product.stock_inventory.quantity,
            new_quantity: row.quantity,
            updated_by: userId,
            change_reason: 'Bulk upload from stock report',
          });
        } else {
          const { error } = await supabase
            .from('stock_inventory')
            .insert({
              product_id: product.id,
              quantity: row.quantity,
              unit: row.unit || 'units',
            });

          if (error) throw error;
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setUploading(false);
    setUploadPreview([]);
    fetchProducts();

    toast({
      title: 'Bulk Update Complete',
      description: `${successCount} products updated${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
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
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Stock Report
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Save className="h-4 w-4 mr-2" />
                Manual Update
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="stock-file" className="text-sm font-medium">Upload CSV File</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV should have columns: Product Name, Quantity (optional: Unit)
                      </p>
                    </div>
                    <div>
                      <Input
                        id="stock-file"
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="w-auto"
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <FileSpreadsheet className="h-3 w-3" /> Sample Format:
                    </p>
                    <code className="text-xs text-muted-foreground">
                      Product Name,Quantity,Unit<br />
                      Steel Rods,500,kg<br />
                      Copper Wire,200,meters
                    </code>
                  </div>

                  {uploadErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm">
                          {uploadErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {uploadErrors.length > 5 && <li>...and {uploadErrors.length - 5} more</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadPreview.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Preview ({uploadPreview.length} products to update):</p>
                      <div className="max-h-48 overflow-y-auto border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              <th className="text-left p-2">Product</th>
                              <th className="text-right p-2">New Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadPreview.map((row, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{row.productName}</td>
                                <td className="p-2 text-right">{row.quantity} {row.unit || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button onClick={applyBulkUpdate} disabled={uploading} className="w-full">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Apply Stock Updates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
