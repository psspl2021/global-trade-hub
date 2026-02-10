/**
 * Sales Control Board — Admin Only
 * HOT / WARM / COLD RFQ pipeline with sales actions
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Flame, ThermometerSun, Snowflake, Clock, UserPlus, 
  Phone, XCircle, MapPin, Package, TrendingUp, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface LeadScore {
  id: string;
  session_id: string | null;
  requirement_id: string | null;
  lead_score: string;
  confidence_score: number;
  intent_strength: string | null;
  budget_confidence: string | null;
  urgency: string | null;
  category_fit: string | null;
  ai_reason_summary: string | null;
  buyer_company: string | null;
  buyer_location: string | null;
  estimated_deal_value: number | null;
  category_slug: string | null;
  trade_type: string | null;
  created_at: string;
  latest_action?: string | null;
}

const LOSS_REASONS = [
  'Price too high',
  'Delivery timeline too long',
  'Compliance/certification gap',
  'Buyer went with competitor',
  'Budget not approved',
  'Requirement cancelled',
  'Other',
];

export function SalesControlBoard() {
  const [leads, setLeads] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('HOT');
  const [actionDialog, setActionDialog] = useState<{ lead: LeadScore; type: string } | null>(null);
  const [actionForm, setActionForm] = useState({ assigned_to: '', loss_reason: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rfq_lead_scores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch latest action for each lead
      const leadIds = (data || []).map((l: any) => l.id);
      let actionsMap: Record<string, string> = {};
      
      if (leadIds.length > 0) {
        const { data: actions } = await supabase
          .from('sales_actions')
          .select('lead_score_id, action_type, created_at')
          .in('lead_score_id', leadIds)
          .order('created_at', { ascending: false });

        if (actions) {
          for (const a of actions as any[]) {
            if (!actionsMap[a.lead_score_id]) {
              actionsMap[a.lead_score_id] = a.action_type;
            }
          }
        }
      }

      setLeads((data || []).map((l: any) => ({
        ...l,
        latest_action: actionsMap[l.id] || null,
      })));
    } catch (err) {
      console.error('[SalesBoard] Fetch error:', err);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = leads.filter(l => l.lead_score === activeTab);

  const handleAction = async () => {
    if (!actionDialog) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sales_actions').insert({
        lead_score_id: actionDialog.lead.id,
        action_type: actionDialog.type,
        assigned_to: actionForm.assigned_to || null,
        loss_reason: actionDialog.type === 'mark_lost' ? actionForm.loss_reason : null,
        notes: actionForm.notes || null,
      } as any);

      if (error) throw error;
      toast.success(
        actionDialog.type === 'assign_sales' ? 'Assigned to sales' :
        actionDialog.type === 'mark_contacted' ? 'Marked as contacted' :
        'Marked as lost'
      );
      setActionDialog(null);
      setActionForm({ assigned_to: '', loss_reason: '', notes: '' });
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const scoreBadge = (score: string) => {
    switch (score) {
      case 'HOT': return <Badge className="bg-red-600 text-white gap-1"><Flame className="h-3 w-3" /> HOT</Badge>;
      case 'WARM': return <Badge className="bg-amber-500 text-white gap-1"><ThermometerSun className="h-3 w-3" /> WARM</Badge>;
      case 'COLD': return <Badge className="bg-blue-500 text-white gap-1"><Snowflake className="h-3 w-3" /> COLD</Badge>;
      default: return <Badge variant="outline">{score}</Badge>;
    }
  };

  const counts = {
    HOT: leads.filter(l => l.lead_score === 'HOT').length,
    WARM: leads.filter(l => l.lead_score === 'WARM').length,
    COLD: leads.filter(l => l.lead_score === 'COLD').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Sales Control Board
          </h2>
          <p className="text-sm text-muted-foreground">AI-scored RFQ pipeline — action hot leads first</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-600">{counts.HOT}</p>
            <p className="text-xs text-red-600/80 font-medium">HOT — Action Required</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{counts.WARM}</p>
            <p className="text-xs text-amber-600/80 font-medium">WARM — Follow Up</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{counts.COLD}</p>
            <p className="text-xs text-blue-600/80 font-medium">COLD — Auto-Nurture</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="HOT" className="gap-1"><Flame className="h-3 w-3" /> HOT ({counts.HOT})</TabsTrigger>
          <TabsTrigger value="WARM" className="gap-1"><ThermometerSun className="h-3 w-3" /> WARM ({counts.WARM})</TabsTrigger>
          <TabsTrigger value="COLD" className="gap-1"><Snowflake className="h-3 w-3" /> COLD ({counts.COLD})</TabsTrigger>
        </TabsList>

        {['HOT', 'WARM', 'COLD'].map(tier => (
          <TabsContent key={tier} value={tier} className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No {tier} leads yet</CardContent></Card>
            ) : (
              filtered.map(lead => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {scoreBadge(lead.lead_score)}
                          <Badge variant="outline" className="text-xs">{lead.confidence_score}% confidence</Badge>
                          {lead.category_slug && <Badge variant="secondary" className="text-xs gap-1"><Package className="h-3 w-3" />{lead.category_slug}</Badge>}
                          {lead.trade_type && <Badge variant="outline" className="text-xs">{lead.trade_type}</Badge>}
                          {lead.latest_action && (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                              {lead.latest_action === 'assign_sales' ? '✓ Assigned' :
                               lead.latest_action === 'mark_contacted' ? '✓ Contacted' :
                               '✗ Lost'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{lead.ai_reason_summary || 'No AI summary'}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {lead.buyer_company && <span className="flex items-center gap-1">{lead.buyer_company}</span>}
                          {lead.buyer_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.buyer_location}</span>}
                          {lead.estimated_deal_value && (
                            <span className="font-medium text-foreground">₹{(lead.estimated_deal_value / 100000).toFixed(1)}L est.</span>
                          )}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                        </div>
                        {lead.urgency && (
                          <p className="text-xs">
                            <span className="font-medium">Urgency:</span> {lead.urgency.replace('_', ' ')} • 
                            <span className="font-medium"> Budget:</span> {lead.budget_confidence || 'Unknown'}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm" variant="default" className="gap-1 text-xs" onClick={() => setActionDialog({ lead, type: 'assign_sales' })}>
                          <UserPlus className="h-3 w-3" /> Assign
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setActionDialog({ lead, type: 'mark_contacted' })}>
                          <Phone className="h-3 w-3" /> Contacted
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive" onClick={() => setActionDialog({ lead, type: 'mark_lost' })}>
                          <XCircle className="h-3 w-3" /> Lost
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'assign_sales' ? 'Assign to Sales' :
               actionDialog?.type === 'mark_contacted' ? 'Mark as Contacted' :
               'Mark as Lost'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog?.type === 'assign_sales' && (
              <div className="space-y-2">
                <Label>Assign to (name)</Label>
                <Input 
                  placeholder="Sales rep name"
                  value={actionForm.assigned_to}
                  onChange={e => setActionForm(p => ({ ...p, assigned_to: e.target.value }))}
                />
              </div>
            )}
            {actionDialog?.type === 'mark_lost' && (
              <div className="space-y-2">
                <Label>Loss Reason *</Label>
                <Select value={actionForm.loss_reason} onValueChange={v => setActionForm(p => ({ ...p, loss_reason: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {LOSS_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea 
                placeholder="Add context..."
                value={actionForm.notes}
                onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
              <Button 
                onClick={handleAction} 
                disabled={submitting || (actionDialog?.type === 'mark_lost' && !actionForm.loss_reason)}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
