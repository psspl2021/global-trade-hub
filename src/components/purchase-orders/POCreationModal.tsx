import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { logProcurementEvent } from '@/utils/procurementAuditLogger';
import { useERPPolicy } from '@/hooks/useERPPolicy';
import { toast } from 'sonner';
import { FileText, ExternalLink, Zap, ShieldAlert, Lock, ScrollText } from 'lucide-react';

/**
 * Default Terms & Conditions text — pre-fills the textarea so the buyer has a
 * starting point for every PO. They can edit, append, or replace before saving.
 * Kept generic and procurement-grade; specific commercial terms (payment days,
 * inco-terms, penalties) are expected to be tailored per PO.
 */
const DEFAULT_PO_TERMS = `1. Goods must be supplied as per the agreed specifications, quantity and quality.
2. All deliveries must be accompanied by a valid invoice and lorry receipt.
3. Payment will be released as per agreed payment terms after material acceptance.
4. Any short supply, damage or quality deviation must be intimated within 48 hours of delivery.
5. Statutory taxes (GST/IGST) shall be charged extra as applicable and shown separately on the invoice.
6. Vendor shall not subcontract or assign this order without prior written consent of the buyer.
7. This Purchase Order is governed by Indian law and subject to the jurisdiction of the buyer's registered office.`;

interface POCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auctionId: string;
  supplierId: string;
  supplierName: string;
  totalValue: number;
  currency?: string;
  userId: string;
  companyId?: string | null;
  onCreated: () => void;
}

export function POCreationModal({
  open, onOpenChange, auctionId, supplierId, supplierName,
  totalValue, currency = 'INR', userId, companyId, onCreated,
}: POCreationModalProps) {
  const [mode, setMode] = useState<'platform' | 'external'>('platform');
  const [externalPoNumber, setExternalPoNumber] = useState('');
  const [erpSyncEnabled, setErpSyncEnabled] = useState(true);
  const [terms, setTerms] = useState<string>(DEFAULT_PO_TERMS);
  const [saving, setSaving] = useState(false);

  const { policy, resolveErpSync } = useERPPolicy(companyId || null);

  const finalErpSync = mode === 'platform' ? resolveErpSync(erpSyncEnabled) : false;
  const policyLocked = policy === 'mandatory' || policy === 'disabled';

  const handleCreate = async () => {
    if (mode === 'external' && !externalPoNumber.trim()) {
      toast.error('Please enter your ERP PO number');
      return;
    }

    setSaving(true);
    try {
      const poNumber = mode === 'platform' ? `PO-${Date.now()}` : externalPoNumber.trim();

      const { data: po, error } = await supabase
        .from('purchase_orders' as any)
        .insert({
          auction_id: auctionId,
          supplier_id: supplierId,
          vendor_name: supplierName,
          po_number: poNumber,
          total_amount: totalValue,
          currency,
          status: 'draft',
          po_source: mode,
          external_po_number: mode === 'external' ? externalPoNumber.trim() : null,
          erp_sync_enabled: finalErpSync,
          created_by: userId,
          // Buyer-supplied Terms & Conditions printed on the PO PDF and shown
          // to the supplier in the PO viewer dialog. Stored on the PO row so
          // they remain auditable independent of any external template.
          terms_and_conditions: terms.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Audit: PO mode selected
      await logProcurementEvent({
        po_id: (po as any).id,
        auction_id: auctionId,
        action_type: 'PO_MODE_SELECTED',
        performed_by: userId,
        performed_by_role: 'buyer',
        new_value: { mode, erp_sync_enabled: finalErpSync },
      });

      // Audit: ERP policy enforced (if org policy overrode buyer choice)
      if (policyLocked) {
        await logProcurementEvent({
          po_id: (po as any).id,
          auction_id: auctionId,
          action_type: 'ERP_POLICY_ENFORCED',
          performed_by: userId,
          performed_by_role: 'buyer',
          new_value: { policy, resolved_erp_sync: finalErpSync },
        });
      }

      // Audit: PO created or external linked
      await logProcurementEvent({
        po_id: (po as any).id,
        auction_id: auctionId,
        action_type: mode === 'platform' ? 'PO_CREATED' : 'EXTERNAL_PO_LINKED',
        performed_by: userId,
        performed_by_role: 'buyer',
        new_value: { po_number: poNumber, total_value: totalValue, supplier: supplierName },
      });

      if (!finalErpSync) {
        await logProcurementEvent({
          po_id: (po as any).id,
          action_type: 'ERP_SYNC_SKIPPED',
          performed_by: userId,
          performed_by_role: 'buyer',
          new_value: { reason: mode === 'external' ? 'external_po' : policy === 'disabled' ? 'disabled_by_policy' : 'disabled_by_buyer' },
        });
      }

      toast.success(mode === 'platform' ? 'Purchase Order created' : 'External PO linked successfully');
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How do you want to proceed?</DialogTitle>
          <DialogDescription>
            Choose how to manage the Purchase Order for <strong>{supplierName}</strong>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'platform' | 'external')} className="space-y-3 my-4">
          <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mode === 'platform' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <RadioGroupItem value="platform" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Create PO in ProcureSaathi</span>
                <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Full lifecycle tracking, ERP sync, and audit trail</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mode === 'external' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <RadioGroupItem value="external" className="mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Use Existing ERP PO</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Track lifecycle using your own PO number. Supplier must confirm.</p>
            </div>
          </label>
        </RadioGroup>

        {mode === 'external' && (
          <div className="space-y-2">
            <Label htmlFor="ext-po">Enter PO Number</Label>
            <Input
              id="ext-po"
              placeholder="e.g. ERP-PO-2026-001"
              value={externalPoNumber}
              onChange={(e) => setExternalPoNumber(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Supplier must confirm this PO number before lifecycle can progress
            </p>
          </div>
        )}

        {mode === 'platform' && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="erp-toggle" className="text-sm">Enable ERP Sync</Label>
              {policyLocked && (
                <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  {policy === 'mandatory' ? 'Required by policy' : 'Disabled by policy'}
                </Badge>
              )}
            </div>
            <Switch
              id="erp-toggle"
              checked={finalErpSync}
              onCheckedChange={setErpSyncEnabled}
              disabled={policyLocked}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : mode === 'platform' ? 'Create PO' : 'Link External PO'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
