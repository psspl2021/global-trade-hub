import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { countries } from '@/data/countries';

interface WarehouseFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: any;
}

const warehouseTypes = [
  { value: 'general', label: 'General Storage' },
  { value: 'dry_storage', label: 'Dry Storage' },
  { value: 'cold_storage', label: 'Cold Storage' },
  { value: 'bonded', label: 'Bonded Warehouse' },
  { value: 'open_yard', label: 'Open Yard' },
  { value: 'hazmat', label: 'Hazmat Storage' },
  { value: 'free_trade_zone', label: 'Free Trade Zone' },
  { value: 'container_yard', label: 'Container Yard' },
];

const facilityOptions = [
  { key: 'loading_dock', label: 'Loading Dock' },
  { key: 'forklift', label: 'Forklift Available' },
  { key: 'security_24x7', label: '24x7 Security' },
  { key: 'cctv', label: 'CCTV Surveillance' },
  { key: 'fire_safety', label: 'Fire Safety' },
  { key: 'customs_clearance', label: 'Customs Clearance' },
  { key: 'container_handling', label: 'Container Handling' },
  { key: 'climate_control', label: 'Climate Control' },
];

export const WarehouseForm = ({ userId, onSuccess, onCancel, initialData }: WarehouseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    warehouse_type: initialData?.warehouse_type || 'general',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    pincode: initialData?.pincode || '',
    total_area_sqft: initialData?.total_area_sqft || '',
    available_area_sqft: initialData?.available_area_sqft || '',
    rental_rate_per_sqft: initialData?.rental_rate_per_sqft || '',
    operating_hours: initialData?.operating_hours || '',
    contact_person: initialData?.contact_person || '',
    contact_phone: initialData?.contact_phone || '',
  });
  const [facilities, setFacilities] = useState<Record<string, boolean>>(
    initialData?.facilities || {
      loading_dock: false,
      forklift: false,
      security_24x7: false,
      cctv: false,
      fire_safety: false,
      customs_clearance: false,
      container_handling: false,
      climate_control: false,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!formData.total_area_sqft || !formData.available_area_sqft) {
      toast.error('Area fields are required');
      return;
    }

    setLoading(true);
    try {
      const warehouseData = {
        partner_id: userId,
        name: formData.name.trim(),
        warehouse_type: formData.warehouse_type as any,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country || 'India',
        pincode: formData.pincode || null,
        total_area_sqft: Number(formData.total_area_sqft),
        available_area_sqft: Number(formData.available_area_sqft),
        rental_rate_per_sqft: formData.rental_rate_per_sqft ? Number(formData.rental_rate_per_sqft) : null,
        operating_hours: formData.operating_hours || null,
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        facilities,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('warehouses')
          .update(warehouseData)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success('Warehouse updated successfully');
      } else {
        const { error } = await supabase
          .from('warehouses')
          .insert(warehouseData);
        if (error) throw error;
        toast.success('Warehouse added successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Warehouse Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Warehouse name"
          />
        </div>

        <div className="space-y-2">
          <Label>Warehouse Type *</Label>
          <Select value={formData.warehouse_type} onValueChange={(v) => setFormData({ ...formData, warehouse_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {warehouseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Address *</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full address"
          />
        </div>

        <div className="space-y-2">
          <Label>City *</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
          />
        </div>

        <div className="space-y-2">
          <Label>State/Province *</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="State/Province"
          />
        </div>

        <div className="space-y-2">
          <Label>Country *</Label>
          <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder="400001"
          />
        </div>

        <div className="space-y-2">
          <Label>Total Area (sq.ft) *</Label>
          <Input
            type="number"
            value={formData.total_area_sqft}
            onChange={(e) => setFormData({ ...formData, total_area_sqft: e.target.value })}
            placeholder="10000"
          />
        </div>

        <div className="space-y-2">
          <Label>Available Area (sq.ft) *</Label>
          <Input
            type="number"
            value={formData.available_area_sqft}
            onChange={(e) => setFormData({ ...formData, available_area_sqft: e.target.value })}
            placeholder="5000"
          />
        </div>

        <div className="space-y-2">
          <Label>Rental Rate (₹/sq.ft/month)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.rental_rate_per_sqft}
            onChange={(e) => setFormData({ ...formData, rental_rate_per_sqft: e.target.value })}
            placeholder="25"
          />
        </div>

        <div className="space-y-2">
          <Label>Operating Hours</Label>
          <Input
            value={formData.operating_hours}
            onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
            placeholder="9 AM - 6 PM"
          />
        </div>

        <div className="space-y-2">
          <Label>Contact Person</Label>
          <Input
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Contact name"
          />
        </div>

        <div className="space-y-2">
          <Label>Contact Phone</Label>
          <Input
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Facilities</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {facilityOptions.map((facility) => (
            <div key={facility.key} className="flex items-center space-x-2">
              <Checkbox
                id={facility.key}
                checked={facilities[facility.key]}
                onCheckedChange={(checked) =>
                  setFacilities({ ...facilities, [facility.key]: !!checked })
                }
              />
              <label htmlFor={facility.key} className="text-sm cursor-pointer">
                {facility.label}
              </label>
            </div>
          ))}
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
          {initialData?.id ? 'Update Warehouse' : 'Add Warehouse'}
        </Button>
      </div>
    </form>
  );
};
