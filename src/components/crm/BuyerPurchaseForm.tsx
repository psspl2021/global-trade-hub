import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const purchaseItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0, 'Price must be positive'),
  tax_rate: z.number().min(0).max(100),
});

const purchaseSchema = z.object({
  supplier_id: z.string().optional(),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  invoice_number: z.string().optional(),
  status: z.string().min(1),
  payment_status: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface BuyerPurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editId?: string | null;
  onSuccess?: () => void;
}

export const BuyerPurchaseForm = ({ open, onOpenChange, userId, editId, onSuccess }: BuyerPurchaseFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      status: 'pending',
      payment_status: 'unpaid',
      notes: '',
      items: [{ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['buyer-suppliers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buyer_suppliers')
        .select('id, supplier_name, company_name')
        .eq('buyer_id', userId)
        .order('supplier_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingPurchase } = useQuery({
    queryKey: ['buyer-purchase', editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data: purchase, error } = await supabase
        .from('buyer_purchases')
        .select('*')
        .eq('id', editId)
        .maybeSingle();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('buyer_purchase_items')
        .select('*')
        .eq('purchase_id', editId);
      if (itemsError) throw itemsError;

      return { ...purchase, items };
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingPurchase) {
      form.reset({
        supplier_id: existingPurchase.supplier_id || '',
        purchase_date: existingPurchase.purchase_date,
        invoice_number: existingPurchase.invoice_number || '',
        status: existingPurchase.status,
        payment_status: existingPurchase.payment_status,
        notes: existingPurchase.notes || '',
        items: existingPurchase.items?.length > 0
          ? existingPurchase.items.map((item: any) => ({
              product_name: item.product_name,
              quantity: Number(item.quantity),
              unit: item.unit,
              unit_price: Number(item.unit_price),
              tax_rate: Number(item.tax_rate) || 18,
            }))
          : [{ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 }],
      });
    } else if (!editId) {
      form.reset({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        status: 'pending',
        payment_status: 'unpaid',
        notes: '',
        items: [{ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 }],
      });
    }
  }, [existingPurchase, editId, form]);

  const watchedItems = form.watch('items');
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    watchedItems.forEach((item) => {
      const itemTotal = (item.quantity || 0) * (item.unit_price || 0);
      subtotal += itemTotal;
      taxAmount += itemTotal * ((item.tax_rate || 0) / 100);
    });
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };
  const totals = calculateTotals();

  const mutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const purchaseData = {
        buyer_id: userId,
        supplier_id: data.supplier_id || null,
        purchase_date: data.purchase_date,
        invoice_number: data.invoice_number || null,
        status: data.status,
        payment_status: data.payment_status,
        notes: data.notes || null,
        total_amount: totals.total,
        tax_amount: totals.taxAmount,
      };

      let purchaseId = editId;

      if (isEditing) {
        const { error } = await supabase
          .from('buyer_purchases')
          .update(purchaseData)
          .eq('id', editId);
        if (error) throw error;

        // Delete existing items
        await supabase.from('buyer_purchase_items').delete().eq('purchase_id', editId);
      } else {
        const { data: newPurchase, error } = await supabase
          .from('buyer_purchases')
          .insert(purchaseData)
          .select()
          .single();
        if (error) throw error;
        purchaseId = newPurchase.id;
      }

      // Insert items
      const itemsToInsert = data.items.map((item) => ({
        purchase_id: purchaseId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.quantity * item.unit_price * (item.tax_rate / 100),
        total: item.quantity * item.unit_price * (1 + item.tax_rate / 100),
      }));

      const { error: itemsError } = await supabase
        .from('buyer_purchase_items')
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-purchases'] });
      toast.success(isEditing ? 'Purchase updated successfully' : 'Purchase added successfully');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to save purchase');
    },
  });

  const onSubmit = (data: PurchaseFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Purchase' : 'Record New Purchase'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name} {supplier.company_name && `(${supplier.company_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="INV-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_name`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Product</FormLabel>}
                            <FormControl>
                              <Input placeholder="Product name" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Qty</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Price</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.tax_rate`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel className="text-xs">Tax %</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Purchase' : 'Save Purchase'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
