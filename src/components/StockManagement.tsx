import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Save, Upload, FileSpreadsheet, AlertCircle, Download, Link2, Info, Plus, Check, X, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiIntegrationTab } from '@/components/stock/ApiIntegrationTab';
import { SupplierInventorySaleAI } from '@/components/SupplierInventorySaleAI';
import * as XLSX from 'xlsx';
import { sanitizeExcelAOA, sanitizeImportedExcelData } from '@/lib/excelSanitizer';

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
  category?: string;
  matched?: boolean;
  selected?: boolean;
}

const PRODUCT_CATEGORIES = [
  'Industrial Supplies',
  'Raw Materials',
  'Electronics',
  'Machinery',
  'Chemicals',
  'Textiles',
  'Agriculture',
  'Construction',
  'Packaging',
  'Other'
];

export const StockManagement = ({ open, onOpenChange, userId }: StockManagementProps) => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number | undefined>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [matchedRows, setMatchedRows] = useState<ParsedStockRow[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<ParsedStockRow[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<string>('Industrial Supplies');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [activeTab, setActiveTab] = useState<string>('ai-demand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handler to switch to upload tab from AI component
  const handleOpenStockUpload = () => {
    setActiveTab('upload');
  };

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
      resetUploadState();
    }
  }, [open, userId]);

  const resetUploadState = () => {
    setMatchedRows([]);
    setUnmatchedRows([]);
    setUploadErrors([]);
    setStep('upload');
  };

  const handleStockUpdate = async (product: ProductWithStock) => {
    const newQuantity = stockUpdates[product.id];
    if (newQuantity === undefined || newQuantity === null) return;

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
    const nameIndex = headers.findIndex(h => h.includes('product') || h.includes('name') || h.includes('item') || h.includes('particulars'));
    const qtyIndex = headers.findIndex(h => h.includes('quantity') || h.includes('qty') || h.includes('stock') || h.includes('closing'));
    const unitIndex = headers.findIndex(h => h.includes('unit'));
    const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('group'));

    if (nameIndex === -1 || qtyIndex === -1) {
      throw new Error('File must have columns for product name and quantity/stock');
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return {
        productName: values[nameIndex] || '',
        quantity: parseInt(values[qtyIndex]) || 0,
        unit: unitIndex !== -1 ? values[unitIndex] : undefined,
        category: categoryIndex !== -1 ? values[categoryIndex] : undefined,
      };
    }).filter(row => row.productName && row.quantity >= 0);
  };

  const parseExcel = (data: ArrayBuffer): ParsedStockRow[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (jsonData.length === 0) return [];

    const firstRow = jsonData[0];
    
    const nameKey = Object.keys(firstRow).find(k => {
      const lk = k.toLowerCase();
      return lk.includes('product') || lk.includes('name') || lk.includes('item') || lk.includes('particulars');
    });
    
    const qtyKey = Object.keys(firstRow).find(k => {
      const lk = k.toLowerCase();
      return lk.includes('quantity') || lk.includes('qty') || lk.includes('stock') || lk.includes('closing');
    });
    
    const unitKey = Object.keys(firstRow).find(k => k.toLowerCase().includes('unit'));
    const categoryKey = Object.keys(firstRow).find(k => {
      const lk = k.toLowerCase();
      return lk.includes('category') || lk.includes('group');
    });

    if (!nameKey || !qtyKey) {
      throw new Error('Excel file must have columns for product name and quantity/stock');
    }

    return jsonData.map(row => ({
      productName: String(row[nameKey] || '').trim(),
      quantity: parseInt(String(row[qtyKey])) || 0,
      unit: unitKey ? String(row[unitKey]).trim() : undefined,
      category: categoryKey ? String(row[categoryKey]).trim() : undefined,
    })).filter(row => row.productName && row.quantity >= 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetUploadState();

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
        setUploadErrors(['No valid data found in file. Make sure it has Product Name and Quantity columns.']);
        return;
      }

      // Separate matched and unmatched products
      const matched: ParsedStockRow[] = [];
      const unmatched: ParsedStockRow[] = [];

      parsed.forEach(row => {
        const matchedProduct = products.find(p => 
          p.name.toLowerCase().trim() === row.productName.toLowerCase().trim()
        );
        if (matchedProduct) {
          matched.push({ ...row, matched: true, selected: true });
        } else {
          unmatched.push({ ...row, matched: false, selected: true });
        }
      });

      setMatchedRows(matched);
      setUnmatchedRows(unmatched);
      setStep('preview');

      toast({
        title: 'File Parsed',
        description: `Found ${matched.length} existing products, ${unmatched.length} new products`,
      });
    } catch (error: any) {
      setUploadErrors([error.message || 'Failed to parse file']);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleUnmatchedSelection = (index: number) => {
    setUnmatchedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, selected: !row.selected } : row
    ));
  };

  const toggleMatchedSelection = (index: number) => {
    setMatchedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, selected: !row.selected } : row
    ));
  };

  const applyImport = async () => {
    setUploading(true);
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Create new products from unmatched rows
    const selectedUnmatched = unmatchedRows.filter(r => r.selected);
    for (const row of selectedUnmatched) {
      try {
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            supplier_id: userId,
            name: row.productName,
            category: row.category || defaultCategory,
            description: `Imported from stock report`,
          })
          .select('id')
          .single();

        if (createError) throw createError;

        // Create stock inventory for new product
        await supabase.from('stock_inventory').insert({
          product_id: newProduct.id,
          quantity: row.quantity,
          unit: row.unit || 'units',
        });

        createdCount++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to create product:', row.productName, err);
        errorCount++;
      }
    }

    // Update stock for matched products
    const selectedMatched = matchedRows.filter(r => r.selected);
    for (const row of selectedMatched) {
      const product = products.find(p => 
        p.name.toLowerCase().trim() === row.productName.toLowerCase().trim()
      );
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
        updatedCount++;
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to update stock:', row.productName, err);
        errorCount++;
      }
    }

    setUploading(false);
    resetUploadState();
    fetchProducts();

    const messages = [];
    if (createdCount > 0) messages.push(`${createdCount} products created`);
    if (updatedCount > 0) messages.push(`${updatedCount} stocks updated`);
    if (errorCount > 0) messages.push(`${errorCount} failed`);

    toast({
      title: 'Import Complete',
      description: messages.join(', ') || 'No changes made',
      variant: errorCount > 0 ? 'destructive' : 'default',
    });
  };

  const downloadCSVTemplate = () => {
    const csvContent = `Product Name,Quantity,Unit,Category
Steel Rods,500,kg,Industrial Supplies
Copper Wire,200,meters,Raw Materials
Plastic Sheets,1000,pieces,Packaging`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const wsData = [
      ['Product Name', 'Closing Stock', 'Unit', 'Category', 'Godown/Location'],
      ['Steel Rods', 500, 'kg', 'Industrial Supplies', 'Main Warehouse'],
      ['Copper Wire', 200, 'meters', 'Raw Materials', 'Main Warehouse'],
      ['Plastic Sheets', 1000, 'pieces', 'Packaging', 'Main Warehouse'],
    ];
    
    // Sanitize data to prevent Excel formula injection attacks
    const sanitizedWsData = sanitizeExcelAOA(wsData);
    const ws = XLSX.utils.aoa_to_sheet(sanitizedWsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];
    
    XLSX.writeFile(wb, 'stock_template_tally_busy.xlsx');
  };

  const downloadCurrentStock = () => {
    if (products.length === 0) {
      toast({ title: 'No Products', description: 'Add products first to export', variant: 'destructive' });
      return;
    }

    const wsData = [
      ['Product Name', 'Current Stock', 'Unit', 'Category'],
      ...products.map(p => [
        p.name,
        p.stock_inventory?.quantity ?? 0,
        p.stock_inventory?.unit ?? 'units',
        p.category
      ])
    ];

    // Sanitize data to prevent Excel formula injection attacks
    const sanitizedWsData = sanitizeExcelAOA(wsData);
    const ws = XLSX.utils.aoa_to_sheet(sanitizedWsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Current Stock');
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
    
    XLSX.writeFile(wb, `stock_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalSelected = matchedRows.filter(r => r.selected).length + unmatchedRows.filter(r => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Management</DialogTitle>
          <DialogDescription>
            Import stock from CSV/Excel or update manually
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai-demand">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Demand
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </TabsTrigger>
              <TabsTrigger value="templates">
                <Download className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="manual" disabled={products.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="integration">
                <Link2 className="h-4 w-4 mr-2" />
                API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-demand" className="mt-4">
              <SupplierInventorySaleAI 
                userId={userId} 
                userRole="supplier" 
                onOpenStockUpload={handleOpenStockUpload}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              {step === 'upload' ? (
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
                        <strong>Supported columns:</strong> Product Name/Item/Particulars, Quantity/Qty/Stock/Closing Stock, Unit (optional), Category (optional)
                        <br /><br />
                        <strong>New Feature:</strong> Products not in your catalog will be shown for you to create automatically!
                      </AlertDescription>
                    </Alert>

                    {uploadErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm">
                            {uploadErrors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {products.length === 0 && (
                      <Alert>
                        <Package className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          You have no products yet. Upload a stock file and new products will be created automatically!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={resetUploadState}>
                      ← Back to Upload
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {totalSelected} items selected
                    </div>
                  </div>

                  {/* Matched Products (Stock Updates) */}
                  {matchedRows.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Update Stock ({matchedRows.length} existing products)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="max-h-40 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="w-8 p-2"></th>
                                <th className="text-left p-2">Product</th>
                                <th className="text-right p-2">New Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {matchedRows.map((row, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2">
                                    <Checkbox 
                                      checked={row.selected} 
                                      onCheckedChange={() => toggleMatchedSelection(i)}
                                    />
                                  </td>
                                  <td className="p-2">{row.productName}</td>
                                  <td className="p-2 text-right">{row.quantity} {row.unit || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Unmatched Products (Create New) */}
                  {unmatchedRows.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Plus className="h-4 w-4 text-blue-500" />
                          Create New Products ({unmatchedRows.length} items)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          These products don't exist in your catalog. Select which ones to create.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-2 space-y-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Default Category:</Label>
                          <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCT_CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="w-8 p-2"></th>
                                <th className="text-left p-2">Product</th>
                                <th className="text-right p-2">Qty</th>
                                <th className="text-left p-2">Category</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unmatchedRows.map((row, i) => (
                                <tr key={i} className="border-t">
                                  <td className="p-2">
                                    <Checkbox 
                                      checked={row.selected} 
                                      onCheckedChange={() => toggleUnmatchedSelection(i)}
                                    />
                                  </td>
                                  <td className="p-2">{row.productName}</td>
                                  <td className="p-2 text-right">{row.quantity} {row.unit || ''}</td>
                                  <td className="p-2 text-xs text-muted-foreground">
                                    {row.category || defaultCategory}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    onClick={applyImport} 
                    disabled={uploading || totalSelected === 0} 
                    className="w-full"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Import {totalSelected} Items
                  </Button>
                </div>
              )}
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
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No products yet. Use Import to create products from CSV/Excel.</p>
                </div>
              ) : (
                products.map(product => {
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
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const numVal = parseInt(val, 10);
                                  setStockUpdates(prev => ({ 
                                    ...prev, 
                                    [product.id]: val === '' ? undefined : (isNaN(numVal) ? undefined : numVal)
                                  }));
                                }}
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
                })
              )}
            </TabsContent>

            <TabsContent value="integration" className="space-y-4 mt-4">
              <ApiIntegrationTab userId={userId} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
