import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const requirementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  product_category: z.string().min(1, 'Please select a category'),
  trade_type: z.enum(['import', 'export', 'domestic_india'], {
    required_error: 'Please select a trade type'
  }),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Please specify a unit'),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  deadline: z.string().min(1, 'Please select a deadline'),
  delivery_location: z.string().min(3, 'Please specify delivery location'),
  quality_standards: z.string().optional(),
  certifications_required: z.string().optional(),
  payment_terms: z.string().optional(),
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface CreateRequirementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const categories = [
  'Auto Vehicle & Accessories',
  'Beauty & Personal Care',
  'Consumer Electronics',
  'Electronic Components',
  'Fashion Accessories & Footwear',
  'Fashion Apparel & Fabrics',
  'Food & Beverages',
  'Furniture & Home Decor',
  'Gifts & Festival Products',
  'Hardware & Tools',
  'Health Care Products',
  'Home Appliances',
  'Household & Pets',
  'Industrial Supplies',
  'Machinery & Equipment',
  'Metals - Ferrous (Steel, Iron)',
  'Metals - Non-Ferrous (Copper, Aluminium)',
  'Mobile Electronics',
  'Mother, Kids & Toys',
  'Printing & Packaging',
  'School & Office Supplies',
  'Sports & Outdoor',
  'Telecommunication',
];

const units = ['Pieces', 'Kilograms', 'Tons', 'Liters', 'Meters', 'Sets', 'Cartons', 'Boxes'];

const tradeTypes = [
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
  { value: 'domestic_india', label: 'Domestic India' },
];

export function CreateRequirementForm({ open, onOpenChange, userId, onSuccess }: CreateRequirementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      unit: 'Pieces',
    },
  });

  const onSubmit = async (data: RequirementFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('requirements').insert({
        buyer_id: userId,
        title: data.title,
        description: data.description,
        product_category: data.product_category,
        trade_type: data.trade_type,
        quantity: data.quantity,
        unit: data.unit,
        budget_min: data.budget_min || null,
        budget_max: data.budget_max || null,
        deadline: data.deadline,
        delivery_location: data.delivery_location,
        quality_standards: data.quality_standards || null,
        certifications_required: data.certifications_required || null,
        payment_terms: data.payment_terms || null,
      });

      if (error) throw error;

      toast.success('Requirement posted successfully!');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating requirement:', error);
      toast.error(error.message || 'Failed to create requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Requirement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Requirement Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Industrial Ball Bearings for Manufacturing"
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed specifications, quality requirements, etc."
              rows={4}
              {...register('description')}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Category *</Label>
              <Select onValueChange={(value) => setValue('product_category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_category && <p className="text-sm text-destructive">{errors.product_category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Trade Type *</Label>
              <Select onValueChange={(value) => setValue('trade_type', value as 'import' | 'export' | 'domestic_india')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  {tradeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trade_type && <p className="text-sm text-destructive">{errors.trade_type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                placeholder="Enter quantity"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select defaultValue="Pieces" onValueChange={(value) => setValue('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                min={minDateStr}
                {...register('deadline')}
              />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget Min (₹)</Label>
              <Input
                id="budget_min"
                type="number"
                min={0}
                placeholder="Minimum budget"
                {...register('budget_min', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget Max (₹)</Label>
              <Input
                id="budget_max"
                type="number"
                min={0}
                placeholder="Maximum budget"
                {...register('budget_max', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_location">Delivery Location *</Label>
            <Input
              id="delivery_location"
              placeholder="City, State, Country"
              {...register('delivery_location')}
            />
            {errors.delivery_location && <p className="text-sm text-destructive">{errors.delivery_location.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality_standards">Quality Standards</Label>
            <Input
              id="quality_standards"
              placeholder="e.g., ISO 9001, CE certified"
              {...register('quality_standards')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications_required">Certifications Required</Label>
            <Input
              id="certifications_required"
              placeholder="e.g., BIS, FSSAI, FDA"
              {...register('certifications_required')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_terms">Payment Terms</Label>
            <Input
              id="payment_terms"
              placeholder="e.g., 30% advance, 70% on delivery"
              {...register('payment_terms')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Post Requirement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
