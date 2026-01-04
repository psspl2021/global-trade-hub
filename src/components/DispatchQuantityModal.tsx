import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DispatchQuantityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string;
  requirementId: string;
  requirementTitle: string;
  totalQuantity: number;
  unit: string;
  currentDispatchedQty?: number | null;
  onSuccess: () => void;
}

export function DispatchQuantityModal({
  open,
  onOpenChange,
  bidId,
  requirementId,
  requirementTitle,
  totalQuantity,
  unit,
  currentDispatchedQty,
  onSuccess,
}: DispatchQuantityModalProps) {
  const [dispatchQty, setDispatchQty] = useState<string>(
    currentDispatchedQty?.toString() || totalQuantity.toString()
  );
  const [saving, setSaving] = useState(false);
  const [markAsClosed, setMarkAsClosed] = useState(false);

  const handleSave = async () => {
    const qty = parseFloat(dispatchQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid dispatch quantity');
      return;
    }

    // Allow dispatch qty to exceed total quantity (for extra shipments, replacements, etc.)
    setSaving(true);
    try {
      // Update dispatch quantity on bid
      const { error: bidError } = await supabase
        .from('bids')
        .update({ dispatched_qty: qty })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Update referral commission if exists for this bid
      // Commission = platform_fee_per_ton × dispatched_qty × referral_share_percentage
      const { data: commissionData } = await supabase
        .from('referral_commissions')
        .select('id, platform_fee_amount, referral_share_percentage')
        .eq('bid_id', bidId)
        .maybeSingle();

      if (commissionData) {
        const platformFeePerTon = commissionData.platform_fee_amount || 220;
        const referralSharePercentage = commissionData.referral_share_percentage || 20;
        const totalPlatformFee = platformFeePerTon * qty;
        const calculatedCommission = totalPlatformFee * (referralSharePercentage / 100);
        const platformNetRevenue = totalPlatformFee - calculatedCommission;

        const { error: commissionError } = await supabase
          .from('referral_commissions')
          .update({
            commission_amount: calculatedCommission,
            platform_net_revenue: platformNetRevenue,
            dispatched_qty: qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', commissionData.id);

        if (commissionError) {
          console.error('Error updating referral commission:', commissionError);
        }
      }

      // If marking as closed, update requirement status
      if (markAsClosed) {
        const { error: reqError } = await supabase
          .from('requirements')
          .update({ status: 'closed' })
          .eq('id', requirementId);

        if (reqError) throw reqError;
      }

      toast.success(
        markAsClosed 
          ? 'Dispatch recorded and requirement closed successfully!' 
          : 'Dispatch quantity updated successfully!'
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating dispatch:', error);
      toast.error('Failed to update dispatch quantity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Record Dispatch
          </DialogTitle>
          <DialogDescription>
            Enter the dispatched quantity for: {requirementTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="dispatch-qty">Dispatched Quantity</Label>
            <div className="flex items-center gap-2">
              <Input
                id="dispatch-qty"
                type="number"
                value={dispatchQty}
                onChange={(e) => setDispatchQty(e.target.value)}
                min={0}
                max={totalQuantity}
                step="0.01"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                / {totalQuantity} {unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total ordered quantity: {totalQuantity.toLocaleString('en-IN')} {unit}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mark-closed"
              checked={markAsClosed}
              onChange={(e) => setMarkAsClosed(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="mark-closed" className="text-sm cursor-pointer">
              Mark requirement as closed after dispatch
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Dispatch'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
