import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, Loader2, RefreshCw, CheckCircle, XCircle, 
  Clock, UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Affiliate {
  id: string;
  user_id: string;
  status: string;
  queue_position: number | null;
  joined_at: string;
  activated_at: string | null;
  created_at: string;
  profile?: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
  } | null;
}

export function AffiliateManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAffiliates = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('affiliates')
      .select('*')
      .order('queue_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching affiliates:', error);
      setLoading(false);
      return;
    }

    // Enrich with profile data
    const userIds = data?.map(a => a.user_id) || [];
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone')
        .in('id', userIds);
      profiles = profileData || [];
    }

    const enrichedAffiliates = (data || []).map(affiliate => ({
      ...affiliate,
      profile: profiles.find(p => p.id === affiliate.user_id) || null
    }));

    setAffiliates(enrichedAffiliates);
    setLoading(false);
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  // FIFO-enforced activation via RPC (bulletproof)
  const activateAffiliate = async (affiliateId: string) => {
    setProcessing(affiliateId);

    const { data, error } = await supabase.rpc('activate_affiliate_fifo', { 
      p_affiliate_id: affiliateId 
    });

    if (error) {
      toast.error('Failed to activate affiliate');
    } else if (data === 'LIMIT_REACHED') {
      toast.warning('Only 50 affiliates can be active (FIFO enforced)');
    } else {
      toast.success('Affiliate activated successfully');
      fetchAffiliates();
    }

    setProcessing(null);
  };

  // Regular status update for non-ACTIVE statuses (suspend, reject)
  // ACTIVE must ONLY come from activateAffiliate() via RPC - never direct update
  const updateStatus = async (affiliateId: string, newStatus: string) => {
    // HARD GUARD: Block direct ACTIVE status update - FIFO only
    if (newStatus === 'ACTIVE') {
      toast.error('Use FIFO activation only - direct ACTIVE not allowed');
      return;
    }

    setProcessing(affiliateId);
    
    const updates: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    if (newStatus === 'SUSPENDED' || newStatus === 'REJECTED') {
      updates.deactivated_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('affiliates')
      .update(updates)
      .eq('id', affiliateId);

    if (error) {
      toast.error('Failed to update affiliate status');
    } else {
      toast.success(`Affiliate status updated to ${newStatus}`);
      fetchAffiliates();
    }
    setProcessing(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'WAITLISTED':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Waitlisted</Badge>;
      case 'PENDING':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: affiliates.length,
    active: affiliates.filter(a => a.status === 'ACTIVE').length,
    waitlisted: affiliates.filter(a => a.status === 'WAITLISTED').length,
    pending: affiliates.filter(a => a.status === 'PENDING').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Affiliate Management (FIFO)
          </h2>
          <p className="text-muted-foreground">
            First 50 affiliates are active. Rest are waitlisted automatically.
          </p>
        </div>
        <Button onClick={fetchAffiliates} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}/50</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Waitlisted</p>
                <p className="text-2xl font-bold">{stats.waitlisted}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Slots Available</p>
                <p className="text-2xl font-bold text-primary">{Math.max(0, 50 - stats.active)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Affiliates</CardTitle>
        </CardHeader>
        <CardContent>
          {affiliates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No affiliates registered yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((affiliate, index) => (
                  <TableRow key={affiliate.id}>
                    <TableCell className="font-medium">
                      {affiliate.status === 'ACTIVE' ? affiliate.queue_position : '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{affiliate.profile?.contact_person || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{affiliate.profile?.company_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{affiliate.profile?.email || '-'}</TableCell>
                    <TableCell className="text-sm">{affiliate.profile?.phone || '-'}</TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(affiliate.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {affiliate.status !== 'ACTIVE' && affiliate.status !== 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => activateAffiliate(affiliate.id)}
                            disabled={processing === affiliate.id || stats.active >= 50}
                            className="text-green-600"
                            title={stats.active >= 50 ? 'Max 50 active affiliates (FIFO)' : 'Activate via FIFO'}
                          >
                            {processing === affiliate.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {affiliate.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(affiliate.id, 'SUSPENDED')}
                            disabled={processing === affiliate.id}
                            className="text-destructive"
                            title="Suspend"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
