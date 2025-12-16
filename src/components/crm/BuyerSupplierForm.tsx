import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface BuyerSupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editId?: string | null;
  onSuccess?: () => void;
}

export const BuyerSupplierForm = ({ open, onOpenChange, userId, editId, onSuccess }: BuyerSupplierFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!editId;

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      notes: '',
    },
  });

  const { data: existingSupplier } = useQuery({
    queryKey: ['buyer-supplier', editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from('buyer_suppliers')
        .select('*')
        .eq('id', editId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingSupplier) {
      form.reset({
        supplier_name: existingSupplier.supplier_name,
        company_name: existingSupplier.company_name || '',
        email: existingSupplier.email || '',
        phone: existingSupplier.phone || '',
        address: existingSupplier.address || '',
        gstin: existingSupplier.gstin || '',
        notes: existingSupplier.notes || '',
      });
    } else if (!editId) {
      form.reset({
        supplier_name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        gstin: '',
        notes: '',
      });
    }
  }, [existingSupplier, editId, form]);

  const mutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const supplierData = {
        buyer_id: userId,
        supplier_name: data.supplier_name,
        company_name: data.company_name || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        gstin: data.gstin || null,
        notes: data.notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('buyer_suppliers')
          .update(supplierData)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('buyer_suppliers')
          .insert(supplierData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-suppliers'] });
      toast.success(isEditing ? 'Supplier updated successfully' : 'Supplier added successfully');
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to save supplier');
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 XXXXXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GSTIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GSTIN" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {mutation.isPending ? 'Saving...' : isEditing ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
