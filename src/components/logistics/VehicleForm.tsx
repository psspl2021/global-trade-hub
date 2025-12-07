import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, Plus, FileText, AlertCircle, Truck, Ship, Plane, Train } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { globalLocations, globalTradeRoutes } from '@/data/globalLocations';

interface VehicleFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: any;
}

interface Route {
  origin: string;
  destination: string;
}

// Road Freight Vehicle Types
const roadVehicleTypes = [
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'trailer', label: 'Trailer', icon: Truck },
  { value: 'tanker', label: 'Tanker', icon: Truck },
  { value: 'container_truck', label: 'Container Truck', icon: Truck },
  { value: 'mini_truck', label: 'Mini Truck', icon: Truck },
  { value: 'pickup', label: 'Pickup', icon: Truck },
  { value: 'tempo', label: 'Tempo', icon: Truck },
  { value: 'lpv', label: 'Light Passenger Vehicle', icon: Truck },
];

// Sea Freight Types
const seaFreightTypes = [
  { value: 'fcl_20ft', label: '20ft FCL Container', icon: Ship },
  { value: 'fcl_40ft', label: '40ft FCL Container', icon: Ship },
  { value: 'fcl_40hc', label: '40ft HC Container', icon: Ship },
  { value: 'lcl', label: 'LCL (Less than Container)', icon: Ship },
  { value: 'bulk_carrier', label: 'Bulk Carrier', icon: Ship },
  { value: 'roro', label: 'RoRo (Roll-on/Roll-off)', icon: Ship },
];

// Air Freight Types
const airFreightTypes = [
  { value: 'air_cargo', label: 'Air Cargo', icon: Plane },
  { value: 'express_air', label: 'Express Air Courier', icon: Plane },
  { value: 'charter_cargo', label: 'Charter Cargo', icon: Plane },
];

// Rail Freight Types
const railFreightTypes = [
  { value: 'rail_container', label: 'Rail Container', icon: Train },
  { value: 'rail_wagon', label: 'Rail Wagon', icon: Train },
  { value: 'rail_tanker', label: 'Rail Tanker', icon: Train },
];

const allVehicleTypes = [...roadVehicleTypes, ...seaFreightTypes, ...airFreightTypes, ...railFreightTypes];

const fuelTypes = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'marine_diesel', label: 'Marine Diesel' },
  { value: 'jet_fuel', label: 'Jet Fuel' },
];

const popularRoutes = globalTradeRoutes.slice(0, 6).map(r => ({
  origin: `${r.origin}, ${r.originCountry}`,
  destination: `${r.destination}, ${r.destinationCountry}`,
}));

