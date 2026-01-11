import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, Package, TrendingUp, TrendingDown, ArrowRightLeft, Download, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { sanitizeExcelData } from '@/lib/excelSanitizer';

interface InventoryItem {
  id: string;
  product_name: string;
  category: string | null;
  sku: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  min_stock_level: number | null;
  max_stock_level: number | null;
  location: string | null;
  supplier_name: string | null;
  last_restocked_at: string | null;
  created_at: string;
}

interface StockMovement {
  id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

interface BuyerStockManagementProps {
  userId: string;
}

const UNIT_OPTIONS = ['units', 'kg', 'tons', 'liters', 'meters', 'pieces', 'boxes', 'bags', 'rolls', 'cartons'];
const CATEGORIES = ['Raw Materials', 'Finished Goods', 'Packaging', 'Spare Parts', 'Consumables', 'Office Supplies', 'Other'];

export const BuyerStockManagement = ({ userId }: BuyerStockManagementProps) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Form state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('units');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number | ''>('');
  const [maxStockLevel, setMaxStockLevel] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [supplierName, setSupplierName] = useState('');

  // Movement form state
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [movementQty, setMovementQty] = useState(0);
  const [movementRef, setMovementRef] = useState('');
  const [movementNotes, setMovementNotes] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [userId]);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('buyer_inventory')
      .select('*')
      .eq('buyer_id', userId)
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Error fetching inventory:', error);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setSku('');
    setDescription('');
    setQuantity(0);
    setUnit('units');
    setUnitPrice('');
    setMinStockLevel('');
    setMaxStockLevel('');
    setLocation('');
    setSupplierName('');
    setEditItem(null);
  };

  const openEditForm = (item: InventoryItem) => {
    setEditItem(item);
    setProductName(item.product_name);
    setCategory(item.category || '');
    setSku(item.sku || '');
    setDescription(item.description || '');
    setQuantity(Number(item.quantity));
    setUnit(item.unit);
    setUnitPrice(item.unit_price || '');
    setMinStockLevel(item.min_stock_level || '');
    setMaxStockLevel(item.max_stock_level || '');
    setLocation(item.location || '');
    setSupplierName(item.supplier_name || '');
    setFormOpen(true);
  };

  const handleSaveItem = async () => {
    if (!productName.trim()) {
      toast({ title: 'Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const itemData = {
      buyer_id: userId,
      product_name: productName,
      category: category || null,
      sku: sku || null,
      description: description || null,
      quantity,
      unit,
      unit_price: unitPrice || null,
      min_stock_level: minStockLevel || null,
      max_stock_level: maxStockLevel || null,
      location: location || null,
      supplier_name: supplierName || null,
    };

    try {
      if (editItem) {
        const { error } = await supabase
          .from('buyer_inventory')
          .update(itemData)
          .eq('id', editItem.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Item updated' });
      } else {
        const { error } = await supabase
          .from('buyer_inventory')
          .insert(itemData);
        if (error) throw error;
        toast({ title: 'Success', description: 'Item added to inventory' });
      }
      fetchInventory();
      setFormOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    const { error } = await supabase.from('buyer_inventory').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Item removed from inventory' });
      fetchInventory();
    }
  };

  const openMovementForm = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementType('in');
    setMovementQty(0);
    setMovementRef('');
    setMovementNotes('');
    setMovementOpen(true);
  };

  const handleStockMovement = async () => {
    if (!selectedItem || movementQty <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Calculate new quantity
      let newQuantity = Number(selectedItem.quantity);
      if (movementType === 'in') {
        newQuantity += movementQty;
      } else if (movementType === 'out') {
        newQuantity -= movementQty;
        if (newQuantity < 0) {
          toast({ title: 'Error', description: 'Insufficient stock', variant: 'destructive' });
          setSaving(false);
          return;
        }
      } else {
        newQuantity = movementQty; // adjustment sets absolute value
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('buyer_inventory')
        .update({ 
          quantity: newQuantity,
          last_restocked_at: movementType === 'in' ? new Date().toISOString() : selectedItem.last_restocked_at
        })
        .eq('id', selectedItem.id);
      if (updateError) throw updateError;

      // Record movement
      const { error: movementError } = await supabase
        .from('buyer_stock_movements')
        .insert({
          inventory_id: selectedItem.id,
          buyer_id: userId,
          movement_type: movementType,
          quantity: movementQty,
          reference_number: movementRef || null,
          notes: movementNotes || null,
        });
      if (movementError) throw movementError;

      toast({ title: 'Success', description: 'Stock updated' });
      fetchInventory();
      setMovementOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const viewHistory = async (item: InventoryItem) => {
    setSelectedItem(item);
    const { data } = await supabase
      .from('buyer_stock_movements')
      .select('*')
      .eq('inventory_id', item.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setMovements((data || []).map((m) => ({
      ...m,
      movement_type: m.movement_type as 'in' | 'out' | 'adjustment',
    })));
    setHistoryOpen(true);
  };

  const exportToExcel = () => {
    if (inventory.length === 0) {
      toast({ title: 'No data', description: 'No inventory to export', variant: 'destructive' });
      return;
    }

    const exportData = inventory.map((item) => ({
      'Product Name': item.product_name,
      'SKU': item.sku || '',
      'Category': item.category || '',
      'Quantity': Number(item.quantity),
      'Unit': item.unit,
      'Unit Price': item.unit_price || '',
      'Total Value': item.unit_price ? Number(item.quantity) * Number(item.unit_price) : '',
      'Min Stock': item.min_stock_level || '',
      'Max Stock': item.max_stock_level || '',
      'Location': item.location || '',
      'Supplier': item.supplier_name || '',
      'Last Restocked': item.last_restocked_at ? format(new Date(item.last_restocked_at), 'dd-MM-yyyy') : '',
    }));

    // Sanitize data to prevent Excel formula injection attacks
    const sanitizedData = sanitizeExcelData(exportData);
    const ws = XLSX.utils.json_to_sheet(sanitizedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `inventory_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Exported', description: 'Inventory exported to Excel' });
  };

  const filteredInventory = inventory.filter((item) =>
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = inventory.filter((item) => 
    item.min_stock_level && Number(item.quantity) <= Number(item.min_stock_level)
  );

  const totalValue = inventory.reduce((sum, item) => 
    sum + (item.unit_price ? Number(item.quantity) * Number(item.unit_price) : 0), 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{inventory.length}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">₹{totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`h-6 w-6 mx-auto mb-1 ${lowStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-2xl font-bold">{lowStockItems.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
        <Input
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Inventory List */}
      {filteredInventory.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No inventory items yet</p>
            <Button onClick={() => { resetForm(); setFormOpen(true); }} className="mt-4" variant="outline">
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInventory.map((item) => {
            const isLowStock = item.min_stock_level && Number(item.quantity) <= Number(item.min_stock_level);
            return (
              <Card key={item.id} className={isLowStock ? 'border-destructive' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.product_name}</span>
                        {item.category && <Badge variant="secondary">{item.category}</Badge>}
                        {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.sku && `SKU: ${item.sku} • `}
                        {item.quantity} {item.unit}
                        {item.unit_price && ` • ₹${Number(item.unit_price).toLocaleString()}/${item.unit}`}
                      </p>
                      {item.location && <p className="text-xs text-muted-foreground">Location: {item.location}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openMovementForm(item)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => viewHistory(item)}>
                        History
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditForm(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Product Name *</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="0" step="any" />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit Price (₹)</Label>
                <Input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')} min="0" step="any" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Stock Level</Label>
                <Input type="number" value={minStockLevel} onChange={(e) => setMinStockLevel(e.target.value ? Number(e.target.value) : '')} min="0" />
              </div>
              <div>
                <Label>Max Stock Level</Label>
                <Input type="number" value={maxStockLevel} onChange={(e) => setMaxStockLevel(e.target.value ? Number(e.target.value) : '')} min="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Storage Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Warehouse A" />
              </div>
              <div>
                <Label>Supplier Name</Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveItem} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editItem ? 'Update' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Dialog */}
      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Movement - {selectedItem?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Current Stock: {selectedItem?.quantity} {selectedItem?.unit}</p>
            
            <div>
              <Label>Movement Type</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as 'in' | 'out' | 'adjustment')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Stock In</div></SelectItem>
                  <SelectItem value="out"><div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-600" /> Stock Out</div></SelectItem>
                  <SelectItem value="adjustment"><div className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Adjustment</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input type="number" value={movementQty} onChange={(e) => setMovementQty(Number(e.target.value))} min="0" step="any" />
              {movementType === 'adjustment' && <p className="text-xs text-muted-foreground mt-1">This will set the absolute quantity</p>}
            </div>

            <div>
              <Label>Reference Number</Label>
              <Input value={movementRef} onChange={(e) => setMovementRef(e.target.value)} placeholder="e.g., PO-123, Invoice #456" />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={movementNotes} onChange={(e) => setMovementNotes(e.target.value)} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMovementOpen(false)}>Cancel</Button>
              <Button onClick={handleStockMovement} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedItem?.product_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No movement history</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {m.movement_type === 'in' && <TrendingUp className="h-5 w-5 text-green-600" />}
                    {m.movement_type === 'out' && <TrendingDown className="h-5 w-5 text-red-600" />}
                    {m.movement_type === 'adjustment' && <ArrowRightLeft className="h-5 w-5" />}
                    <div>
                      <p className="font-medium">
                        {m.movement_type === 'in' && '+'}
                        {m.movement_type === 'out' && '-'}
                        {m.quantity} {selectedItem?.unit}
                      </p>
                      {m.reference_number && <p className="text-xs text-muted-foreground">Ref: {m.reference_number}</p>}
                      {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(m.created_at), 'dd MMM HH:mm')}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
