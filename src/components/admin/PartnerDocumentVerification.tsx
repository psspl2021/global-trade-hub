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
  Loader2, FileText, CheckCircle, XCircle, 
  User, Building2, CreditCard, FileCheck, MapPin
} from 'lucide-react';

interface PartnerDocumentVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

interface PendingDocument {
  id: string;
  partner_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  verification_status: string;
  uploaded_at: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  captured_at?: string | null;
  partner_profile?: {
    company_name: string;
    contact_person: string;
    phone: string;
    logistics_partner_type: string | null;
    house_address?: string | null;
    office_address?: string | null;
  };
}

const documentTypeLabels: Record<string, { label: string; icon: any }> = {
  aadhar_card: { label: 'Aadhar Card', icon: User },
  pan_card: { label: 'PAN Card', icon: CreditCard },
  notary_agreement: { label: 'Notary Agreement', icon: FileCheck },
  house_address_photo: { label: 'House Address', icon: Building2 },
  office_address_photo: { label: 'Office Address', icon: Building2 },
};

export const PartnerDocumentVerification = ({ open, onOpenChange, adminId }: PartnerDocumentVerificationProps) => {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPendingDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('verification_status', 'pending')
        .order('uploaded_at', { ascending: true });

      if (error) throw error;

      // Fetch partner profiles
      const docsWithProfiles = await Promise.all(
        (data || []).map(async (doc: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, contact_person, phone, logistics_partner_type, house_address, office_address')
            .eq('id', doc.partner_id)
            .maybeSingle();
          
          return {
            ...doc,
            geolocation: doc.geolocation as PendingDocument['geolocation'],
            partner_profile: profile,
          };
        })
      );

      setDocuments(docsWithProfiles);
    } catch (error: any) {
      toast.error('Failed to load pending documents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPendingDocuments();
    }
  }, [open]);

  const approveDocument = async (docId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_documents')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', docId);

      if (error) throw error;

      toast.success('Document approved');
      setDocuments(documents.filter(d => d.id !== docId));
      setSelectedDoc(null);
    } catch (error: any) {
      toast.error('Failed to approve document');
    } finally {
      setProcessing(false);
    }
  };

  const rejectDocument = async (docId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_documents')
        .update({
          verification_status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', docId);

      if (error) throw error;

      toast.success('Document rejected');
      setDocuments(documents.filter(d => d.id !== docId));
      setSelectedDoc(null);
      setRejecting(false);
      setRejectionReason('');
    } catch (error: any) {
      toast.error('Failed to reject document');
    } finally {
      setProcessing(false);
    }
  };

  const getDocIcon = (docType: string) => {
    const Icon = documentTypeLabels[docType]?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Partner Document Verification
            {documents.length > 0 && (
              <Badge variant="secondary">{documents.length} pending</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-muted-foreground">No documents pending verification</p>
          </div>
        ) : selectedDoc ? (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setSelectedDoc(null); setRejecting(false); }}
            >
              ← Back to list
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 flex items-center gap-1 w-fit">
                      {getDocIcon(selectedDoc.document_type)}
                      {documentTypeLabels[selectedDoc.document_type]?.label || selectedDoc.document_type}
                    </Badge>
                    <CardTitle className="text-xl">
                      {selectedDoc.file_name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Partner Info */}
                {selectedDoc.partner_profile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Partner Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Company:</span>{' '}
                        {selectedDoc.partner_profile.company_name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span>{' '}
                        {selectedDoc.partner_profile.contact_person}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{' '}
                        {selectedDoc.partner_profile.phone}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        <Badge variant="outline" className="capitalize">
                          {selectedDoc.partner_profile.logistics_partner_type?.replace('_', ' ') || 'Not set'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Preview */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Document Preview
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedDoc.file_url.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={selectedDoc.file_url}
                        className="w-full h-[400px]"
                        title="Document"
                      />
                    ) : (
                      <img
                        src={selectedDoc.file_url}
                        alt="Document"
                        className="w-full max-h-[400px] object-contain bg-muted"
                      />
                    )}
                  </div>
                  
                  {/* Geolocation Info for Address Documents */}
                  {selectedDoc.geolocation && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h5 className="font-medium text-sm flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Geolocation Data
                      </h5>
                      <div className="text-sm space-y-1">
                        <p>Latitude: {selectedDoc.geolocation.latitude.toFixed(6)}</p>
                        <p>Longitude: {selectedDoc.geolocation.longitude.toFixed(6)}</p>
                        <p>Accuracy: ±{Math.round(selectedDoc.geolocation.accuracy)}m</p>
                        {selectedDoc.captured_at && (
                          <p className="text-muted-foreground">Captured: {new Date(selectedDoc.captured_at).toLocaleString()}</p>
                        )}
                        <a 
                          href={`https://www.google.com/maps?q=${selectedDoc.geolocation.latitude},${selectedDoc.geolocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View on Google Maps →
                        </a>
                      </div>
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
                        onClick={() => rejectDocument(selectedDoc.id)}
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
                      onClick={() => approveDocument(selectedDoc.id)}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card 
                key={doc.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedDoc(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getDocIcon(doc.document_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {documentTypeLabels[doc.document_type]?.label || doc.document_type}
                          </Badge>
                          <span className="font-medium truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.partner_profile?.company_name || 'Unknown Partner'}
                          {doc.partner_profile?.logistics_partner_type && (
                            <span className="ml-2 capitalize">
                              ({doc.partner_profile.logistics_partner_type.replace('_', ' ')})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
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