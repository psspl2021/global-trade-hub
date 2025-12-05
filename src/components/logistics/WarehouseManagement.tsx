import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Warehouse, MapPin, Check } from 'lucide-react';
import { WarehouseForm } from './WarehouseForm';

interface WarehouseManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const WarehouseManagement = ({ open, onOpenChange, userId }: WarehouseManagementProps) => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('partner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load warehouses');
    } else {
      setWarehouses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchWarehouses();
    }
  }, [open, userId]);

  const toggleActive = async (warehouse: any) => {
    const { error } = await supabase
      .from('warehouses')
      .update({ is_active: !warehouse.is_active })
      .eq('id', warehouse.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setWarehouses(warehouses.map(w => 
        w.id === warehouse.id ? { ...w, is_active: !w.is_active } : w
      ));
    }
  };

  const deleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return;
    
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete warehouse');
    } else {
      toast.success('Warehouse deleted');
      setWarehouses(warehouses.filter(w => w.id !== id));
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingWarehouse(null);
    fetchWarehouses();
  };

  const warehouseTypeLabels: Record<string, string> = {
    general: 'General',
    dry_storage: 'Dry Storage',
    cold_storage: 'Cold Storage',
    bonded: 'Bonded',
    open_yard: 'Open Yard',
    hazmat: 'Hazmat',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Management
          </DialogTitle>
        </DialogHeader>

        {showForm || editingWarehouse ? (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-4">
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h3>
            <WarehouseForm
              userId={userId}
              initialData={editingWarehouse}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingWarehouse(null);
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">
                {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} registered
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : warehouses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No warehouses registered</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first warehouse to start offering storage space
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Warehouse
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {warehouses.map((warehouse) => (
                  <Card key={warehouse.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                            <Badge variant={warehouse.is_active ? "default" : "secondary"}>
                              {warehouse.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {warehouseTypeLabels[warehouse.warehouse_type] || warehouse.warehouse_type}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            {warehouse.address}, {warehouse.city}, {warehouse.state}
                            {warehouse.pincode && ` - ${warehouse.pincode}`}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Total Area</p>
                              <p className="font-medium">{warehouse.total_area_sqft?.toLocaleString()} sq.ft</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="font-medium">{warehouse.available_area_sqft?.toLocaleString()} sq.ft</p>
                            </div>
                            {warehouse.rental_rate_per_sqft && (
                              <div>
                                <p className="text-xs text-muted-foreground">Rate</p>
                                <p className="font-medium">₹{warehouse.rental_rate_per_sqft}/sq.ft/mo</p>
                              </div>
                            )}
                            {warehouse.operating_hours && (
                              <div>
                                <p className="text-xs text-muted-foreground">Hours</p>
                                <p className="font-medium">{warehouse.operating_hours}</p>
                              </div>
                            )}
                          </div>

                          {warehouse.facilities && Object.entries(warehouse.facilities).some(([_, v]) => v) && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {Object.entries(warehouse.facilities).map(([key, value]) => 
                                value && (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    {key.replace(/_/g, ' ')}
                                  </Badge>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Switch
                            checked={warehouse.is_active}
                            onCheckedChange={() => toggleActive(warehouse)}
                          />
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingWarehouse(warehouse)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWarehouse(warehouse.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
