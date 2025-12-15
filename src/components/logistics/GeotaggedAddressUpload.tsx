import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Camera, MapPin, CheckCircle, XCircle, Loader2, 
  Trash2, FileText, Navigation, AlertTriangle 
} from 'lucide-react';

interface GeotaggedAddressUploadProps {
  userId: string;
  addressType: 'house_address' | 'office_address';
  label: string;
  description: string;
  required?: boolean;
  onUploadComplete?: () => void;
}

interface Geolocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface DocumentRecord {
  id: string;
  file_url: string;
  file_name: string;
  verification_status: string;
  rejection_reason: string | null;
  geolocation: Geolocation | null;
  captured_at: string | null;
}

interface AddressData {
  address: string;
  document: DocumentRecord | null;
}

export const GeotaggedAddressUpload = ({
  userId,
  addressType,
  label,
  description,
  required = false,
  onUploadComplete
}: GeotaggedAddressUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({ address: '', document: null });
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Geolocation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentType = `${addressType}_photo`;

  const fetchData = async () => {
    try {
      // Fetch address from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select(addressType)
        .eq('id', userId)
        .maybeSingle();

      // Fetch document
      const { data: doc } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('partner_id', userId)
        .eq('document_type', documentType)
        .maybeSingle();

      setAddressData({
        address: profile?.[addressType] || '',
        document: doc ? {
          id: doc.id,
          file_url: doc.file_url,
          file_name: doc.file_name,
          verification_status: doc.verification_status,
          rejection_reason: doc.rejection_reason,
          geolocation: doc.geolocation ? doc.geolocation as unknown as Geolocation : null,
          captured_at: doc.captured_at,
        } : null,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, addressType]);

  const saveAddress = async (address: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [addressType]: address })
        .eq('id', userId);

      if (error) throw error;
      setAddressData(prev => ({ ...prev, address }));
    } catch (error: any) {
      toast.error('Failed to save address');
    }
  };

  const captureGeolocation = (): Promise<Geolocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setCapturingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCurrentLocation(geo);
          setCapturingLocation(false);
          resolve(geo);
        },
        (error) => {
          setCapturingLocation(false);
          let message = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleCapturePhoto = async () => {
    try {
      // First capture location
      const geo = await captureGeolocation();
      setCurrentLocation(geo);
      
      // Then trigger file input
      fileInputRef.current?.click();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentLocation) {
      toast.error('Location is required. Please allow location access and try again.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(fileName);

      // If existing document, delete old file first
      if (addressData.document) {
        const oldFileName = addressData.document.file_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('partner-documents')
            .remove([`${userId}/${oldFileName}`]);
        }

        // Update existing record
        const { error: updateError } = await supabase
          .from('partner_documents')
          .update({
            file_url: publicUrl,
            file_name: file.name,
            verification_status: 'pending',
            rejection_reason: null,
            geolocation: JSON.parse(JSON.stringify(currentLocation)),
            captured_at: new Date().toISOString(),
          })
          .eq('id', addressData.document.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('partner_documents')
          .insert([{
            partner_id: userId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
            geolocation: JSON.parse(JSON.stringify(currentLocation)),
            captured_at: new Date().toISOString(),
          }]);

        if (insertError) throw insertError;
      }

      toast.success(`${label} photo uploaded with location`);
      setCurrentLocation(null);
      fetchData();
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!addressData.document) return;

    try {
      // Delete from storage
      const fileName = addressData.document.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('partner-documents')
          .remove([`${userId}/${fileName}`]);
      }

      // Delete record
      const { error } = await supabase
        .from('partner_documents')
        .delete()
        .eq('id', addressData.document.id);

      if (error) throw error;

      toast.success(`${label} photo deleted`);
      setAddressData(prev => ({ ...prev, document: null }));
      onUploadComplete?.();
    } catch (error: any) {
      toast.error('Failed to delete photo');
    }
  };

  const getStatusBadge = () => {
    if (!addressData.document) return null;
    
    switch (addressData.document.verification_status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Review</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Label className="font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Address Input */}
      <div>
        <Label className="text-sm">Full Address</Label>
        <Textarea
          placeholder="Enter complete address with landmarks..."
          value={addressData.address}
          onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
          onBlur={(e) => saveAddress(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      {addressData.document?.verification_status === 'rejected' && addressData.document.rejection_reason && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
          <strong>Rejection reason:</strong> {addressData.document.rejection_reason}
        </div>
      )}

      {/* Uploaded Photo Display */}
      {addressData.document ? (
        <div className="bg-muted/50 p-3 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate max-w-[200px]">{addressData.document.file_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(addressData.document!.file_url, '_blank')}
              >
                View
              </Button>
              {addressData.document.verification_status !== 'verified' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Geolocation Info */}
          {addressData.document.geolocation && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2 rounded">
              <MapPin className="h-3 w-3" />
              <span>
                Location: {addressData.document.geolocation.latitude.toFixed(6)}, {addressData.document.geolocation.longitude.toFixed(6)}
                {' '}(±{Math.round(addressData.document.geolocation.accuracy)}m accuracy)
              </span>
            </div>
          )}
          {addressData.document.captured_at && (
            <div className="text-xs text-muted-foreground">
              Captured: {new Date(addressData.document.captured_at).toLocaleString()}
            </div>
          )}
        </div>
      ) : null}

      {/* Capture Photo Button */}
      {(!addressData.document || addressData.document.verification_status === 'rejected') && (
        <div className="space-y-3">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium">Geotagged Photo Required</p>
                <p className="text-xs mt-1">
                  Take a photo of the address location. Your current location will be captured automatically for verification.
                </p>
              </div>
            </div>
          </div>

          {currentLocation && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-2 rounded">
              <Navigation className="h-4 w-4" />
              <span>
                Location captured: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleCapturePhoto}
            disabled={uploading || capturingLocation}
          >
            {capturingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capture Geotagged Photo
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
