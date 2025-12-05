import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Truck } from 'lucide-react';
import { VehicleForm } from './VehicleForm';

interface FleetManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const FleetManagement = ({ open, onOpenChange, userId }: FleetManagementProps) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('partner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load vehicles');
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchVehicles();
    }
  }, [open, userId]);

  const toggleAvailability = async (vehicle: any) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_available: !vehicle.is_available })
      .eq('id', vehicle.id);

    if (error) {
      toast.error('Failed to update availability');
    } else {
      setVehicles(vehicles.map(v => 
        v.id === vehicle.id ? { ...v, is_available: !v.is_available } : v
      ));
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete vehicle');
    } else {
      toast.success('Vehicle deleted');
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const vehicleTypeLabels: Record<string, string> = {
    truck: 'Truck',
    trailer: 'Trailer',
    tanker: 'Tanker',
    container_truck: 'Container Truck',
    mini_truck: 'Mini Truck',
    pickup: 'Pickup',
    tempo: 'Tempo',
    lpv: 'LPV',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Fleet Management
          </DialogTitle>
        </DialogHeader>

        {showForm || editingVehicle ? (
          <div className="py-4">
            <h3 className="text-lg font-medium mb-4">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <VehicleForm
              userId={userId}
              initialData={editingVehicle}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingVehicle(null);
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground">
                {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No vehicles registered</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first vehicle to start accepting transport requests
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {vehicle.registration_number}
                        </TableCell>
                        <TableCell>
                          {vehicle.manufacturer || '-'}
                          {vehicle.model && ` ${vehicle.model}`}
                        </TableCell>
                        <TableCell>
                          {vehicle.capacity_tons ? `${vehicle.capacity_tons}T` : '-'}
                          {vehicle.capacity_volume_cbm && ` / ${vehicle.capacity_volume_cbm} CBM`}
                        </TableCell>
                        <TableCell>{vehicle.current_location || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={vehicle.is_available}
                            onCheckedChange={() => toggleAvailability(vehicle)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingVehicle(vehicle)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteVehicle(vehicle.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
