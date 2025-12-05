import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, ShoppingCart, Receipt, Loader2, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DocumentListProps {
  userId: string;
  onCreateInvoice: (type: 'proforma_invoice' | 'tax_invoice') => void;
  onCreatePO: () => void;
  onViewInvoice: (id: string) => void;
  onViewPO: (id: string) => void;
  onEditInvoice: (id: string) => void;
  onEditPO: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export const DocumentList = ({
  userId,
  onCreateInvoice,
  onCreatePO,
  onViewInvoice,
  onViewPO,
  onEditInvoice,
  onEditPO,
}: DocumentListProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    
    const [invoicesRes, posRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('*')
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (invoicesRes.error && import.meta.env.DEV) console.error('Error fetching invoices:', invoicesRes.error);
    if (posRes.error && import.meta.env.DEV) console.error('Error fetching POs:', posRes.error);

    setInvoices(invoicesRes.data || []);
    setPurchaseOrders(posRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) fetchDocuments();
  }, [userId]);

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete invoice', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Invoice deleted successfully' });
      fetchDocuments();
    }
  };

  const deletePO = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete purchase order', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Purchase order deleted successfully' });
      fetchDocuments();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const proformaInvoices = invoices.filter(i => i.document_type === 'proforma_invoice');
  const taxInvoices = invoices.filter(i => i.document_type === 'tax_invoice');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onCreateInvoice('proforma_invoice')} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Proforma Invoice
        </Button>
        <Button onClick={() => onCreateInvoice('tax_invoice')} size="sm" variant="secondary">
          <Plus className="h-4 w-4 mr-1" /> Tax Invoice
        </Button>
        <Button onClick={onCreatePO} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Purchase Order
        </Button>
      </div>

      <Tabs defaultValue="proforma" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proforma" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 hidden sm:inline" />
            Proforma ({proformaInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="tax" className="text-xs sm:text-sm">
            <Receipt className="h-4 w-4 mr-1 hidden sm:inline" />
            Tax Invoice ({taxInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="po" className="text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4 mr-1 hidden sm:inline" />
            PO ({purchaseOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proforma" className="mt-4">
          {proformaInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No proforma invoices yet</p>
                <Button onClick={() => onCreateInvoice('proforma_invoice')} className="mt-4" variant="outline">
                  Create First Proforma Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {proformaInvoices.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{inv.invoice_number}</span>
                          <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{inv.buyer_name}</p>
                        <p className="text-sm">₹{Number(inv.total_amount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.issue_date), 'dd MMM yyyy')}</p>
                        <div className="flex gap-1 mt-2">
                          <Button size="icon" variant="ghost" onClick={() => onViewInvoice(inv.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onEditInvoice(inv.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteInvoice(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          {taxInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tax invoices yet</p>
                <Button onClick={() => onCreateInvoice('tax_invoice')} className="mt-4" variant="outline">
                  Create First Tax Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {taxInvoices.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{inv.invoice_number}</span>
                          <Badge className={statusColors[inv.status]}>{inv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{inv.buyer_name}</p>
                        <p className="text-sm">₹{Number(inv.total_amount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.issue_date), 'dd MMM yyyy')}</p>
                        <div className="flex gap-1 mt-2">
                          <Button size="icon" variant="ghost" onClick={() => onViewInvoice(inv.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onEditInvoice(inv.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteInvoice(inv.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="po" className="mt-4">
          {purchaseOrders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No purchase orders yet</p>
                <Button onClick={onCreatePO} className="mt-4" variant="outline">
                  Create First Purchase Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {purchaseOrders.map((po) => (
                <Card key={po.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{po.po_number}</span>
                          <Badge className={statusColors[po.status]}>{po.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{po.vendor_name}</p>
                        <p className="text-sm">₹{Number(po.total_amount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{format(new Date(po.order_date), 'dd MMM yyyy')}</p>
                        <div className="flex gap-1 mt-2">
                          <Button size="icon" variant="ghost" onClick={() => onViewPO(po.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onEditPO(po.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deletePO(po.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
