import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  po: { id: string; po_number: string; po_value: number };
  onClose: () => void;
  onSuccess: () => void;
}

const MIN_REASON = 10;

export function OverridePOModal({ po, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (reason.trim().length < MIN_REASON) {
      toast.error(`Reason must be at least ${MIN_REASON} characters`);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc('ceo_override_approve_po' as any, {
      p_po_id: po.id,
      p_reason: reason.trim(),
    } as any);
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (result?.success) {
      toast.success('PO override approved. Manager will be notified.');
      onSuccess();
    } else {
      toast.error(result?.message ?? result?.error ?? 'Override failed');
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Override & Approve {po.po_number}
          </DialogTitle>
          <DialogDescription>
            This bypasses the manager approval step. Your action is permanently logged in the
            governance audit trail and the manager will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for override (required)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Critical production downtime — supplier needs immediate confirmation"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {reason.trim().length}/{MIN_REASON} min · {reason.length}/500
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || reason.trim().length < MIN_REASON}>
            {submitting ? 'Overriding…' : 'Confirm Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
