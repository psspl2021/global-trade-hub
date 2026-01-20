import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { indianLocations } from '@/data/indianLocations';

const logisticsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  material_type: z.string().min(1, 'Material type is required'),
  material_description: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  pickup_location: z.string().min(3, 'Pickup location is required'),
  delivery_location: z.string().min(3, 'Delivery location is required'),
  pickup_date: z.string().min(1, 'Pickup date is required'),
  delivery_deadline: z.string().min(1, 'Delivery deadline is required'),
  vehicle_type_preference: z.string().optional(),
  special_requirements: z.string().optional(),
  budget_max: z.coerce.number().optional(),
});

type LogisticsFormData = z.infer<typeof logisticsSchema>;

interface CreateLogisticsRequirementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const materialTypes = [
  'Raw Materials', 'Finished Goods', 'Machinery & Equipment', 'Agricultural Products',
  'Chemicals', 'Food & Beverages', 'Textiles', 'Electronics', 'Construction Materials',
  'Automotive Parts', 'Pharmaceuticals', 'Other'
];

const units = ['tons', 'kg', 'pieces', 'CBM', 'pallets', 'containers'];

const vehicleTypes = [
  { value: 'truck', label: 'Truck' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'container_truck', label: 'Container Truck' },
  { value: 'open_truck', label: 'Open Truck' },
  { value: 'closed_container', label: 'Closed Container' },
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'flatbed', label: 'Flatbed' },
];

export const CreateLogisticsRequirementForm = ({ 
  open, 
  onOpenChange, 
  userId, 
  onSuccess 
}: CreateLogisticsRequirementFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<LogisticsFormData>({
    resolver: zodResolver(logisticsSchema),
    defaultValues: {
      unit: 'tons',
      quantity: 1,
    },
  });

  const onSubmit = async (data: LogisticsFormData) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate open/expired logistics requirements with same route
      const { count: duplicateCount, error: dupError } = await (supabase
        .from('logistics_requirements') as any)
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .eq('pickup_location', data.pickup_location)
        .eq('delivery_location', data.delivery_location)
        .in('status', ['active', 'expired'])
        .or('buyer_closure_status.is.null,buyer_closure_status.eq.open');

      if (dupError) {
        if (import.meta.env.DEV) console.error('Duplicate check error:', dupError);
      } else if (duplicateCount && duplicateCount > 0) {
        toast({
          title: 'Duplicate Load',
          description: 'You already have an open or recently expired load for this route. Please close or extend the existing one before creating a new load.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const { error } = await (supabase.from('logistics_requirements') as any).insert({
        customer_id: userId,
        title: data.title,
        material_type: data.material_type,
        material_description: data.material_description || null,
        quantity: data.quantity,
        unit: data.unit,
        pickup_location: data.pickup_location,
        delivery_location: data.delivery_location,
        pickup_date: data.pickup_date,
        delivery_deadline: data.delivery_deadline,
        vehicle_type_preference: data.vehicle_type_preference || null,
        special_requirements: data.special_requirements || null,
        budget_max: data.budget_max || null,
        buyer_closure_status: 'open', // Always start as open
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Logistics requirement posted successfully!' });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Logistics Requirement</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Transport Steel Coils Delhi to Mumbai" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="material_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {materialTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vehicle_type_preference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Preference</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Any vehicle" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vehicleTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="material_description" render={({ field }) => (
              <FormItem>
                <FormLabel>Material Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the cargo in detail..." rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="budget_max" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Budget (₹)</FormLabel>
                  <FormControl><Input type="number" placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pickup_location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Location *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pickup location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {indianLocations.map(loc => (
                        <SelectItem key={`pickup-${loc.city}`} value={`${loc.city}, ${loc.state}`}>
                          {loc.city}, {loc.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="delivery_location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Location *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {indianLocations.map(loc => (
                        <SelectItem key={`delivery-${loc.city}`} value={`${loc.city}, ${loc.state}`}>
                          {loc.city}, {loc.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="pickup_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="delivery_deadline" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Deadline *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="special_requirements" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requirements</FormLabel>
                <FormControl>
                  <Textarea placeholder="Handling instructions, insurance, cold chain, hazmat, etc." rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post Requirement
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
