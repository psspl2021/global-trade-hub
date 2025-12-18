import { useEffect } from 'react';
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

const saleItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unit_price: z.number().min(0, 'Price must be positive'),
  tax_rate: z.number().min(0).max(100),
});

const saleSchema = z.object({
  customer_id: z.string().optional(),
  sale_date: z.string().min(1, 'Sale date is required'),
  invoice_number: z.string().optional(),
  status: z.string().min(1),
  payment_status: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface SupplierSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editId?: string | null;
  onSuccess?: () => void;
}

export const SupplierSaleForm = ({ open, onOpenChange, userId, editId, onSuccess }: SupplierSaleFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      status: 'pending',
      payment_status: 'pending',
      notes: '',
      items: [{ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const { data: customers } = useQuery({
    queryKey: ['supplier-customers', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_customers')
        .select('id, customer_name, company_name')
        .eq('supplier_id', userId)
        .order('customer_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingSale } = useQuery({
    queryKey: ['supplier-sale', editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data: sale, error } = await supabase
        .from('supplier_sales')
        .select('*')
        .eq('id', editId)
        .maybeSingle();
      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('supplier_sale_items')
        .select('*')
        .eq('sale_id', editId);
      if (itemsError) throw itemsError;

      return { ...sale, items };
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingSale) {
      form.reset({
        customer_id: existingSale.customer_id || '',
        sale_date: existingSale.sale_date,
        invoice_number: existingSale.invoice_number || '',
        status: existingSale.status,
        payment_status: existingSale.payment_status,
        notes: existingSale.notes || '',
        items: existingSale.items?.length > 0
          ? existingSale.items.map((item: any) => ({
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
        customer_id: '',
        sale_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        status: 'pending',
        payment_status: 'pending',
        notes: '',
        items: [{ product_name: '', quantity: 1, unit: 'units', unit_price: 0, tax_rate: 18 }],
      });
    }
  }, [existingSale, editId, form]);

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
    mutationFn: async (data: SaleFormData) => {
      const saleData = {
        supplier_id: userId,
        customer_id: data.customer_id || null,
        sale_date: data.sale_date,
        invoice_number: data.invoice_number || null,
        status: data.status,
        payment_status: data.payment_status,
        notes: data.notes || null,
        total_amount: totals.total,
        tax_amount: totals.taxAmount,
      };

      let saleId = editId;

      if (isEditing) {
        const { error } = await supabase
          .from('supplier_sales')
          .update(saleData)
          .eq('id', editId);
        if (error) throw error;

        await supabase.from('supplier_sale_items').delete().eq('sale_id', editId);
      } else {
        const { data: newSale, error } = await supabase
          .from('supplier_sales')
          .insert(saleData)
          .select()
          .single();
        if (error) throw error;
        saleId = newSale.id;
      }

      const itemsToInsert = data.items.map((item) => ({
        sale_id: saleId,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.quantity * item.unit_price * (item.tax_rate / 100),
        total: item.quantity * item.unit_price * (1 + item.tax_rate / 100),
      }));

      const { error: itemsError } = await supabase
        .from('supplier_sale_items')
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-sales'] });
      toast.success(isEditing ? 'Sale updated successfully' : 'Sale added successfully');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to save sale');
    },
  });

  const onSubmit = (data: SaleFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.customer_name} {customer.company_name && `(${customer.company_name})`}
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
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date *</FormLabel>
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
                        <SelectItem value="completed">Completed</SelectItem>
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
                        <SelectItem value="pending">Pending</SelectItem>
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
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Sale' : 'Save Sale'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};