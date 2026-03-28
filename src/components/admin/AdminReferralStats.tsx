import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Gift, TrendingUp, Trophy, RefreshCw, IndianRupee, CheckCircle2, Clock, Wallet, Shield, AlertTriangle, ArrowLeft, Download, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AffiliateAntiFraudDashboard } from './AffiliateAntiFraudDashboard';

interface ReferralStats {
  totalReferrals: number;
  signedUp: number;
  rewarded: number;
  pending: number;
  conversionRate: number;
  rewardRate: number;
}

interface ReferralDetail {
  id: string;
  referrer_id: string;
  referred_id: string;
  referrer_company: string;
  referrer_contact: string;
  referred_company: string;
  referred_contact: string;
  referred_email: string;
  referred_phone: string;
  status: string;
  created_at: string;
}

interface PendingCommission {
  id: string;
  referrer_id: string;
  referrer_company: string;
  referrer_contact: string;
  referred_company: string;
  bid_amount: number;
  commission_amount: number;
  platform_fee_amount: number;
  dispatched_qty: number;
  status: string;
  created_at: string;
}

interface TopReferrer {
  referrer_id: string;
  company_name: string;
  contact_person: string;
  total_referrals: number;
  signed_up: number;
  rewarded: number;
  conversion_rate: number;
}

type DrillDownType = 'referrals' | 'signed_up' | 'rewards' | 'conversion' | null;

