import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit2, Trash2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface BuyerPurchasesListProps {
  userId: string;
  onCreatePurchase: () => void;
  onEditPurchase: (id: string) => void;
  onViewPurchase: (id: string) => void;
}

export const BuyerPurchasesList = ({ userId, onCreatePurchase, onEditPurchase, onViewPurchase }: BuyerPurchasesListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['buyer-purchases', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_purchases')
        .select(`
          *,
          buyer_suppliers (supplier_name, company_name)
        `)
        .eq('buyer_id', userId)
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buyer_purchases')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
      toast.success('Purchase deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete purchase');
    },
  });

  const filteredPurchases = purchases?.filter(purchase =>
    purchase.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.buyer_suppliers?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.buyer_suppliers?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreatePurchase}>
          <Plus className="h-4 w-4 mr-2" />
          Add Purchase
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading purchases...</div>
      ) : filteredPurchases?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No purchases found. Record your first purchase to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases?.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {purchase.invoice_number || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{purchase.buyer_suppliers?.supplier_name || '-'}</div>
                      {purchase.buyer_suppliers?.company_name && (
                        <div className="text-sm text-muted-foreground">{purchase.buyer_suppliers.company_name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{Number(purchase.total_amount).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>{getPaymentBadge(purchase.payment_status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onViewPurchase(purchase.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEditPurchase(purchase.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this purchase? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(purchase.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
