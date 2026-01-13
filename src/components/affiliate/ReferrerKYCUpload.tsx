import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye, Trash2, AlertTriangle, Building2, Loader2 } from 'lucide-react';

interface KYCDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  verification_status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface BankDetails {
  bank_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_account_holder: string;
}

interface ReferrerKYCUploadProps {
  userId: string;
}

const DOCUMENT_TYPES = [
  { type: 'aadhar_card', label: 'Aadhar Card', description: 'Upload front side of your Aadhar card' },
  { type: 'pan_card', label: 'PAN Card', description: 'Upload clear image of your PAN card' },
  { type: 'cancel_cheque', label: 'Cancelled Cheque', description: 'Upload cancelled cheque for bank verification' },
];

export const ReferrerKYCUpload = ({ userId }: ReferrerKYCUploadProps) => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder: '',
  });
  const [savingBank, setSavingBank] = useState(false);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('referrer_kyc_documents')
      .select('*')
      .eq('referrer_id', userId);

    if (!error && data) {
      setDocuments(data);
    }
  };

  const fetchBankDetails = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('bank_name, bank_account_number, bank_ifsc_code, bank_account_holder')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setBankDetails({
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc_code: data.bank_ifsc_code || '',
        bank_account_holder: data.bank_account_holder || '',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchBankDetails()]);
      setLoading(false);
    };
    init();
  }, [userId]);

  const handleUpload = async (documentType: string, file: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WebP, or PDF files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(documentType);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('referrer-kyc')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('referrer-kyc')
        .getPublicUrl(fileName);

      // Check if document exists
      const existing = documents.find(d => d.document_type === documentType);

      if (existing) {
        // Delete old file
        const oldPath = existing.file_url.split('/referrer-kyc/')[1];
        if (oldPath) {
          await supabase.storage.from('referrer-kyc').remove([oldPath]);
        }

        // Update record
        const { error: updateError } = await supabase
          .from('referrer_kyc_documents')
          .update({
            file_name: file.name,
            file_url: publicUrl,
            verification_status: 'pending',
            rejection_reason: null,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('referrer_kyc_documents')
          .insert({
            referrer_id: userId,
            document_type: documentType,
            file_name: file.name,
            file_url: publicUrl,
          });

        if (insertError) throw insertError;
      }

      toast.success('Document uploaded successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (doc: KYCDocument) => {
    if (doc.verification_status === 'verified') {
      toast.error('Cannot delete verified documents');
      return;
    }

    try {
      const filePath = doc.file_url.split('/referrer-kyc/')[1];
      if (filePath) {
        await supabase.storage.from('referrer-kyc').remove([filePath]);
      }

      await supabase.from('referrer_kyc_documents').delete().eq('id', doc.id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankDetails.bank_name.trim() || !bankDetails.bank_account_number.trim() || 
        !bankDetails.bank_ifsc_code.trim() || !bankDetails.bank_account_holder.trim()) {
      toast.error('Please fill in all bank details');
      return;
    }

    // Validate IFSC code format (11 characters)
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.bank_ifsc_code.toUpperCase())) {
      toast.error('Please enter a valid IFSC code (e.g., SBIN0001234)');
      return;
    }

    setSavingBank(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankDetails.bank_name.trim(),
          bank_account_number: bankDetails.bank_account_number.trim(),
          bank_ifsc_code: bankDetails.bank_ifsc_code.toUpperCase().trim(),
          bank_account_holder: bankDetails.bank_account_holder.trim(),
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Bank details saved successfully');
    } catch (error: any) {
      toast.error('Failed to save bank details');
    } finally {
      setSavingBank(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const allVerified = DOCUMENT_TYPES.every(dt => 
    documents.find(d => d.document_type === dt.type && d.verification_status === 'verified')
  );

  const hasBankDetails = bankDetails.bank_name && bankDetails.bank_account_number && 
                          bankDetails.bank_ifsc_code && bankDetails.bank_account_holder;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KYC Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Documents
          </CardTitle>
          <CardDescription>
            Upload your ID proof documents to verify your identity
          </CardDescription>
          {!allVerified && (
            <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
              <AlertTriangle className="h-4 w-4" />
              Complete KYC verification to receive commission payouts
            </div>
          )}
          {allVerified && (
            <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
              <CheckCircle className="h-4 w-4" />
              KYC Verified - You can receive commission payouts
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const doc = documents.find(d => d.document_type === docType.type);

            return (
              <div key={docType.type} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Label className="text-base font-medium">{docType.label}</Label>
                    <p className="text-sm text-muted-foreground">{docType.description}</p>
                  </div>
                  {doc && getStatusBadge(doc.verification_status)}
                </div>

                {doc?.verification_status === 'rejected' && doc.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3 text-sm text-red-700">
                    <strong>Rejection Reason:</strong> {doc.rejection_reason}
                  </div>
                )}

                {doc ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {doc.file_name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {doc.verification_status !== 'verified' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                        <Label htmlFor={`reupload-${docType.type}`} className="cursor-pointer">
                          <Button variant="secondary" size="sm" asChild>
                            <span>
                              <Upload className="h-3 w-3 mr-1" />
                              Re-upload
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id={`reupload-${docType.type}`}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(docType.type, file);
                          }}
                          disabled={uploading === docType.type}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={`upload-${docType.type}`} className="cursor-pointer">
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                        {uploading === docType.type ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </div>
                    </Label>
                    <Input
                      id={`upload-${docType.type}`}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(docType.type, file);
                      }}
                      disabled={uploading === docType.type}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bank Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Details
          </CardTitle>
          <CardDescription>
            Enter your bank account details for commission payouts
          </CardDescription>
          {hasBankDetails && (
            <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
              <CheckCircle className="h-4 w-4" />
              Bank details saved
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_account_holder">Account Holder Name</Label>
              <Input
                id="bank_account_holder"
                placeholder="As per bank records"
                value={bankDetails.bank_account_holder}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                placeholder="e.g., State Bank of India"
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account Number</Label>
              <Input
                id="bank_account_number"
                placeholder="Enter account number"
                value={bankDetails.bank_account_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account_number: e.target.value.replace(/\D/g, '') }))}
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
              <Input
                id="bank_ifsc_code"
                placeholder="e.g., SBIN0001234"
                value={bankDetails.bank_ifsc_code}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_ifsc_code: e.target.value.toUpperCase() }))}
                maxLength={11}
              />
            </div>
          </div>
          <Button onClick={handleSaveBankDetails} disabled={savingBank}>
            {savingBank ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Bank Details'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};