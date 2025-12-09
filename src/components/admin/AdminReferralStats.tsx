import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Gift, TrendingUp, Trophy, RefreshCw } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  signedUp: number;
  rewarded: number;
  pending: number;
  conversionRate: number;
  rewardRate: number;
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
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
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
          <div className="space-y-6">
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

            {/* Top Referrers Leaderboard */}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
