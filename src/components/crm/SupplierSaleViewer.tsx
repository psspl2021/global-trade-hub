import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Building2, Calendar, FileText, Mail, Phone } from 'lucide-react';

interface SupplierSaleViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null;
}

export const SupplierSaleViewer = ({ open, onOpenChange, saleId }: SupplierSaleViewerProps) => {
  const { data: sale, isLoading } = useQuery({
    queryKey: ['supplier-sale-view', saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const { data: saleData, error } = await supabase
        .from('supplier_sales')
        .select(`
          *,
          supplier_customers (*)
        `)
        .eq('id', saleId)
        .maybeSingle();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('supplier_sale_items')
        .select('*')
        .eq('sale_id', saleId);
      if (itemsError) throw itemsError;

      return { ...saleData, items };
    },
    enabled: !!saleId,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'destructive',
      partial: 'secondary',
      paid: 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (!saleId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : sale ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Sale Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(sale.sale_date), 'dd MMM yyyy')}</span>
                    </div>
                    {sale.invoice_number && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{sale.invoice_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(sale.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Payment:</span>
                      {getPaymentBadge(sale.payment_status)}
                    </div>
                  </div>
                </div>
              </div>

              {sale.supplier_customers && (
                <div>
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{sale.supplier_customers.customer_name}</div>
                    {sale.supplier_customers.company_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {sale.supplier_customers.company_name}
                      </div>
                    )}
                    {sale.supplier_customers.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {sale.supplier_customers.email}
                      </div>
                    )}
                    {sale.supplier_customers.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {sale.supplier_customers.phone}
                      </div>
                    )}
                    {sale.supplier_customers.gstin && (
                      <div className="text-muted-foreground">
                        GSTIN: {sale.supplier_customers.gstin}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                    {sale.items?.map((item: any) => (
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

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tax Amount:</span>
                <span>₹{Number(sale.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>₹{Number(sale.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {sale.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {sale.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Sale not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};