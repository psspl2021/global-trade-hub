import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building, Mail, Phone, Globe, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface LeadViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  proposal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  negotiation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const LeadViewer = ({ open, onOpenChange, leadId }: LeadViewerProps) => {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (leadId && open) {
      fetchLead();
    }
  }, [leadId, open]);

  const fetchLead = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('supplier_leads')
      .select('*')
      .eq('id', leadId)
      .single();
    setLead(data);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lead ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{lead.name}</h3>
              <Badge className={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
            </div>

            <div className="grid gap-3">
              {lead.company_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>{lead.company_name}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${lead.email}`} className="hover:text-primary">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${lead.phone}`} className="hover:text-primary">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.country && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{lead.country}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Lead Source</p>
                <p className="font-medium capitalize">{lead.source?.replace('_', ' ')}</p>
              </div>
              {lead.expected_value && (
                <div>
                  <p className="text-xs text-muted-foreground">Expected Value</p>
                  <p className="font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />₹{Number(lead.expected_value).toLocaleString()}
                  </p>
                </div>
              )}
              {lead.next_follow_up && (
                <div>
                  <p className="text-xs text-muted-foreground">Next Follow-up</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(lead.next_follow_up), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(lead.created_at), 'dd MMM yyyy')}</p>
              </div>
            </div>

            {lead.notes && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MessageSquare className="h-3 w-3" /> Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Lead not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
