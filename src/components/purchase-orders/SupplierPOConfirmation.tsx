import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { logProcurementEvent } from '@/utils/procurementAuditLogger';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface SupplierPOConfirmationProps {
  poId: string;
  externalPoNumber: string;
  supplierId: string;
  isConfirmed: boolean;
  onConfirmed: () => void;
}

export function SupplierPOConfirmation({
  poId, externalPoNumber, supplierId, isConfirmed, onConfirmed,
}: SupplierPOConfirmationProps) {
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (inputValue.trim() !== externalPoNumber) {
      toast.error('PO number does not match. Please enter the exact PO number shared by the buyer.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('supplier_po_acknowledgements' as any)
        .insert({
          po_id: poId,
          supplier_id: supplierId,
          confirmed_po_number: inputValue.trim(),
        });

      if (error) throw error;

      await logProcurementEvent({
        po_id: poId,
        action_type: 'SUPPLIER_PO_CONFIRMED',
        performed_by: supplierId,
        performed_by_role: 'supplier',
        new_value: { confirmed_po_number: inputValue.trim() },
      });

      toast.success('PO number confirmed successfully');
      onConfirmed();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm PO number');
    } finally {
      setSaving(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700 font-medium">PO number confirmed by supplier</span>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Confirm External PO Number
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          The buyer has linked external PO <Badge variant="secondary" className="text-[10px]">{externalPoNumber}</Badge>.
          Please confirm by entering the same PO number below.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Enter PO number to confirm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" onClick={handleConfirm} disabled={saving || !inputValue.trim()}>
            {saving ? 'Confirming...' : 'Confirm'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
