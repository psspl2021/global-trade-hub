import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Warehouse, ArrowRight, FileText, AlertCircle, MapPin } from 'lucide-react';
import { VehicleForm } from './VehicleForm';
import { WarehouseForm } from './WarehouseForm';
import { PartnerDocumentUpload } from './PartnerDocumentUpload';
import { GeotaggedAddressUpload } from './GeotaggedAddressUpload';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LogisticsOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
}

export const LogisticsOnboarding = ({ open, onOpenChange, userId, onComplete }: LogisticsOnboardingProps) => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'warehouse' | 'documents' | 'addresses'>('documents');
  const [vehicleAdded, setVehicleAdded] = useState(false);
  const [warehouseAdded, setWarehouseAdded] = useState(false);
  const [partnerType, setPartnerType] = useState<'agent' | 'fleet_owner' | null>(null);
  const [documentsUploaded, setDocumentsUploaded] = useState({
    aadhar_card: false,
    pan_card: false,
    notary_agreement: false,
    house_address_photo: false,
    office_address_photo: false,
  });

  useEffect(() => {
    if (open) {
      fetchPartnerType();
      checkUploadedDocuments();
    }
  }, [open, userId]);

  const fetchPartnerType = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('logistics_partner_type')
      .eq('id', userId)
      .maybeSingle();
    
    if (data?.logistics_partner_type) {
      setPartnerType(data.logistics_partner_type as 'agent' | 'fleet_owner');
    }
  };

  const checkUploadedDocuments = async () => {
    const { data } = await supabase
      .from('partner_documents')
      .select('document_type')
      .eq('partner_id', userId);

    if (data) {
      const uploaded = {
        aadhar_card: data.some(d => d.document_type === 'aadhar_card'),
        pan_card: data.some(d => d.document_type === 'pan_card'),
        notary_agreement: data.some(d => d.document_type === 'notary_agreement'),
        house_address_photo: data.some(d => d.document_type === 'house_address_photo'),
        office_address_photo: data.some(d => d.document_type === 'office_address_photo'),
      };
      setDocumentsUploaded(uploaded);
    }
  };

  const handleVehicleSuccess = () => {
    setVehicleAdded(true);
  };

  const handleWarehouseSuccess = () => {
    setWarehouseAdded(true);
  };

  const handleContinue = () => {
    onComplete();
    onOpenChange(false);
  };

  const requiredDocsComplete = () => {
    // Both agent and fleet owner need Aadhar, PAN, Notary agreement, and both address photos
    return documentsUploaded.aadhar_card && 
           documentsUploaded.pan_card && 
           documentsUploaded.notary_agreement &&
           documentsUploaded.house_address_photo &&
           documentsUploaded.office_address_photo;
  };

  const addressDocsComplete = () => {
    return documentsUploaded.house_address_photo && documentsUploaded.office_address_photo;
  };

  // For agents: vehicle and warehouse are optional, only documents required
  // For fleet owners: need at least one vehicle or warehouse plus documents
  const canContinue = partnerType === 'agent' 
    ? requiredDocsComplete() 
    : (vehicleAdded || warehouseAdded) && requiredDocsComplete();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            {partnerType === 'agent' 
              ? 'Upload verification documents to start receiving requests. Vehicle and warehouse are optional.'
              : 'Upload verification documents and add at least one vehicle or warehouse to start receiving requests'}
          </DialogDescription>
        </DialogHeader>

        {partnerType && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are registering as a <strong className="capitalize">{partnerType.replace('_', ' ')}</strong>. 
              {partnerType === 'fleet_owner' 
                ? ' Please upload RC document with each vehicle, plus Aadhar, PAN, and Notary Agreement.'
                : ' Please upload Aadhar, PAN, and Notary Agreement for verification.'}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
              {(documentsUploaded.aadhar_card && documentsUploaded.pan_card && documentsUploaded.notary_agreement) && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
              {addressDocsComplete() && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Vehicle
              {vehicleAdded && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Warehouse
              {warehouseAdded && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Verification Documents</h4>
              <p className="text-sm text-muted-foreground">
                Upload required documents for verification. All documents are mandatory.
              </p>
            </div>
            <div className="space-y-4">
              <PartnerDocumentUpload
                userId={userId}
                documentType="aadhar_card"
                label="Aadhar Card"
                description="Upload a clear copy of your Aadhar card (front and back)"
                required
                onUploadComplete={checkUploadedDocuments}
              />
              <PartnerDocumentUpload
                userId={userId}
                documentType="pan_card"
                label="PAN Card"
                description="Upload a clear copy of your PAN card"
                required
                onUploadComplete={checkUploadedDocuments}
              />
              <PartnerDocumentUpload
                userId={userId}
                documentType="notary_agreement"
                label="Notary Agreement"
                description="Signed legal agreement between you and ProcureSaathi for material loads"
                required
                onUploadComplete={checkUploadedDocuments}
              />
            </div>
          </TabsContent>

          <TabsContent value="addresses" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Address Verification</h4>
              <p className="text-sm text-muted-foreground">
                Enter your addresses and upload geotagged photos for verification. Location will be captured automatically.
              </p>
            </div>
            <div className="space-y-4">
              <GeotaggedAddressUpload
                userId={userId}
                addressType="house_address"
                label="House Address"
                description="Enter your residential address and upload a geotagged photo of the location"
                required
                onUploadComplete={checkUploadedDocuments}
              />
              <GeotaggedAddressUpload
                userId={userId}
                addressType="office_address"
                label="Office Address"
                description="Enter your business/office address and upload a geotagged photo of the location"
                required
                onUploadComplete={checkUploadedDocuments}
              />
            </div>
          </TabsContent>

          <TabsContent value="vehicle" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Register Your Vehicles</h4>
              <p className="text-sm text-muted-foreground">
                Add trucks, trailers, or other vehicles you operate for freight transport.
                {partnerType === 'fleet_owner' && ' RC document is required for each vehicle.'}
              </p>
            </div>
            <VehicleForm
              userId={userId}
              onSuccess={handleVehicleSuccess}
            />
          </TabsContent>

          <TabsContent value="warehouse" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Register Your Warehouse</h4>
              <p className="text-sm text-muted-foreground">
                Add warehouses or storage spaces available for rent
              </p>
            </div>
            <WarehouseForm
              userId={userId}
              onSuccess={handleWarehouseSuccess}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {canContinue 
              ? partnerType === 'agent' 
                ? 'You can add vehicles or warehouses later from your dashboard'
                : 'You can add more assets later from your dashboard'
              : !requiredDocsComplete()
              ? 'Please upload all required verification documents'
              : 'Add at least one vehicle or warehouse to continue'
            }
          </p>
          <Button 
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