export const VehicleForm = ({ userId, onSuccess, onCancel, initialData }: VehicleFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadingRC, setUploadingRC] = useState(false);
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [rcPreviewUrl, setRcPreviewUrl] = useState<string>(initialData?.rc_document_url || '');
  const [duplicateError, setDuplicateError] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>(
    initialData?.routes && Array.isArray(initialData.routes) 
      ? initialData.routes 
      : [{ origin: '', destination: '' }]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const checkDuplicateRegistration = async (regNumber: string) => {
    if (!regNumber.trim()) return;
    
    const normalizedReg = regNumber.trim().toUpperCase();
    
    // Skip check if editing and number hasn't changed
    if (initialData?.id && initialData?.registration_number === normalizedReg) {
      setDuplicateError('');
      return;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('id')
      .eq('registration_number', normalizedReg)
      .maybeSingle();

    if (data) {
      setDuplicateError('This vehicle number is already registered on the platform');
    } else {
      setDuplicateError('');
    }
  };

  const handleRCFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, and PNG files are allowed');
      return;
    }

    setRcFile(file);
    if (file.type.startsWith('image/')) {
      setRcPreviewUrl(URL.createObjectURL(file));
    } else {
      setRcPreviewUrl('pdf');
    }
  };

  const uploadRCDocument = async (): Promise<string | null> => {
    if (!rcFile) return rcPreviewUrl || null;

    setUploadingRC(true);
    try {
      const fileExt = rcFile.name.split('.').pop();
      const fileName = `${userId}/${formData.registration_number.trim().toUpperCase()}_RC_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(fileName, rcFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error('Failed to upload RC document');
      return null;
    } finally {
      setUploadingRC(false);
    }
  };

  const addRoute = () => {
    setRoutes([...routes, { origin: '', destination: '' }]);
  };

  const removeRoute = (index: number) => {
    if (routes.length > 1) {
      setRoutes(routes.filter((_, i) => i !== index));
    }
  };

  const updateRoute = (index: number, field: 'origin' | 'destination', value: string) => {
    const newRoutes = [...routes];
    newRoutes[index][field] = value;
    setRoutes(newRoutes);
  };

  const addPopularRoute = (route: { origin: string; destination: string }) => {
    // Check if route already exists
    const exists = routes.some(r => r.origin === route.origin && r.destination === route.destination);
    if (!exists) {
      if (routes.length === 1 && !routes[0].origin && !routes[0].destination) {
        setRoutes([route]);
      } else {
        setRoutes([...routes, route]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.registration_number.trim()) {
      toast.error('Registration number is required');
      return;
    }

    if (duplicateError) {
      toast.error('Please fix the duplicate registration number error');
      return;
    }

    // RC document is required for new vehicles
    if (!initialData?.id && !rcFile && !rcPreviewUrl) {
      toast.error('RC document is required for new vehicles');
      return;
    }

    setLoading(true);
    try {
      // Upload RC document if provided
      const rcUrl = await uploadRCDocument();

      // Filter out empty routes
      const validRoutes = routes.filter(r => r.origin.trim() && r.destination.trim());

      const vehicleData: any = {
        partner_id: userId,
        vehicle_type: formData.vehicle_type,
        registration_number: formData.registration_number.trim().toUpperCase(),
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        capacity_tons: formData.capacity_tons ? Number(formData.capacity_tons) : null,
        capacity_volume_cbm: formData.capacity_volume_cbm ? Number(formData.capacity_volume_cbm) : null,
        fuel_type: formData.fuel_type,
        year_of_manufacture: formData.year_of_manufacture ? Number(formData.year_of_manufacture) : null,
        current_location: formData.current_location || null,
        insurance_valid_until: formData.insurance_valid_until || null,
        permit_valid_until: formData.permit_valid_until || null,
        routes: validRoutes,
      };

      // Add RC document URL if uploaded
      if (rcUrl) {
        vehicleData.rc_document_url = rcUrl;
        vehicleData.rc_uploaded_at = new Date().toISOString();
      }

      // For new vehicles, set verification status to pending
      if (!initialData?.id) {
        vehicleData.verification_status = 'pending';
      }

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
        if (error) {
          if (error.code === '23505') {
            toast.error('This vehicle number is already registered');
            return;
          }
          throw error;
        }
        toast.success('Vehicle added successfully. Pending verification.');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vehicle/Freight Type *</Label>
          <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({ ...formData, vehicle_type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" /> Road Freight
              </div>
              {roadVehicleTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                <Ship className="h-3 w-3" /> Sea Freight
              </div>
              {seaFreightTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                <Plane className="h-3 w-3" /> Air Freight
              </div>
              {airFreightTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-2">
                <Train className="h-3 w-3" /> Rail Freight
              </div>
              {railFreightTypes.map((type) => (
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
            onBlur={(e) => checkDuplicateRegistration(e.target.value)}
            placeholder="MH12AB1234"
            className={`uppercase ${duplicateError ? 'border-destructive' : ''}`}
          />
          {duplicateError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {duplicateError}
            </p>
          )}
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

      {/* RC Document Upload Section */}
      <div className="space-y-3 border rounded-lg p-4">
        <Label className="text-base font-medium">
          RC Document Upload {!initialData?.id && '*'}
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload your vehicle Registration Certificate (RC). Accepted formats: PDF, JPEG, PNG (max 5MB)
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRCFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />

        {rcPreviewUrl ? (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {rcPreviewUrl === 'pdf' || rcPreviewUrl.endsWith('.pdf') ? (
              <FileText className="h-10 w-10 text-primary" />
            ) : (
              <img src={rcPreviewUrl} alt="RC Preview" className="h-16 w-16 object-cover rounded" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {rcFile ? rcFile.name : 'RC Document Uploaded'}
              </p>
              <p className="text-xs text-muted-foreground">
                {rcFile ? `${(rcFile.size / 1024).toFixed(1)} KB` : 'Click to change'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setRcFile(null);
                setRcPreviewUrl('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full h-24 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Click to upload RC document</span>
            </div>
          </Button>
        )}

        {!initialData?.id && !rcFile && !rcPreviewUrl && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              RC document is required. Your vehicle will be verified by admin before being visible to buyers.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Routes Section */}
      <div className="space-y-3 border rounded-lg p-4">
        <Label className="text-base font-medium">Operational Routes</Label>
        <p className="text-sm text-muted-foreground">
          Add routes where your vehicle operates. This helps buyers find your vehicle.
        </p>

        {/* Popular Routes */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {popularRoutes.map((route, i) => (
            <Button
              key={i}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => addPopularRoute(route)}
            >
              {route.origin} → {route.destination}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {routes.map((route, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Origin City"
                value={route.origin}
                onChange={(e) => updateRoute(index, 'origin', e.target.value)}
                className="flex-1"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                placeholder="Destination City"
                value={route.destination}
                onChange={(e) => updateRoute(index, 'destination', e.target.value)}
                className="flex-1"
              />
              {routes.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRoute(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addRoute}>
          <Plus className="h-4 w-4 mr-1" />
          Add Route
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading || uploadingRC || !!duplicateError}>
          {(loading || uploadingRC) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData?.id ? 'Update Vehicle' : 'Add Vehicle'}
        </Button>
      </div>
    </form>
  );
};