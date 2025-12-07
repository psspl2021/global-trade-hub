import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, Truck, CheckCircle, XCircle, FileText, 
  MapPin, Package, Calendar, User, Building2 
} from 'lucide-react';

interface VehicleVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

interface PendingVehicle {
  id: string;
  vehicle_type: string;
  registration_number: string;
  manufacturer: string | null;
  model: string | null;
  capacity_tons: number | null;
  capacity_volume_cbm: number | null;
  current_location: string | null;
  rc_document_url: string | null;
  routes: { origin: string; destination: string }[] | null;
  created_at: string;
  partner_id: string;
  partner_profile?: {
    company_name: string;
    contact_person: string;
    phone: string;
  };
}

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

export const VehicleVerification = ({ open, onOpenChange, adminId }: VehicleVerificationProps) => {
  const [vehicles, setVehicles] = useState<PendingVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<PendingVehicle | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPendingVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('vehicles') as any)
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch partner profiles for each vehicle
      const vehiclesWithProfiles = await Promise.all(
        (data || []).map(async (vehicle: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, contact_person, phone')
            .eq('id', vehicle.partner_id)
            .maybeSingle();
          
          return {
            ...vehicle,
            partner_profile: profile,
          };
        })
      );

      setVehicles(vehiclesWithProfiles);
    } catch (error: any) {
      toast.error('Failed to load pending vehicles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPendingVehicles();
    }
  }, [open]);

  const approveVehicle = async (vehicleId: string) => {
    setProcessing(true);
    try {
      const { error } = await (supabase
        .from('vehicles') as any)
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success('Vehicle approved successfully');
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      setSelectedVehicle(null);
    } catch (error: any) {
      toast.error('Failed to approve vehicle');
    } finally {
      setProcessing(false);
    }
  };

  const rejectVehicle = async (vehicleId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await (supabase
        .from('vehicles') as any)
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success('Vehicle rejected');
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      setSelectedVehicle(null);
      setRejecting(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error('Failed to reject vehicle');
    } finally {
      setProcessing(false);
    }
  };

  const formatRoutes = (routes: { origin: string; destination: string }[] | null) => {
    if (!routes || routes.length === 0) return 'No routes specified';
    return routes.map(r => `${r.origin} → ${r.destination}`).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Vehicle Verification
            {vehicles.length > 0 && (
              <Badge variant="secondary">{vehicles.length} pending</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No vehicles pending verification</p>
          </div>
        ) : selectedVehicle ? (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSelectedVehicle(null); setRejecting(false); }}
            >
              ← Back to list
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {vehicleTypeLabels[selectedVehicle.vehicle_type] || selectedVehicle.vehicle_type}
                    </Badge>
                    <CardTitle className="text-xl">
                      {selectedVehicle.manufacturer} {selectedVehicle.model}
                    </CardTitle>
                    <p className="font-mono text-lg">{selectedVehicle.registration_number}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Partner Info */}
                {selectedVehicle.partner_profile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Partner Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Company:</span>{' '}
                        {selectedVehicle.partner_profile.company_name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span>{' '}
                        {selectedVehicle.partner_profile.contact_person}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{' '}
                        {selectedVehicle.partner_profile.phone}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Capacity: {selectedVehicle.capacity_tons ? `${selectedVehicle.capacity_tons}T` : '-'}
                      {selectedVehicle.capacity_volume_cbm && ` / ${selectedVehicle.capacity_volume_cbm} CBM`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Location: {selectedVehicle.current_location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registered: {new Date(selectedVehicle.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Routes */}
                <div>
                  <h4 className="font-medium mb-2">Operational Routes</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatRoutes(selectedVehicle.routes)}
                  </p>
                </div>

                {/* RC Document */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    RC Document
                  </h4>
                  {selectedVehicle.rc_document_url ? (
                    <div className="border rounded-lg overflow-hidden">
                      {selectedVehicle.rc_document_url.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={selectedVehicle.rc_document_url}
                          className="w-full h-[400px]"
                          title="RC Document"
                        />
                      ) : (
                        <img
                          src={selectedVehicle.rc_document_url}
                          alt="RC Document"
                          className="w-full max-h-[400px] object-contain bg-muted"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center border rounded-lg bg-muted">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No RC document uploaded</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {rejecting ? (
                  <div className="space-y-4 border-t pt-4">
                    <Label>Rejection Reason *</Label>
                    <Textarea
                      placeholder="Please provide a clear reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => { setRejecting(false); setRejectionReason(''); }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => rejectVehicle(selectedVehicle.id)}
                        disabled={processing || !rejectionReason.trim()}
                      >
                        {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm Rejection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3 border-t pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setRejecting(true)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      onClick={() => approveVehicle(selectedVehicle.id)}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Vehicle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
                          </Badge>
                          <span className="font-mono font-medium">{vehicle.registration_number}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.manufacturer} {vehicle.model}
                          {vehicle.partner_profile && ` • ${vehicle.partner_profile.company_name}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {new Date(vehicle.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};