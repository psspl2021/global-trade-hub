/**
 * ============================================================
 * BUYER ACTIVATION PANEL (ADMIN)
 * ============================================================
 * 
 * AI-driven buyer nudge management showing:
 * - Abandonment nudges (>30s on page, no RFQ)
 * - Partial RFQ fill nudges
 * - Multi-session engagement nudges
 * - Category suggestion nudges
 * 
 * Includes delivery tracking and conversion metrics.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Bell, 
  Loader2,
  RefreshCw,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle,
  XCircle,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface BuyerNudge {
  id: string;
  user_id: string | null;
  session_id: string | null;
  nudge_type: string;
  trigger_reason: string;
  category: string | null;
  country: string | null;
  page_url: string | null;
  time_on_page_seconds: number | null;
  nudge_content: {
    title?: string;
    message?: string;
    cta?: string;
    category?: string;
  } | null;
  is_delivered: boolean;
  delivered_at: string | null;
  delivery_channel: string | null;
  is_converted: boolean;
  converted_at: string | null;
  created_at: string;
}

const nudgeTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  abandonment: { 
    label: 'Abandonment', 
    icon: <Clock className="h-4 w-4" />, 
    color: 'bg-amber-100 text-amber-800' 
  },
  partial_rfq: { 
    label: 'Partial RFQ', 
    icon: <Target className="h-4 w-4" />, 
    color: 'bg-blue-100 text-blue-800' 
  },
  multi_session: { 
    label: 'Multi-Session', 
    icon: <Users className="h-4 w-4" />, 
    color: 'bg-purple-100 text-purple-800' 
  },
  category_suggestion: { 
    label: 'Category Suggestion', 
    icon: <TrendingUp className="h-4 w-4" />, 
    color: 'bg-green-100 text-green-800' 
  }
};

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  push: <Smartphone className="h-4 w-4" />,
  in_app: <MessageSquare className="h-4 w-4" />
};

export function BuyerActivationPanel() {
  const [nudges, setNudges] = useState<BuyerNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgeTypeFilter, setNudgeTypeFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  const fetchNudges = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('buyer_nudges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (nudgeTypeFilter !== 'all') {
        query = query.eq('nudge_type', nudgeTypeFilter);
      }
      if (deliveryFilter === 'delivered') {
        query = query.eq('is_delivered', true);
      } else if (deliveryFilter === 'pending') {
        query = query.eq('is_delivered', false);
      } else if (deliveryFilter === 'converted') {
        query = query.eq('is_converted', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNudges((data || []) as BuyerNudge[]);
    } catch (err) {
      console.error('[BuyerActivationPanel] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [nudgeTypeFilter, deliveryFilter]);

  useEffect(() => {
    fetchNudges();
  }, [fetchNudges]);

  // Mark nudge as delivered
  const markDelivered = async (nudgeId: string, channel: string) => {
    try {
      const { error } = await supabase
        .from('buyer_nudges')
        .update({ 
          is_delivered: true, 
          delivered_at: new Date().toISOString(),
          delivery_channel: channel
        })
        .eq('id', nudgeId);

      if (error) throw error;
      toast.success('Nudge marked as delivered');
      fetchNudges();
    } catch (err) {
      console.error('[BuyerActivationPanel] Delivery error:', err);
      toast.error('Failed to update nudge');
    }
  };

  // Summary stats
  const totalNudges = nudges.length;
  const deliveredCount = nudges.filter(n => n.is_delivered).length;
  const convertedCount = nudges.filter(n => n.is_converted).length;
  const conversionRate = deliveredCount > 0 
    ? Math.round((convertedCount / deliveredCount) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Buyer Activation Engine
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            AI-triggered nudges for buyer re-engagement
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchNudges} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <Select value={nudgeTypeFilter} onValueChange={setNudgeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="abandonment">Abandonment</SelectItem>
                <SelectItem value="partial_rfq">Partial RFQ</SelectItem>
                <SelectItem value="multi_session">Multi-Session</SelectItem>
                <SelectItem value="category_suggestion">Category Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">Total Nudges</div>
            <div className="text-2xl font-bold text-blue-800">{totalNudges}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">Delivered</div>
            <div className="text-2xl font-bold text-green-800">{deliveredCount}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-1">Converted</div>
            <div className="text-2xl font-bold text-purple-800">{convertedCount}</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-sm font-medium text-amber-700 mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-amber-800">{conversionRate}%</div>
          </div>
        </div>

        {/* Nudges Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : nudges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No buyer nudges generated yet</p>
            <p className="text-sm mt-1">Nudges are triggered by user behavior patterns</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-center">Time on Page</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Channel</TableHead>
                <TableHead className="text-center">Converted</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nudges.map((nudge) => {
                const typeConfig = nudgeTypeConfig[nudge.nudge_type] || {
                  label: nudge.nudge_type,
                  icon: <Bell className="h-4 w-4" />,
                  color: 'bg-gray-100 text-gray-800'
                };
                
                return (
                  <TableRow key={nudge.id}>
                    <TableCell>
                      <Badge className={typeConfig.color}>
                        {typeConfig.icon}
                        <span className="ml-1">{typeConfig.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {nudge.category || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {nudge.trigger_reason}
                    </TableCell>
                    <TableCell className="text-center">
                      {nudge.time_on_page_seconds ? `${nudge.time_on_page_seconds}s` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {nudge.is_delivered ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {nudge.delivery_channel ? (
                        <div className="flex items-center justify-center gap-1">
                          {channelIcons[nudge.delivery_channel] || null}
                          <span className="text-sm capitalize">{nudge.delivery_channel}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {nudge.is_converted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!nudge.is_delivered && (
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markDelivered(nudge.id, 'email')}
                            title="Mark as delivered via email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markDelivered(nudge.id, 'in_app')}
                            title="Mark as delivered in-app"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default BuyerActivationPanel;
