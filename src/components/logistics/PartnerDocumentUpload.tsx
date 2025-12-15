import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';

interface PartnerDocumentUploadProps {
  userId: string;
  documentType: 'aadhar_card' | 'pan_card' | 'notary_agreement';
  label: string;
  description: string;
  required?: boolean;
  onUploadComplete?: () => void;
}

interface DocumentRecord {
  id: string;
  file_url: string;
  file_name: string;
  verification_status: string;
  rejection_reason: string | null;
}

export const PartnerDocumentUpload = ({
  userId,
  documentType,
  label,
  description,
  required = false,
  onUploadComplete
}: PartnerDocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_documents')
        .select('*')
        .eq('partner_id', userId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (error) throw error;
      setDocument(data as DocumentRecord | null);
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [userId, documentType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
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
      if (document) {
        const oldFileName = document.file_url.split('/').pop();
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
          })
          .eq('id', document.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('partner_documents')
          .insert({
            partner_id: userId,
            document_type: documentType,
            file_url: publicUrl,
            file_name: file.name,
          });

        if (insertError) throw insertError;
      }

      toast.success(`${label} uploaded successfully`);
      fetchDocument();
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      // Delete from storage
      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('partner-documents')
          .remove([`${userId}/${fileName}`]);
      }

      // Delete record
      const { error } = await supabase
        .from('partner_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      toast.success(`${label} deleted`);
      setDocument(null);
      onUploadComplete?.();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = () => {
    if (!document) return null;
    
    switch (document.verification_status) {
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
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Label className="font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {getStatusBadge()}
      </div>

      {document?.verification_status === 'rejected' && document.rejection_reason && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
          <strong>Rejection reason:</strong> {document.rejection_reason}
        </div>
      )}

      {document ? (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate max-w-[200px]">{document.file_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              View
            </Button>
            {document.verification_status !== 'verified' && (
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
      ) : null}

      {(!document || document.verification_status === 'rejected') && (
        <div>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      )}
    </div>
  );
};