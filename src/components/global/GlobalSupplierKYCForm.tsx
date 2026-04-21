/**
 * GlobalSupplierKYCForm — full international KYC capture for global suppliers.
 * Includes: country-specific tax ID, bank SWIFT/IBAN, AEO cert, beneficial owner,
 * sanctions screening status, W-form type, UBO declaration, document uploads.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, FileCheck, Shield, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateTaxId } from '@/lib/taxIdValidation';
import { useAuth } from '@/hooks/useAuth';

interface GlobalSupplierKYCFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  onSuccess?: () => void;
}

const COUNTRY_CODES = [
  { code: 'IN', name: 'India' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' }, { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
];

const W_FORM_TYPES = ['W-8BEN', 'W-8BEN-E', 'W-8ECI', 'W-8IMY', 'W-9', 'Not applicable'];

const DOC_TYPES = [
  { value: 'business_registration', label: 'Business Registration Certificate' },
  { value: 'tax_certificate', label: 'Tax Registration Certificate' },
  { value: 'aeo_certificate', label: 'AEO / Authorized Exporter Cert' },
  { value: 'bank_statement', label: 'Bank Confirmation Letter' },
  { value: 'w_form', label: 'W-8 / W-9 Form' },
  { value: 'ubo_declaration', label: 'UBO Declaration' },
  { value: 'other', label: 'Other' },
];

interface KycDoc {
  id?: string;
  document_type: string;
  document_name: string;
  storage_path: string;
  verification_status: string;
}

export function GlobalSupplierKYCForm({ open, onOpenChange, supplierId, onSuccess }: GlobalSupplierKYCFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [countryCode, setCountryCode] = useState('');
  const [taxIdValue, setTaxIdValue] = useState('');
  const [businessRegNum, setBusinessRegNum] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [aeoCertified, setAeoCertified] = useState(false);
  const [aeoCertNumber, setAeoCertNumber] = useState('');
  const [boName, setBoName] = useState('');
  const [boId, setBoId] = useState('');
  const [sanctionsStatus, setSanctionsStatus] = useState('pending');
  const [sanctionsNotes, setSanctionsNotes] = useState('');
  const [wFormType, setWFormType] = useState('');
  const [uboDeclared, setUboDeclared] = useState(false);
  const [docs, setDocs] = useState<KycDoc[]>([]);

  const taxValidation = validateTaxId(countryCode, taxIdValue);

  useEffect(() => {
    if (!open || !supplierId) return;
    setLoading(true);
    (async () => {
      const { data: s } = await supabase
        .from('buyer_suppliers')
        .select('country_code, tax_id_value, business_registration_number, bank_swift, bank_iban, bank_name, aeo_certified, aeo_cert_number, beneficial_owner_name, beneficial_owner_id, sanctions_screening_status, sanctions_screening_notes, w_form_type, ubo_declared')
        .eq('id', supplierId)
        .maybeSingle();
      if (s) {
        setCountryCode(s.country_code || '');
        setTaxIdValue(s.tax_id_value || '');
        setBusinessRegNum(s.business_registration_number || '');
        setBankSwift(s.bank_swift || '');
        setBankIban(s.bank_iban || '');
        setBankName(s.bank_name || '');
        setAeoCertified(!!s.aeo_certified);
        setAeoCertNumber(s.aeo_cert_number || '');
        setBoName(s.beneficial_owner_name || '');
        setBoId(s.beneficial_owner_id || '');
        setSanctionsStatus(s.sanctions_screening_status || 'pending');
        setSanctionsNotes(s.sanctions_screening_notes || '');
        setWFormType(s.w_form_type || '');
        setUboDeclared(!!s.ubo_declared);
      }
      const { data: d } = await supabase
        .from('supplier_kyc_documents')
        .select('id, document_type, document_name, storage_path, verification_status')
        .eq('supplier_id', supplierId);
      setDocs(d || []);
      setLoading(false);
    })();
  }, [open, supplierId]);

  const handleUpload = async (file: File, docType: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const path = `${user.id}/${supplierId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, file);
      if (upErr) throw upErr;
      const { data: ins, error: insErr } = await supabase
        .from('supplier_kyc_documents')
        .insert({
          supplier_id: supplierId,
          buyer_id: user.id,
          document_type: docType,
          document_name: file.name,
          storage_path: path,
          verification_status: 'pending',
        })
        .select('id, document_type, document_name, storage_path, verification_status')
        .single();
      if (insErr) throw insErr;
      setDocs((d) => [...d, ins as KycDoc]);
      toast.success('Document uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (doc: KycDoc) => {
    if (!doc.id) return;
    await supabase.storage.from('kyc-documents').remove([doc.storage_path]);
    await supabase.from('supplier_kyc_documents').delete().eq('id', doc.id);
    setDocs((d) => d.filter((x) => x.id !== doc.id));
  };

  const handleSave = async () => {
    if (!countryCode) return toast.error('Country is required');
    if (!taxValidation.valid) return toast.error(taxValidation.error || 'Invalid tax ID');
    if (!uboDeclared) return toast.error('UBO declaration is required for global suppliers');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('buyer_suppliers')
        .update({
          is_global_supplier: true,
          country_code: countryCode,
          tax_id_type: taxValidation.label,
          tax_id_value: taxIdValue,
          business_registration_number: businessRegNum || null,
          bank_swift: bankSwift || null,
          bank_iban: bankIban || null,
          bank_name: bankName || null,
          aeo_certified: aeoCertified,
          aeo_cert_number: aeoCertified ? aeoCertNumber : null,
          beneficial_owner_name: boName || null,
          beneficial_owner_id: boId || null,
          sanctions_screening_status: sanctionsStatus,
          sanctions_screening_notes: sanctionsNotes || null,
          w_form_type: wFormType || null,
          ubo_declared: uboDeclared,
          kyc_status: docs.length >= 3 ? 'submitted' : 'incomplete',
          kyc_verified_at: null,
        } as any)
        .eq('id', supplierId);
      if (error) throw error;
      toast.success('Global KYC saved');
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Global Supplier KYC
          </DialogTitle>
          <DialogDescription>
            Full compliance pack for cross-border procurement. All fields except documents are required for activation.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Identity */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Identity & Tax</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Country *</Label>
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Business Registration #</Label>
                    <Input value={businessRegNum} onChange={(e) => setBusinessRegNum(e.target.value)} placeholder="Company reg. no." />
                  </div>
                  <div className="col-span-2">
                    <Label>{taxValidation.label} *</Label>
                    <Input
                      value={taxIdValue}
                      onChange={(e) => setTaxIdValue(e.target.value)}
                      placeholder={taxValidation.hint}
                      className={taxValidation.error ? 'border-destructive' : ''}
                    />
                    {taxValidation.error ? (
                      <p className="text-xs text-destructive mt-1">{taxValidation.error}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">{taxValidation.hint}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Banking (international wire)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  </div>
                  <div>
                    <Label>SWIFT / BIC</Label>
                    <Input value={bankSwift} onChange={(e) => setBankSwift(e.target.value.toUpperCase())} placeholder="8 or 11 chars" />
                  </div>
                  <div className="col-span-2">
                    <Label>IBAN / Account Number</Label>
                    <Input value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())} placeholder="IBAN or local account #" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Compliance</h3>
                <div className="flex items-center gap-2">
                  <Checkbox checked={aeoCertified} onCheckedChange={(v) => setAeoCertified(!!v)} id="aeo" />
                  <Label htmlFor="aeo" className="cursor-pointer">AEO / Authorized Exporter</Label>
                </div>
                {aeoCertified && (
                  <Input value={aeoCertNumber} onChange={(e) => setAeoCertNumber(e.target.value)} placeholder="Certification number" />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Beneficial Owner Name</Label>
                    <Input value={boName} onChange={(e) => setBoName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Beneficial Owner ID</Label>
                    <Input value={boId} onChange={(e) => setBoId(e.target.value)} placeholder="Passport / national ID" />
                  </div>
                  <div>
                    <Label>W-Form (US tax)</Label>
                    <Select value={wFormType} onValueChange={setWFormType}>
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        {W_FORM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sanctions Screening</Label>
                    <Select value={sanctionsStatus} onValueChange={setSanctionsStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cleared">Cleared (OFAC/UN)</SelectItem>
                        <SelectItem value="flagged">Flagged for review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {sanctionsStatus === 'flagged' && (
                    <div className="col-span-2">
                      <Label>Screening Notes</Label>
                      <Textarea value={sanctionsNotes} onChange={(e) => setSanctionsNotes(e.target.value)} rows={2} />
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <Checkbox checked={uboDeclared} onCheckedChange={(v) => setUboDeclared(!!v)} id="ubo" />
                    <Label htmlFor="ubo" className="cursor-pointer ml-2 text-sm">
                      I declare the Ultimate Beneficial Owner (UBO) information is accurate per AML regulations *
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Documents</h3>
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <span>{d.document_name}</span>
                        <Badge variant="outline" className="text-xs">{d.document_type}</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeDoc(d)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {DOC_TYPES.map((dt) => (
                    <label key={dt.value} className="flex items-center gap-2 p-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 text-xs">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{dt.label}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], dt.value)}
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save KYC
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
