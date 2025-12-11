import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { countries } from '@/data/countries';

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editId?: string | null;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const sourceOptions = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'other', label: 'Other' },
];

export const LeadForm = ({ open, onOpenChange, userId, editId, onSuccess }: LeadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    country: '',
    source: 'manual',
    status: 'new',
    notes: '',
    expected_value: '',
    next_follow_up: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (editId && open) {
      fetchLead();
    } else if (!editId && open) {
      resetForm();
    }
  }, [editId, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      country: '',
      source: 'manual',
      status: 'new',
      notes: '',
      expected_value: '',
      next_follow_up: '',
    });
  };

  const fetchLead = async () => {
    const { data, error } = await supabase
      .from('supplier_leads')
      .select('*')
      .eq('id', editId)
      .single();

    if (data) {
      setFormData({
        name: data.name || '',
        company_name: data.company_name || '',
        email: data.email || '',
        phone: data.phone || '',
        country: data.country || '',
        source: data.source || 'manual',
        status: data.status || 'new',
        notes: data.notes || '',
        expected_value: data.expected_value?.toString() || '',
        next_follow_up: data.next_follow_up || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Lead name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const leadData = {
      supplier_id: userId,
      name: formData.name,
      company_name: formData.company_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      country: formData.country || null,
      source: formData.source,
      status: formData.status,
      notes: formData.notes || null,
      expected_value: formData.expected_value ? parseFloat(formData.expected_value) : null,
      next_follow_up: formData.next_follow_up || null,
    };

    let error;
    if (editId) {
      const res = await supabase.from('supplier_leads').update(leadData).eq('id', editId);
      error = res.error;
    } else {
      const res = await supabase.from('supplier_leads').insert(leadData);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save lead', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: editId ? 'Lead updated' : 'Lead created' });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {editId ? 'Update lead information' : 'Add a potential customer to your pipeline'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="name">Contact Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="source">Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="expected_value">Expected Value (₹)</Label>
              <Input
                id="expected_value"
                type="number"
                value={formData.expected_value}
                onChange={(e) => setFormData({ ...formData, expected_value: e.target.value })}
                placeholder="100000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="next_follow_up">Next Follow-up Date</Label>
            <Input
              id="next_follow_up"
              type="date"
              value={formData.next_follow_up}
              onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this lead..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? 'Update Lead' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
