/**
 * Governance Controls — Phase 6
 * Manage governance rules: credit limits, margin caps, vendor counts.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useGovernanceRules } from '@/hooks/useGovernanceRules';
import { toast } from 'sonner';

export function GovernanceControlSettings() {
  const { rules, loading, addRule, deleteRule } = useGovernanceRules();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', max_credit_days: '', min_vendor_count: '1', margin_cap: '' });

  const handleAdd = async () => {
    if (!form.category) { toast.error('Category is required'); return; }
    const { error } = await addRule({
      category: form.category,
      max_credit_days: form.max_credit_days ? Number(form.max_credit_days) : null,
      min_vendor_count: Number(form.min_vendor_count) || 1,
      margin_cap: form.margin_cap ? Number(form.margin_cap) : null,
    });
    if (error) { toast.error('Failed to add rule'); return; }
    toast.success('Governance rule added');
    setForm({ category: '', max_credit_days: '', min_vendor_count: '1', margin_cap: '' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteRule(id);
    if (!error) toast.success('Rule deactivated');
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-600 to-rose-700">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Governance Controls</h2>
            <p className="text-xs text-muted-foreground">Enforce credit limits, margin caps & vendor requirements</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3 w-3 mr-1" /> Add Rule
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <Input placeholder="Max Credit Days" type="number" value={form.max_credit_days} onChange={e => setForm({ ...form, max_credit_days: e.target.value })} />
              <Input placeholder="Min Vendor Count" type="number" value={form.min_vendor_count} onChange={e => setForm({ ...form, min_vendor_count: e.target.value })} />
              <Input placeholder="Margin Cap (%)" type="number" value={form.margin_cap} onChange={e => setForm({ ...form, margin_cap: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Save Rule</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 opacity-50" />
            No governance rules configured. Click "Add Rule" to begin.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Max Credit Days</TableHead>
                  <TableHead>Min Vendors</TableHead>
                  <TableHead>Margin Cap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.category || 'All'}</TableCell>
                    <TableCell>{r.max_credit_days ?? '—'}</TableCell>
                    <TableCell>{r.min_vendor_count}</TableCell>
                    <TableCell>{r.margin_cap != null ? `${r.margin_cap}%` : '—'}</TableCell>
                    <TableCell><Badge variant="secondary" className="bg-emerald-100 text-emerald-700">Active</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