interface AdminReferralStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// CSV export helper
const downloadCSV = (rows: Record<string, any>[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const AdminReferralStats = ({ open, onOpenChange }: AdminReferralStatsProps) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [payoutStats, setPayoutStats] = useState({ totalPending: 0, totalPaid: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownType>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetail[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*');

      if (error) throw error;

      const total = referrals?.length || 0;
      const signedUp = referrals?.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length || 0;
      const rewarded = referrals?.filter(r => r.status === 'rewarded').length || 0;
      const pending = referrals?.filter(r => r.status === 'pending').length || 0;

      setStats({
        totalReferrals: total,
        signedUp,
        rewarded,
        pending,
        conversionRate: total > 0 ? (signedUp / total) * 100 : 0,
        rewardRate: signedUp > 0 ? (rewarded / signedUp) * 100 : 0,
      });

      // Calculate top referrers
      const referrerMap = new Map<string, { total: number; signedUp: number; rewarded: number }>();
      referrals?.forEach(ref => {
        const current = referrerMap.get(ref.referrer_id) || { total: 0, signedUp: 0, rewarded: 0 };
        current.total++;
        if (ref.status === 'signed_up' || ref.status === 'rewarded') current.signedUp++;
        if (ref.status === 'rewarded') current.rewarded++;
        referrerMap.set(ref.referrer_id, current);
      });

      const referrerIds = Array.from(referrerMap.keys());
      if (referrerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, company_name, contact_person')
          .in('id', referrerIds);

        const topReferrersList: TopReferrer[] = referrerIds.map(id => {
          const stats = referrerMap.get(id)!;
          const profile = profiles?.find(p => p.id === id);
          return {
            referrer_id: id,
            company_name: profile?.company_name || 'Unknown',
            contact_person: profile?.contact_person || 'Unknown',
            total_referrals: stats.total,
            signed_up: stats.signedUp,
            rewarded: stats.rewarded,
            conversion_rate: stats.total > 0 ? (stats.signedUp / stats.total) * 100 : 0,
          };
        });

        topReferrersList.sort((a, b) => b.total_referrals - a.total_referrals);
        setTopReferrers(topReferrersList.slice(0, 10));
      }

      await fetchCommissions();
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions:', error);
      return;
    }

    const referrerIds = [...new Set(commissions?.map(c => c.referrer_id) || [])];
    const referredIds = [...new Set(commissions?.map(c => c.referred_id) || [])];
    const allIds = [...new Set([...referrerIds, ...referredIds])];

    let profiles: { id: string; company_name: string; contact_person: string }[] = [];
    if (allIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person')
        .in('id', allIds);
      profiles = data || [];
    }

    const bidIds = [...new Set(commissions?.map(c => c.bid_id) || [])];
    let bids: { id: string; dispatched_qty: number | null }[] = [];
    if (bidIds.length > 0) {
      const { data: bidData } = await supabase
        .from('bids')
        .select('id, dispatched_qty')
        .in('id', bidIds);
      bids = bidData || [];
    }

    const pendingList: PendingCommission[] = (commissions || []).map(c => {
      const referrerProfile = profiles.find(p => p.id === c.referrer_id);
      const referredProfile = profiles.find(p => p.id === c.referred_id);
      const bid = bids.find(b => b.id === c.bid_id);
      
      return {
        id: c.id,
        referrer_id: c.referrer_id,
        referrer_company: referrerProfile?.company_name || 'Unknown',
        referrer_contact: referrerProfile?.contact_person || 'Unknown',
        referred_company: referredProfile?.company_name || 'Unknown',
        bid_amount: c.bid_amount,
        commission_amount: c.commission_amount,
        platform_fee_amount: c.platform_fee_amount * (bid?.dispatched_qty || 0),
        dispatched_qty: bid?.dispatched_qty || 0,
        status: c.status,
        created_at: c.created_at,
      };
    });

    setPendingCommissions(pendingList);

    const totalPending = pendingList
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPaid = pendingList
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission_amount, 0);
    const pendingCount = pendingList.filter(c => c.status === 'pending').length;

    setPayoutStats({ totalPending, totalPaid, count: pendingCount });
  };

  // Drill-down data fetcher
  const openDrillDown = async (type: DrillDownType) => {
    setDrillDown(type);
    setStatusFilter('all');
    setAffiliateFilter('all');
    setDrillDownLoading(true);

    try {
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allUserIds = [...new Set([
        ...(referrals?.map(r => r.referrer_id) || []),
        ...(referrals?.map(r => r.referred_id) || []),
      ])];

      let profiles: { id: string; company_name: string; contact_person: string; email: string; phone: string }[] = [];
      if (allUserIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, company_name, contact_person, email, phone')
          .in('id', allUserIds);
        profiles = data || [];
      }

      const details: ReferralDetail[] = (referrals || []).map(r => {
        const referrerProfile = profiles.find(p => p.id === r.referrer_id);
        const referredProfile = profiles.find(p => p.id === r.referred_id);
        return {
          id: r.id,
          referrer_id: r.referrer_id,
          referred_id: r.referred_id,
          referrer_company: referrerProfile?.company_name || 'Unknown',
          referrer_contact: referrerProfile?.contact_person || 'Unknown',
          referred_company: referredProfile?.company_name || 'Unknown',
          referred_contact: referredProfile?.contact_person || 'Unknown',
          referred_email: referredProfile?.email || '—',
          referred_phone: referredProfile?.phone || '—',
          status: r.status,
          created_at: r.created_at,
        };
      });

      setReferralDetails(details);
    } catch (err) {
      console.error('Error fetching drill-down data:', err);
    } finally {
      setDrillDownLoading(false);
    }
  };

  // Unique affiliates for filter dropdown
  const uniqueAffiliates = useMemo(() => {
    const map = new Map<string, string>();
    referralDetails.forEach(r => map.set(r.referrer_id, r.referrer_company));
    return Array.from(map.entries());
  }, [referralDetails]);

  // Filtered data based on drill-down type + filters
  const filteredDrillData = useMemo(() => {
    let data = [...referralDetails];

    // Type-based pre-filter
    if (drillDown === 'signed_up') {
      data = data.filter(r => r.status === 'signed_up' || r.status === 'rewarded');
    } else if (drillDown === 'rewards') {
      data = data.filter(r => r.status === 'rewarded');
    }

    // User filters
    if (statusFilter !== 'all') {
      data = data.filter(r => r.status === statusFilter);
    }
    if (affiliateFilter !== 'all') {
      data = data.filter(r => r.referrer_id === affiliateFilter);
    }

    return data;
  }, [referralDetails, drillDown, statusFilter, affiliateFilter]);

  const updateCommissionStatus = async (commissionId: string, newStatus: 'pending' | 'paid') => {
    setProcessingPayout(commissionId);
    try {
      const updateData = newStatus === 'paid' 
        ? { status: 'paid', paid_at: new Date().toISOString() }
        : { status: 'pending', paid_at: null };

      const { error } = await supabase
        .from('referral_commissions')
        .update(updateData)
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: newStatus === 'paid' ? 'Payout marked as paid' : 'Status reverted to pending',
      });

      fetchCommissions();
    } catch (error) {
      console.error('Error updating payout status:', error);
      toast({ title: 'Error', description: 'Failed to update payout status.', variant: 'destructive' });
    } finally {
      setProcessingPayout(null);
    }
  };

  const markAsPaid = (id: string) => updateCommissionStatus(id, 'paid');
  const markAsPending = (id: string) => updateCommissionStatus(id, 'pending');

  const markAllPending = async () => {
    const pendingIds = pendingCommissions.filter(c => c.status === 'pending').map(c => c.id);
    if (pendingIds.length === 0) return;

    setProcessingPayout('all');
    try {
      const { error } = await supabase
        .from('referral_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', pendingIds);

      if (error) throw error;

      toast({ title: 'All payouts processed', description: `${pendingIds.length} commissions marked as paid.` });
      fetchCommissions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process payouts.', variant: 'destructive' });
    } finally {
      setProcessingPayout(null);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStats();
      setDrillDown(null);
    }
  }, [open]);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium">#{index + 1}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'signed_up':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle2 className="h-3 w-3 mr-1" />Signed Up</Badge>;
      case 'rewarded':
        return <Badge className="bg-green-500 hover:bg-green-600"><Gift className="h-3 w-3 mr-1" />Rewarded</Badge>;
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'on_hold':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />On Hold</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const drillDownTitle: Record<string, string> = {
    referrals: 'All Referrals',
    signed_up: 'Signed Up Suppliers',
    rewards: 'Rewards Given',
    conversion: 'Conversion Funnel',
  };

  const handleExportDrill = () => {
    if (drillDown === 'conversion') return;
    const exportData = filteredDrillData.map(r => ({
      'Affiliate': r.referrer_company,
      'Affiliate Contact': r.referrer_contact,
      'Supplier': r.referred_company,
      'Email': r.referred_email,
      'Phone': r.referred_phone,
      'Status': r.status,
      'Date': format(new Date(r.created_at), 'yyyy-MM-dd'),
    }));
    downloadCSV(exportData, `${drillDown}-export-${format(new Date(), 'yyyyMMdd')}.csv`);
  };

  // Conversion funnel data
  const funnelData = useMemo(() => {
    const total = referralDetails.length;
    const signedUp = referralDetails.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length;
    const rewarded = referralDetails.filter(r => r.status === 'rewarded').length;
    return [
      { stage: 'Total Referrals', count: total, pct: 100, color: 'bg-primary' },
      { stage: 'Signed Up', count: signedUp, pct: total > 0 ? (signedUp / total) * 100 : 0, color: 'bg-blue-500' },
      { stage: 'Rewarded / Active', count: rewarded, pct: total > 0 ? (rewarded / total) * 100 : 0, color: 'bg-green-500' },
    ];
  }, [referralDetails]);

  // Render drill-down content
  const renderDrillDown = () => {
    if (drillDownLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (drillDown === 'conversion') {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {funnelData.map((stage, i) => (
              <div key={stage.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{stage.stage}</span>
                  <span className="text-muted-foreground">{stage.count} ({stage.pct.toFixed(1)}%)</span>
                </div>
                <div className="h-8 w-full bg-muted/40 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-lg transition-all duration-700 flex items-center px-3`}
                    style={{ width: `${Math.max(stage.pct, 3)}%` }}
                  >
                    <span className="text-xs font-bold text-white">{stage.count}</span>
                  </div>
                </div>
                {i < funnelData.length - 1 && (
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground">
                      ↓ {funnelData[i + 1].count > 0 && stage.count > 0
                        ? `${((funnelData[i + 1].count / stage.count) * 100).toFixed(1)}% pass-through`
                        : '0% pass-through'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Drop-off insights */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-4">
              <h4 className="font-semibold text-sm text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Drop-off Insights
              </h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• {stats?.pending || 0} referrals still pending (not yet signed up)</li>
                <li>• {(stats?.signedUp || 0) - (stats?.rewarded || 0)} signed up but not yet rewarded</li>
                <li>• Overall conversion: {stats?.conversionRate.toFixed(1)}%</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Table drill-down for referrals, signed_up, rewards
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {drillDown !== 'rewards' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed_up">Signed Up</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="Affiliate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Affiliates</SelectItem>
              {uniqueAffiliates.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredDrillData.length} records
          </span>
        </div>

        {filteredDrillData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No records found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Email / Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrillData.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.referrer_company}</p>
                      <p className="text-xs text-muted-foreground">{r.referrer_contact}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.referred_company}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_contact}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{r.referred_email}</p>
                      <p className="text-xs text-muted-foreground">{r.referred_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(r.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {drillDown ? (
              <>
                <Button variant="ghost" size="sm" className="mr-1 h-8 w-8 p-0" onClick={() => setDrillDown(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {drillDownTitle[drillDown]}
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                Referral Program Statistics
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Drill-down detail view */}
        {drillDown ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {drillDown === 'conversion' ? 'Visualize referral-to-reward journey' : 'Click to view details for each referral'}
              </p>
              {drillDown !== 'conversion' && (
                <Button variant="outline" size="sm" onClick={handleExportDrill}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
            {renderDrillDown()}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="payouts" className="relative">
                Payouts
                {payoutStats.count > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {payoutStats.count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="antifraud" className="gap-1">
                <Shield className="h-4 w-4" />
                Anti-Fraud
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Clickable Metric Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                  className="cursor-pointer group hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                  onClick={() => openDrillDown('referrals')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Referrals</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 group-hover:text-primary/70 transition-colors">Click to view details</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer group hover:shadow-lg hover:border-green-300 transition-all duration-200"
                  onClick={() => openDrillDown('signed_up')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-full">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.signedUp || 0}</p>
                          <p className="text-sm text-muted-foreground">Signed Up</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-green-500 transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 group-hover:text-green-600/70 transition-colors">Click to view details</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer group hover:shadow-lg hover:border-amber-300 transition-all duration-200"
                  onClick={() => openDrillDown('rewards')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-full">
                          <Gift className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.rewarded || 0}</p>
                          <p className="text-sm text-muted-foreground">Rewards Given</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 group-hover:text-amber-600/70 transition-colors">Click to view details</p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer group hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                  onClick={() => openDrillDown('conversion')}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full">
                          <TrendingUp className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(1) || 0}%</p>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-3 group-hover:text-blue-600/70 transition-colors">Click to view funnel</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payout Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-full">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-700 flex items-center">
                          <IndianRupee className="h-5 w-5" />
                          {payoutStats.totalPending.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-yellow-600">Pending Payouts ({payoutStats.count})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-700 flex items-center">
                          <IndianRupee className="h-5 w-5" />
                          {payoutStats.totalPaid.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-green-600">Total Paid Out</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold flex items-center">
                          <IndianRupee className="h-5 w-5" />
                          {(payoutStats.totalPending + payoutStats.totalPaid).toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-muted-foreground">Lifetime Commissions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Referrers Leaderboard
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchStats}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {topReferrers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No referrals yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Referrer</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Signed Up</TableHead>
                          <TableHead className="text-center">Rewarded</TableHead>
                          <TableHead className="text-center">Conversion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topReferrers.map((referrer, index) => (
                          <TableRow key={referrer.referrer_id} className={index < 3 ? 'bg-primary/5' : ''}>
                            <TableCell className="text-center">
                              {getRankBadge(index)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{referrer.company_name}</p>
                                <p className="text-sm text-muted-foreground">{referrer.contact_person}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{referrer.total_referrals}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{referrer.signed_up}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-green-500 hover:bg-green-600">{referrer.rewarded}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={referrer.conversion_rate >= 50 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                {referrer.conversion_rate.toFixed(0)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Commission Payouts
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchCommissions}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    {payoutStats.count > 0 && (
                      <Button 
                        size="sm" 
                        onClick={markAllPending}
                        disabled={processingPayout === 'all'}
                      >
                        {processingPayout === 'all' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Mark All as Paid
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingCommissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commissions recorded yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Referrer</TableHead>
                          <TableHead>Referred Account</TableHead>
                          <TableHead className="text-right">Order Value</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingCommissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell className="text-sm">
                              {format(new Date(commission.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{commission.referrer_company}</p>
                                <p className="text-xs text-muted-foreground">{commission.referrer_contact}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{commission.referred_company}</TableCell>
                            <TableCell className="text-right text-sm">
                              ₹{commission.bid_amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              <div className="flex flex-col items-end">
                                <span>₹{commission.commission_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                  20% of platform fee (₹{commission.platform_fee_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                            <TableCell className="text-center">
                              {commission.status === 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsPaid(commission.id)}
                                  disabled={processingPayout === commission.id}
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                  {processingPayout === commission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Mark Paid
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsPending(commission.id)}
                                  disabled={processingPayout === commission.id}
                                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                                >
                                  {processingPayout === commission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Clock className="h-4 w-4 mr-1" />
                                      Revert
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="antifraud">
              <AffiliateAntiFraudDashboard />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};