import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationStatus {
  isFullyVerified: boolean;
  pendingDocuments: string[];
  rejectedDocuments: { type: string; reason: string | null }[];
  verifiedDocuments: string[];
  loading: boolean;
}

const REQUIRED_DOCUMENTS = ['aadhar_card', 'pan_card', 'notary_agreement', 'house_address_photo', 'office_address_photo'];

const documentLabels: Record<string, string> = {
  aadhar_card: 'Aadhar Card',
  pan_card: 'PAN Card',
  notary_agreement: 'Notary Agreement',
  house_address_photo: 'House Address Photo',
  office_address_photo: 'Office Address Photo',
};

export const usePartnerVerification = (userId: string | undefined) => {
  const [status, setStatus] = useState<VerificationStatus>({
    isFullyVerified: false,
    pendingDocuments: [],
    rejectedDocuments: [],
    verifiedDocuments: [],
    loading: true,
  });

  const fetchVerificationStatus = async () => {
    if (!userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: documents, error } = await supabase
        .from('partner_documents')
        .select('document_type, verification_status, rejection_reason')
        .eq('partner_id', userId);

      if (error) throw error;

      const verifiedDocs: string[] = [];
      const pendingDocs: string[] = [];
      const rejectedDocs: { type: string; reason: string | null }[] = [];

      // Check each required document
      for (const docType of REQUIRED_DOCUMENTS) {
        const doc = documents?.find(d => d.document_type === docType);
        
        if (!doc) {
          pendingDocs.push(documentLabels[docType] || docType);
        } else if (doc.verification_status === 'verified') {
          verifiedDocs.push(documentLabels[docType] || docType);
        } else if (doc.verification_status === 'rejected') {
          rejectedDocs.push({ 
            type: documentLabels[docType] || docType, 
            reason: doc.rejection_reason 
          });
        } else {
          pendingDocs.push(documentLabels[docType] || docType);
        }
      }

      const isFullyVerified = verifiedDocs.length === REQUIRED_DOCUMENTS.length;

      setStatus({
        isFullyVerified,
        pendingDocuments: pendingDocs,
        rejectedDocuments: rejectedDocs,
        verifiedDocuments: verifiedDocs,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, [userId]);

  return { ...status, refetch: fetchVerificationStatus };
};
