import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, Search, FileText } from 'lucide-react';

interface KYCDocument {
  id: string;
  referrer_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  verification_status: string;
  rejection_reason: string | null;
  created_at: string;
  profiles?: { company_name: string; contact_person: string; email: string; phone: string };
}

interface ReferrerKYCVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

const DOC_LABELS: Record<string, string> = {
  pan_card: 'PAN Card',
  aadhar_card: 'Aadhar Card',
  bank_details: 'Bank Details',
};

export const ReferrerKYCVerification = ({ open, onOpenChange, adminId }: ReferrerKYCVerificationProps) => {
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});

  const fetchDocuments = async () => {
    setLoading(true);
    
    let query = supabase
      .from('referrer_kyc_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('verification_status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch profile info separately for each unique referrer
      const referrerIds = [...new Set(data.map(d => d.referrer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone')
        .in('id', referrerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const docsWithProfiles = data.map(doc => ({
        ...doc,
        profiles: profileMap.get(doc.referrer_id) || undefined,
      }));

      setDocuments(docsWithProfiles as KYCDocument[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open, filter]);

  const handleVerify = async (docId: string) => {
    const { error } = await supabase
      .from('referrer_kyc_documents')
      .update({
        verification_status: 'verified',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', docId);

    if (error) {
      toast.error('Failed to verify document');
    } else {
      toast.success('Document verified');
      fetchDocuments();
    }
  };

  const handleReject = async (docId: string) => {
    const reason = rejectionReason[docId];
    if (!reason?.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const { error } = await supabase
      .from('referrer_kyc_documents')
      .update({
        verification_status: 'rejected',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', docId);

    if (error) {
      toast.error('Failed to reject document');
    } else {
      toast.success('Document rejected');
      setRejectionReason(prev => ({ ...prev, [docId]: '' }));
      fetchDocuments();
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

  const filteredDocs = documents.filter(doc => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      doc.profiles?.company_name?.toLowerCase().includes(searchLower) ||
      doc.profiles?.contact_person?.toLowerCase().includes(searchLower) ||
      doc.profiles?.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Referrer KYC Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No documents found</div>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{DOC_LABELS[doc.document_type]}</span>
                          {getStatusBadge(doc.verification_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.profiles?.company_name || doc.profiles?.contact_person} • {doc.profiles?.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          File: {doc.file_name} • Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, '_blank')}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>

                    {doc.verification_status === 'pending' && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(doc.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verify
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(doc.id)}>
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Rejection reason (required for rejection)"
                          value={rejectionReason[doc.id] || ''}
                          onChange={(e) => setRejectionReason(prev => ({ ...prev, [doc.id]: e.target.value }))}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    )}

                    {doc.verification_status === 'rejected' && doc.rejection_reason && (
                      <div className="mt-2 text-sm text-red-600">
                        <strong>Reason:</strong> {doc.rejection_reason}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};