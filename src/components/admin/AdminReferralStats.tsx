import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Gift, TrendingUp, Trophy, RefreshCw, IndianRupee, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ReferralStats {
  totalReferrals: number;
  signedUp: number;
  rewarded: number;
  pending: number;
  conversionRate: number;
  rewardRate: number;
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

interface AdminReferralStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminReferralStats = ({ open, onOpenChange }: AdminReferralStatsProps) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [payoutStats, setPayoutStats] = useState({ totalPending: 0, totalPaid: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch all referrals
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

      // Fetch referrer profiles
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

        // Sort by total referrals descending
        topReferrersList.sort((a, b) => b.total_referrals - a.total_referrals);
        setTopReferrers(topReferrersList.slice(0, 10));
      }

      // Fetch pending commissions for payouts
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

    // Get unique referrer and referred IDs
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

    const pendingList: PendingCommission[] = (commissions || []).map(c => {
      const referrerProfile = profiles.find(p => p.id === c.referrer_id);
      const referredProfile = profiles.find(p => p.id === c.referred_id);
      return {
        id: c.id,
        referrer_id: c.referrer_id,
        referrer_company: referrerProfile?.company_name || 'Unknown',
        referrer_contact: referrerProfile?.contact_person || 'Unknown',
        referred_company: referredProfile?.company_name || 'Unknown',
        bid_amount: c.bid_amount,
        commission_amount: c.commission_amount,
        platform_fee_amount: c.platform_fee_amount || 0,
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

  const markAsPaid = async (commissionId: string) => {
    setProcessingPayout(commissionId);
    try {
      const { error } = await supabase
        .from('referral_commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: 'Payout marked as paid',
        description: 'The commission has been marked as paid successfully.',
      });

      fetchCommissions();
    } catch (error) {
      console.error('Error marking payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout status.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(null);
    }
  };

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

      toast({
        title: 'All payouts processed',
        description: `${pendingIds.length} commissions marked as paid.`,
      });

      fetchCommissions();
    } catch (error) {
      console.error('Error marking all payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payouts.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayout(null);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStats();
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
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Program Statistics
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
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
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.totalReferrals || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-full">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.signedUp || 0}</p>
                        <p className="text-sm text-muted-foreground">Signed Up</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-full">
                        <Gift className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.rewarded || 0}</p>
                        <p className="text-sm text-muted-foreground">Rewards Given</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.conversionRate.toFixed(1) || 0}%</p>
                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      </div>
                    </div>
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
                              ₹{commission.commission_amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>{getStatusBadge(commission.status)}</TableCell>
                            <TableCell className="text-center">
                              {commission.status === 'pending' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsPaid(commission.id)}
                                  disabled={processingPayout === commission.id}
                                >
                                  {processingPayout === commission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Mark Paid'
                                  )}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Completed</span>
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
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
