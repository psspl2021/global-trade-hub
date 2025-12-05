import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VehicleFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: any;
}

const vehicleTypes = [
  { value: 'truck', label: 'Truck' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'container_truck', label: 'Container Truck' },
  { value: 'mini_truck', label: 'Mini Truck' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'lpv', label: 'Light Passenger Vehicle' },
];

const fuelTypes = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const VehicleForm = ({ userId, onSuccess, onCancel, initialData }: VehicleFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: initialData?.vehicle_type || 'truck',
    registration_number: initialData?.registration_number || '',
    manufacturer: initialData?.manufacturer || '',
    model: initialData?.model || '',
    capacity_tons: initialData?.capacity_tons || '',
    capacity_volume_cbm: initialData?.capacity_volume_cbm || '',
    fuel_type: initialData?.fuel_type || 'diesel',
    year_of_manufacture: initialData?.year_of_manufacture || '',
    current_location: initialData?.current_location || '',
    insurance_valid_until: initialData?.insurance_valid_until || '',
    permit_valid_until: initialData?.permit_valid_until || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registration_number.trim()) {
      toast.error('Registration number is required');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        partner_id: userId,
        vehicle_type: formData.vehicle_type as any,
        registration_number: formData.registration_number.trim().toUpperCase(),
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        capacity_tons: formData.capacity_tons ? Number(formData.capacity_tons) : null,
        capacity_volume_cbm: formData.capacity_volume_cbm ? Number(formData.capacity_volume_cbm) : null,
        fuel_type: formData.fuel_type as any,
        year_of_manufacture: formData.year_of_manufacture ? Number(formData.year_of_manufacture) : null,
        current_location: formData.current_location || null,
        insurance_valid_until: formData.insurance_valid_until || null,
        permit_valid_until: formData.permit_valid_until || null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Vehicle updated successfully');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);
        if (error) throw error;
        toast.success('Vehicle added successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vehicle Type *</Label>
          <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Registration Number *</Label>
          <Input
            value={formData.registration_number}
            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
            placeholder="MH12AB1234"
            className="uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label>Manufacturer</Label>
          <Input
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="Tata, Ashok Leyland, etc."
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Model name"
          />
        </div>

        <div className="space-y-2">
          <Label>Capacity (Tons)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.capacity_tons}
            onChange={(e) => setFormData({ ...formData, capacity_tons: e.target.value })}
            placeholder="10"
          />
        </div>

        <div className="space-y-2">
          <Label>Capacity (CBM)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.capacity_volume_cbm}
            onChange={(e) => setFormData({ ...formData, capacity_volume_cbm: e.target.value })}
            placeholder="20"
          />
        </div>

        <div className="space-y-2">
          <Label>Fuel Type</Label>
          <Select value={formData.fuel_type} onValueChange={(v) => setFormData({ ...formData, fuel_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Year of Manufacture</Label>
          <Input
            type="number"
            value={formData.year_of_manufacture}
            onChange={(e) => setFormData({ ...formData, year_of_manufacture: e.target.value })}
            placeholder="2022"
          />
        </div>

        <div className="space-y-2">
          <Label>Current Location</Label>
          <Input
            value={formData.current_location}
            onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
            placeholder="City, State"
          />
        </div>

        <div className="space-y-2">
          <Label>Insurance Valid Until</Label>
          <Input
            type="date"
            value={formData.insurance_valid_until}
            onChange={(e) => setFormData({ ...formData, insurance_valid_until: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Permit Valid Until</Label>
          <Input
            type="date"
            value={formData.permit_valid_until}
            onChange={(e) => setFormData({ ...formData, permit_valid_until: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData?.id ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
    </form>
  );
};
