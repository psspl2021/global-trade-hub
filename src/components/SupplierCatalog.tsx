import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price_range_min: z.coerce.number().min(0).optional(),
  price_range_max: z.coerce.number().min(0).optional(),
  moq: z.coerce.number().min(1).optional(),
  lead_time_days: z.coerce.number().min(1).optional(),
  hs_code: z.string().optional(),
  packaging_details: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  moq: number | null;
  lead_time_days: number | null;
  hs_code: string | null;
  packaging_details: string | null;
  is_active: boolean;
}

const categories = [
  'Electronics', 'Textiles', 'Machinery', 'Chemicals', 'Food & Beverages',
  'Automotive', 'Construction', 'Medical', 'Agriculture', 'Other'
];

interface SupplierCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const SupplierCatalog = ({ open, onOpenChange, userId }: SupplierCatalogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      moq: 1,
      lead_time_days: 7,
    },
  });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && userId) {
      fetchProducts();
    }
  }, [open, userId]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ 
            name: data.name,
            category: data.category,
            description: data.description || null,
            price_range_min: data.price_range_min || null,
            price_range_max: data.price_range_max || null,
            moq: data.moq || null,
            lead_time_days: data.lead_time_days || null,
            hs_code: data.hs_code || null,
            packaging_details: data.packaging_details || null,
            supplier_id: userId 
          }]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Product added successfully' });
      }

      form.reset();
      setShowAddForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      category: product.category,
      description: product.description || '',
      price_range_min: product.price_range_min || undefined,
      price_range_max: product.price_range_max || undefined,
      moq: product.moq || undefined,
      lead_time_days: product.lead_time_days || undefined,
      hs_code: product.hs_code || '',
      packaging_details: product.packaging_details || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Product deleted' });
      fetchProducts();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Product Catalog</span>
            <Button size="sm" onClick={() => { setEditingProduct(null); form.reset(); setShowAddForm(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showAddForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price_range_min" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Price (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="price_range_max" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Price (₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="moq" render={({ field }) => (
                      <FormItem>
                        <FormLabel>MOQ</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lead_time_days" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Time (days)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="hs_code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>HS Code</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="packaging_details" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Packaging Details</FormLabel>
                      <FormControl><Textarea {...field} rows={2} /></FormControl>
                    </FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit">Save Product</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setEditingProduct(null); }}>Cancel</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(product => (
              <Card key={product.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    {product.price_range_min && product.price_range_max && (
                      <p className="text-sm">₹{product.price_range_min} - ₹{product.price_range_max}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
