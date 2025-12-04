import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Save, Upload, FileSpreadsheet, AlertCircle, Download, Link2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

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
    const qtyIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('stock') || h.includes('closing'));
    const unitIndex = headers.findIndex(h => h.includes('unit'));

    if (nameIndex === -1 || qtyIndex === -1) {
      throw new Error('File must have columns for product name and quantity/stock');
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

  const parseExcel = (data: ArrayBuffer): ParsedStockRow[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (jsonData.length === 0) return [];

    // Find column headers (case-insensitive)
    const firstRow = jsonData[0];
    const headers = Object.keys(firstRow).map(h => h.toLowerCase());
    
    const nameKey = Object.keys(firstRow).find(k => {
      const lk = k.toLowerCase();
      return lk.includes('product') || lk.includes('name') || lk.includes('item') || lk.includes('particulars');
    });
    
    const qtyKey = Object.keys(firstRow).find(k => {
      const lk = k.toLowerCase();
      return lk.includes('quantity') || lk.includes('qty') || lk.includes('stock') || lk.includes('closing');
    });
    
    const unitKey = Object.keys(firstRow).find(k => k.toLowerCase().includes('unit'));

    if (!nameKey || !qtyKey) {
      throw new Error('Excel file must have columns for product name and quantity/stock');
    }

    return jsonData.map(row => ({
      productName: String(row[nameKey] || '').trim(),
      quantity: parseInt(String(row[qtyKey])) || 0,
      unit: unitKey ? String(row[unitKey]).trim() : undefined,
    })).filter(row => row.productName && row.quantity >= 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadErrors([]);
    setUploadPreview([]);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let parsed: ParsedStockRow[];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        parsed = parseExcel(buffer);
      } else {
        const text = await file.text();
        parsed = parseCSV(text);
      }
      
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

  const downloadCSVTemplate = () => {
    const csvContent = `Product Name,Quantity,Unit
Steel Rods,500,kg
Copper Wire,200,meters
Plastic Sheets,1000,pieces`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    // Tally/Busy compatible format
    const wsData = [
      ['Product Name', 'Closing Stock', 'Unit', 'Godown/Location'],
      ['Steel Rods', 500, 'kg', 'Main Warehouse'],
      ['Copper Wire', 200, 'meters', 'Main Warehouse'],
      ['Plastic Sheets', 1000, 'pieces', 'Main Warehouse'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    
    // Set column widths
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
    
    XLSX.writeFile(wb, 'stock_template_tally_busy.xlsx');
  };

  const downloadCurrentStock = () => {
    if (products.length === 0) return;

    const wsData = [
      ['Product Name', 'Current Stock', 'Unit', 'Category'],
      ...products.map(p => [
        p.name,
        p.stock_inventory?.quantity ?? 0,
        p.stock_inventory?.unit ?? 'units',
        p.category
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Current Stock');
    
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
    
    XLSX.writeFile(wb, `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Download className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Save className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="integration">
                <Link2 className="h-4 w-4 mr-2" />
                API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="stock-file" className="text-sm font-medium">Upload Stock Report</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports CSV, Excel (.xlsx, .xls) • Tally/Busy exports compatible
                      </p>
                    </div>
                    <div>
                      <Input
                        id="stock-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="w-auto"
                      />
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Supported columns:</strong> Product Name/Item/Particulars, Quantity/Qty/Stock/Closing Stock, Unit (optional)
                    </AlertDescription>
                  </Alert>

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

            <TabsContent value="templates" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV Template
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Simple format for basic stock updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={downloadCSVTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel Template (Tally/Busy)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Compatible with Tally & Busy accounting software
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={downloadExcelTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </Button>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      Export Current Stock
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Download your current stock data as Excel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="secondary" size="sm" onClick={downloadCurrentStock}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Stock Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tally Export:</strong> Go to Gateway of Tally → Display → Inventory Books → Stock Summary → Export (Alt+E)<br />
                  <strong>Busy Export:</strong> Go to Display → Stock Reports → Closing Stock → Export to Excel
                </AlertDescription>
              </Alert>
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

            <TabsContent value="integration" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Integration (Coming Soon)</CardTitle>
                  <CardDescription className="text-xs">
                    Automatically sync stock levels from your accounting software
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">T</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Tally Prime</p>
                          <p className="text-xs text-muted-foreground">TDL-based integration</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Connect via Tally ODBC or REST API for real-time stock sync
                      </p>
                      <Button variant="outline" size="sm" disabled className="w-full">
                        Coming Soon
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">B</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Busy Accounting</p>
                          <p className="text-xs text-muted-foreground">Direct database sync</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-sync closing stock from Busy software daily
                      </p>
                      <Button variant="outline" size="sm" disabled className="w-full">
                        Coming Soon
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Current Workflow:</strong> Export stock reports from Tally/Busy as Excel/CSV and upload them here. 
                      API integration will automate this process.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">API Endpoint (Preview)</p>
                    <code className="text-xs bg-background p-2 rounded block">
                      POST /api/stock/sync<br />
                      Authorization: Bearer YOUR_API_KEY<br />
                      Content-Type: application/json
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Request early access to API integration by contacting support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
