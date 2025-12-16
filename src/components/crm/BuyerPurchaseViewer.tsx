import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Building2, Calendar, FileText, Mail, Phone } from 'lucide-react';

interface BuyerPurchaseViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string | null;
}

export const BuyerPurchaseViewer = ({ open, onOpenChange, purchaseId }: BuyerPurchaseViewerProps) => {
  const { data: purchase, isLoading } = useQuery({
    queryKey: ['buyer-purchase-view', purchaseId],
    queryFn: async () => {
      if (!purchaseId) return null;
      const { data: purchaseData, error } = await supabase
        .from('buyer_purchases')
        .select(`
          *,
          buyer_suppliers (*)
        `)
        .eq('id', purchaseId)
        .maybeSingle();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('buyer_purchase_items')
        .select('*')
        .eq('purchase_id', purchaseId);
      if (itemsError) throw itemsError;

      return { ...purchaseData, items };
    },
    enabled: !!purchaseId,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      received: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      unpaid: 'destructive',
      partial: 'secondary',
      paid: 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (!purchaseId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : purchase ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Purchase Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(purchase.purchase_date), 'dd MMM yyyy')}</span>
                    </div>
                    {purchase.invoice_number && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{purchase.invoice_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(purchase.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Payment:</span>
                      {getPaymentBadge(purchase.payment_status)}
                    </div>
                  </div>
                </div>
              </div>

              {purchase.buyer_suppliers && (
                <div>
                  <h3 className="font-semibold mb-2">Supplier Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{purchase.buyer_suppliers.supplier_name}</div>
                    {purchase.buyer_suppliers.company_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {purchase.buyer_suppliers.company_name}
                      </div>
                    )}
                    {purchase.buyer_suppliers.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {purchase.buyer_suppliers.email}
                      </div>
                    )}
                    {purchase.buyer_suppliers.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {purchase.buyer_suppliers.phone}
                      </div>
                    )}
                    {purchase.buyer_suppliers.gstin && (
                      <div className="text-muted-foreground">
                        GSTIN: {purchase.buyer_suppliers.gstin}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div>
              <h3 className="font-semibold mb-2">Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Tax</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          ₹{Number(item.unit_price).toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">{Number(item.tax_rate)}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tax Amount:</span>
                <span>₹{Number(purchase.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{Number(purchase.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Notes */}
            {purchase.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {purchase.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Purchase not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
