import { useState, useEffect } from 'react';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';

interface RequirementItem {
  item_name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
}

const requirementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  trade_type: z.enum(['import', 'export', 'domestic_india'], {
    required_error: 'Please select a trade type'
  }),
  deadline: z.string().min(1, 'Please select a deadline'),
  delivery_location: z.string().min(3, 'Please specify delivery location'),
  quality_standards: z.string().optional(),
  certifications_required: z.string().optional(),
  payment_terms: z.string().optional(),
});

type RequirementFormData = z.infer<typeof requirementSchema>;

interface AIGeneratedRFQ {
  title: string;
  description: string;
  category: string;
  items: {
    item_name: string;
    description: string;
    quantity: number;
    unit: string;
  }[];
  trade_type: 'import' | 'export' | 'domestic_india';
  quality_standards?: string;
  certifications_required?: string;
  payment_terms?: string;
}

interface RFQSuccessData {
  category: string;
  quantity: number;
  deliveryLocation: string;
  requirementId: string;
}

interface CreateRequirementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: (data: RFQSuccessData) => void;
  prefillData?: AIGeneratedRFQ | null;
  onClearPrefill?: () => void;
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

const defaultItem: RequirementItem = {
  item_name: '',
  description: '',
  category: '',
  quantity: 1,
  unit: 'Pieces',
};

export function CreateRequirementForm({ open, onOpenChange, userId, onSuccess, prefillData, onClearPrefill }: CreateRequirementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<RequirementItem[]>([{ ...defaultItem }]);
  const [customerName, setCustomerName] = useState('');
  const [userBusinessType, setUserBusinessType] = useState<string | null>(null);
  const { role } = useUserRole(userId);

  // Fetch user's business_type
  useEffect(() => {
    const fetchBusinessType = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', userId)
        .single();
      if (data) {
        setUserBusinessType(data.business_type);
      }
    };
    fetchBusinessType();
  }, [userId]);

  // Check if user can add customer name (admin, dealer, or distributor)
  const canAddCustomerName = role === 'admin' || userBusinessType === 'dealer' || userBusinessType === 'distributor';

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequirementFormData>({
    resolver: zodResolver(requirementSchema),
  });

  // Pre-fill form when AI data is provided
  useEffect(() => {
    if (prefillData && open) {
      setValue('title', prefillData.title);
      setValue('description', prefillData.description);
      setValue('trade_type', prefillData.trade_type);
      if (prefillData.quality_standards) setValue('quality_standards', prefillData.quality_standards);
      if (prefillData.certifications_required) setValue('certifications_required', prefillData.certifications_required);
      if (prefillData.payment_terms) setValue('payment_terms', prefillData.payment_terms);
      
      // Map AI items to form items
      const mappedItems: RequirementItem[] = prefillData.items.map(item => ({
        item_name: item.item_name,
        description: item.description,
        category: prefillData.category,
        quantity: item.quantity,
        unit: item.unit,
      }));
      setItems(mappedItems.length > 0 ? mappedItems : [{ ...defaultItem }]);
    }
  }, [prefillData, open, setValue]);

  const addItem = () => {
    setItems([...items, { ...defaultItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequirementItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const validateItems = (): boolean => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_name.trim()) {
        toast.error(`Item ${i + 1}: Please enter product name`);
        return false;
      }
      if (!item.category) {
        toast.error(`Item ${i + 1}: Please select a category`);
        return false;
      }
      if (!item.description.trim()) {
        toast.error(`Item ${i + 1}: Please enter product description`);
        return false;
      }
      if (item.quantity <= 0) {
        toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data: RequirementFormData) => {
    if (!validateItems()) return;

    setIsSubmitting(true);
    try {
      // Calculate total quantity and get primary category from first item
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const primaryCategory = items[0].category;

      // Insert main requirement
      const { data: requirement, error: reqError } = await supabase
        .from('requirements')
        .insert({
          buyer_id: userId,
          title: data.title,
          description: data.description,
          product_category: primaryCategory,
          trade_type: data.trade_type,
          quantity: totalQuantity,
          unit: items[0].unit,
          budget_min: null,
          budget_max: null,
          deadline: data.deadline,
          delivery_location: data.delivery_location,
          quality_standards: data.quality_standards || null,
          certifications_required: data.certifications_required || null,
          payment_terms: data.payment_terms || null,
          customer_name: canAddCustomerName && customerName.trim() ? customerName.trim() : null,
        })
        .select('id')
        .single();

      if (reqError) throw reqError;

      // Insert requirement items
      const itemsToInsert = items.map((item) => ({
        requirement_id: requirement.id,
        item_name: item.item_name,
        description: item.description || null,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        budget_min: null,
        budget_max: null,
      }));

      const { error: itemsError } = await supabase
        .from('requirement_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Requirement posted successfully!');
      reset();
      setItems([{ ...defaultItem }]);
      onOpenChange(false);
      
      // Pass RFQ data to parent for AI inventory matching
      onSuccess?.({
        category: primaryCategory,
        quantity: totalQuantity,
        deliveryLocation: data.delivery_location,
        requirementId: requirement.id,
      });
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Error creating requirement:', error);
      toast.error(error.message || 'Failed to create requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setItems([{ ...defaultItem }]);
      setCustomerName('');
    }
    onOpenChange(isOpen);
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Customer Name - Visible to Admin, Dealers, and Distributors */}
          {canAddCustomerName && (
            <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Label htmlFor="customer_name" className="flex items-center gap-2">
                Customer Name
                <span className="text-xs text-muted-foreground font-normal">(who are you selling to?)</span>
              </Label>
              <Input
                id="customer_name"
                placeholder="e.g., A & A Business Impex"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the customer name you're buying this material for (resale/distribution)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed specifications, quality requirements, etc."
              rows={3}
              {...register('description')}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Product Name *</Label>
                      <Input
                        placeholder="e.g., Steel Ball Bearings"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Category *</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateItem(index, 'category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        min={0.01}
                        step="any"
                        placeholder="Enter quantity"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Unit *</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) => updateItem(index, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>


                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs">Product Description *</Label>
                      <Textarea
                        placeholder="Provide detailed specifications, quality requirements, material details, etc."
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="delivery_location">Delivery Location *</Label>
            <Input
              id="delivery_location"
              placeholder="City, State, Country"
              {...register('delivery_location')}
            />
            {errors.delivery_location && <p className="text-sm text-destructive">{errors.delivery_location.message}</p>}
            <p className="text-xs text-muted-foreground">
              Note: Transport cost to the delivery location will be quoted separately by suppliers.
            </p>
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
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
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
