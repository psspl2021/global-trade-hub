import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Truck, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  dispatched_qty: number;
  bid_item_id?: string;
}

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
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [dispatchQtys, setDispatchQtys] = useState<Record<string, string>>({});
  const [singleDispatchQty, setSingleDispatchQty] = useState<string>(
    currentDispatchedQty?.toString() || totalQuantity.toString()
  );
  const [saving, setSaving] = useState(false);
  const [markAsClosed, setMarkAsClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMultipleItems, setHasMultipleItems] = useState(false);

  // Fetch line items when modal opens
  useEffect(() => {
    if (open && bidId) {
      fetchLineItems();
    }
  }, [open, bidId]);

  const fetchLineItems = async () => {
    setLoading(true);
    try {
      // Get bid_items joined with requirement_items
      const { data: bidItems, error: bidError } = await supabase
        .from('bid_items')
        .select(`
          id,
          unit_price,
          quantity,
          total,
          dispatched_qty,
          requirement_item_id,
          requirement_items (
            id,
            item_name,
            quantity,
            unit
          )
        `)
        .eq('bid_id', bidId);

      if (bidError) throw bidError;

      if (bidItems && bidItems.length > 0) {
        // Multiple line items
        const items: LineItem[] = bidItems.map((bi: any) => ({
          id: bi.requirement_items?.id || bi.requirement_item_id,
          item_name: bi.requirement_items?.item_name || 'Unknown Item',
          quantity: bi.quantity,
          unit: bi.requirement_items?.unit || unit,
          unit_price: bi.unit_price,
          total: bi.total,
          dispatched_qty: bi.dispatched_qty || 0,
          bid_item_id: bi.id,
        }));

        setLineItems(items);
        setHasMultipleItems(items.length > 1);

        // Initialize dispatch quantities
        const initialQtys: Record<string, string> = {};
        items.forEach(item => {
          initialQtys[item.bid_item_id || item.id] = item.dispatched_qty?.toString() || item.quantity.toString();
        });
        setDispatchQtys(initialQtys);
      } else {
        // Single item (legacy behavior)
        setHasMultipleItems(false);
        setSingleDispatchQty(currentDispatchedQty?.toString() || totalQuantity.toString());
      }
    } catch (error: any) {
      console.error('Error fetching line items:', error);
      // Fallback to single item mode
      setHasMultipleItems(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchQtyChange = (itemId: string, value: string) => {
    setDispatchQtys(prev => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (hasMultipleItems && lineItems.length > 0) {
        // Update each bid_item's dispatched_qty
        let totalDispatchedQty = 0;
        
        for (const item of lineItems) {
          const qty = parseFloat(dispatchQtys[item.bid_item_id || item.id] || '0');
          if (isNaN(qty) || qty < 0) {
            toast.error(`Please enter a valid quantity for ${item.item_name}`);
            setSaving(false);
            return;
          }
          totalDispatchedQty += qty;

          if (item.bid_item_id) {
            const { error } = await supabase
              .from('bid_items')
              .update({ dispatched_qty: qty })
              .eq('id', item.bid_item_id);
            
            if (error) throw error;
          }
        }

        // Update total dispatched_qty on bid (sum of all items)
        const { error: bidError } = await supabase
          .from('bids')
          .update({ dispatched_qty: totalDispatchedQty })
          .eq('id', bidId);

        if (bidError) throw bidError;

        // Update referral commission based on total dispatched
        await updateReferralCommission(totalDispatchedQty);
      } else {
        // Single item mode (legacy)
        const qty = parseFloat(singleDispatchQty);
        if (isNaN(qty) || qty <= 0) {
          toast.error('Please enter a valid dispatch quantity');
          setSaving(false);
          return;
        }

        const { error: bidError } = await supabase
          .from('bids')
          .update({ dispatched_qty: qty })
          .eq('id', bidId);

        if (bidError) throw bidError;

        await updateReferralCommission(qty);
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

  const updateReferralCommission = async (totalQty: number) => {
    const { data: commissionData } = await supabase
      .from('referral_commissions')
      .select('id, platform_fee_amount, referral_share_percentage')
      .eq('bid_id', bidId)
      .maybeSingle();

    if (commissionData) {
      const platformFeePerTon = commissionData.platform_fee_amount || 220;
      const referralSharePercentage = commissionData.referral_share_percentage || 20;
      const totalPlatformFee = platformFeePerTon * totalQty;
      const calculatedCommission = totalPlatformFee * (referralSharePercentage / 100);
      const platformNetRevenue = totalPlatformFee - calculatedCommission;

      const { error: commissionError } = await supabase
        .from('referral_commissions')
        .update({
          commission_amount: calculatedCommission,
          platform_net_revenue: platformNetRevenue,
          dispatched_qty: totalQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commissionData.id);

      if (commissionError) {
        console.error('Error updating referral commission:', commissionError);
      }
    }
  };

  const calculateTotalDispatchValue = () => {
    if (!hasMultipleItems) return 0;
    return lineItems.reduce((total, item) => {
      const qty = parseFloat(dispatchQtys[item.bid_item_id || item.id] || '0');
      return total + (qty * item.unit_price);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hasMultipleItems ? "sm:max-w-2xl max-h-[80vh] overflow-y-auto" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Record Dispatch
          </DialogTitle>
          <DialogDescription>
            Enter the dispatched quantity for: {requirementTitle}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {hasMultipleItems && lineItems.length > 0 ? (
              <>
                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={item.bid_item_id || item.id} className="p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{item.item_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Rate: ₹{item.unit_price.toLocaleString('en-IN')}/{item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`dispatch-${index}`} className="text-xs text-muted-foreground">
                            Dispatched Qty
                          </Label>
                          <Input
                            id={`dispatch-${index}`}
                            type="number"
                            value={dispatchQtys[item.bid_item_id || item.id] || ''}
                            onChange={(e) => handleDispatchQtyChange(item.bid_item_id || item.id, e.target.value)}
                            min={0}
                            step="0.01"
                            className="mt-1"
                          />
                        </div>
                        <div className="text-right pt-5">
                          <span className="text-sm text-muted-foreground">
                            / {item.quantity.toLocaleString('en-IN')} {item.unit}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-right text-sm">
                        <span className="text-muted-foreground">Value: </span>
                        <span className="font-medium">
                          ₹{((parseFloat(dispatchQtys[item.bid_item_id || item.id] || '0') * item.unit_price) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Dispatch Value:</span>
                    <span className="text-lg font-bold text-primary">
                      ₹{calculateTotalDispatchValue().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dispatch-qty">Dispatched Quantity</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="dispatch-qty"
                    type="number"
                    value={singleDispatchQty}
                    onChange={(e) => setSingleDispatchQty(e.target.value)}
                    min={0}
                    step="0.01"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    / {totalQuantity.toLocaleString('en-IN')} {unit}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total ordered quantity: {totalQuantity.toLocaleString('en-IN')} {unit}
                </p>
              </div>
            )}

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
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
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
