/**
 * Category Price Benchmark Manager — Admin Only
 * Set benchmark prices per category + unit + region
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, IndianRupee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface Benchmark {
  id: string;
  category: string;
  subcategory: string | null;
  unit: string;
  region: string;
  benchmark_price: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Steel', 'Metals', 'Chemicals', 'Polymers', 'Construction Materials',
  'Textiles', 'Food & Agriculture', 'Packaging', 'Industrial Supplies',
  'Pulses & Spices', 'Minerals', 'Paper', 'Electronics', 'Other'
];

const UNITS = ['MT', 'KG', 'Litre', 'Piece', 'Sqft', 'Bundle', 'Bag'];
const REGIONS = ['India', 'Middle East', 'Southeast Asia', 'Europe', 'USA', 'Africa', 'Global'];

export function BenchmarkManager() {
  const { user } = useAuth();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Benchmark | null>(null);
  const [form, setForm] = useState({
    category: '', subcategory: '', unit: 'MT', region: 'India',
    benchmark_price: '', currency: 'INR', effective_from: '', notes: ''
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('category_price_benchmarks')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false });
    if (!error) setBenchmarks((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const resetForm = () => {
    setForm({ category: '', subcategory: '', unit: 'MT', region: 'India', benchmark_price: '', currency: 'INR', effective_from: '', notes: '' });
    setEditing(null);
  };

  const handleEdit = (b: Benchmark) => {
    setEditing(b);
    setForm({
      category: b.category,
      subcategory: b.subcategory || '',
      unit: b.unit,
      region: b.region,
      benchmark_price: String(b.benchmark_price),
      currency: b.currency,
      effective_from: b.effective_from,
      notes: b.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.benchmark_price) {
      toast.error('Category and price are required');
      return;
    }

    const payload = {
      category: form.category,
      subcategory: form.subcategory || null,
      unit: form.unit,
      region: form.region,
      benchmark_price: parseFloat(form.benchmark_price),
      currency: form.currency,
      effective_from: form.effective_from || new Date().toISOString().split('T')[0],
      notes: form.notes || null,
      set_by: user?.id || null,
    };

    try {
      if (editing) {
        const { error } = await supabase.from('category_price_benchmarks').update(payload as any).eq('id', editing.id);
        if (error) throw error;
        toast.success('Benchmark updated');
      } else {
        const { error } = await supabase.from('category_price_benchmarks').insert(payload as any);
        if (error) throw error;
        toast.success('Benchmark added');
      }
      setDialogOpen(false);
      resetForm();
      fetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this benchmark?')) return;
    const { error } = await supabase.from('category_price_benchmarks').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetch(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Category Price Benchmarks
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Benchmark</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Benchmark</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Subcategory</Label>
                  <Input value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} placeholder="e.g. HR Coil" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Price (₹) *</Label>
                  <Input type="number" value={form.benchmark_price} onChange={e => setForm(p => ({ ...p, benchmark_price: e.target.value }))} placeholder="50000" />
                </div>
                <div className="space-y-1">
                  <Label>Unit</Label>
                  <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Region</Label>
                  <Select value={form.region} onValueChange={v => setForm(p => ({ ...p, region: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Effective From</Label>
                <Input type="date" value={form.effective_from} onChange={e => setForm(p => ({ ...p, effective_from: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Source or context" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Update' : 'Add'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : benchmarks.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No benchmarks set. Add your first one above.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarks.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.category}</TableCell>
                  <TableCell>{b.subcategory || '—'}</TableCell>
                  <TableCell>₹{b.benchmark_price.toLocaleString()}</TableCell>
                  <TableCell>{b.unit}</TableCell>
                  <TableCell>{b.region}</TableCell>
                  <TableCell className="text-xs">{format(new Date(b.effective_from), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
