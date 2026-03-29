import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, RefreshCw, Phone, Mail, Calendar, Shield, CheckCircle2, XCircle, Clock, Download, AlertTriangle, MessageSquare, Zap, TrendingUp, Target, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface AffiliateUser {
  id: string;
  contact_person: string;
  company_name: string;
  email: string;
  phone: string;
  created_at: string;
  last_referral_at: string | null;
  last_nudged_at: string | null;
  last_nudge_type: string | null;
  gstin: string | null;
  address: string | null;
  kyc_verified: boolean | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  affiliate_status: string | null;
  affiliate_joined_at: string | null;
  eligibility_kyc: boolean | null;
  commission_tier: string | null;
  total_referrals: number;
  signed_up_referrals: number;
  rewarded_referrals: number;
  activation_score: number;
  missed_revenue: number;
}

const AVG_COMMISSION = 500; // ₹500 average commission per conversion

const getActivationScore = (total: number, signedUp: number, rewarded: number) =>
  (total * 2) + (signedUp * 3) + (rewarded * 5);

const getScoreLabel = (score: number) => {
  if (score === 0) return { label: 'Inactive', emoji: '❌', variant: 'destructive-soft' as const };
  if (score <= 5) return { label: 'Starting', emoji: '🟡', variant: 'warning-soft' as const };
  if (score <= 15) return { label: 'Growing', emoji: '🔵', variant: 'primary-soft' as const };
  return { label: 'Power', emoji: '🟢', variant: 'success-soft' as const };
};

const getSegmentPriority = (user: AffiliateUser) => {
  if (user.total_referrals === 0) return 0;
  if (user.rewarded_referrals === 0) return 1;
  return 2;
};

const getNudgeMessage = (user: AffiliateUser) => {
  if (user.total_referrals === 0) {
    return `Hi ${user.contact_person}, you can start earning by inviting suppliers. Share your referral link with just 5 contacts to unlock your first commission. It takes 30 seconds!`;
  }
  if (user.rewarded_referrals === 0) {
    return `Hi ${user.contact_person}, you're close! You've invited ${user.total_referrals} supplier(s) — help them complete signup to earn your commission. Guide them through the process!`;
  }
  return `Hi ${user.contact_person}, great work earning commissions! Scale this further — invite 10 more suppliers to unlock higher commission tiers and maximize your earnings.`;
};

const TodayActionPanel = ({ users }: { users: AffiliateUser[] }) => {
  const toActivate = users.filter(u => u.total_referrals === 0);
  const almostConverted = users.filter(u => u.total_referrals > 0 && u.rewarded_referrals === 0);
  const topPerformers = users.filter(u => u.rewarded_referrals >= 2);
  const totalMissedRevenue = users.reduce((sum, u) => sum + u.missed_revenue, 0);

  if (users.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 mb-4">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Today's Focus</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {toActivate.length > 0 && (
            <div className="flex items-start gap-2 bg-background rounded-lg p-3 border">
              <span className="text-lg">🟡</span>
              <div>
                <p className="text-sm font-medium">{toActivate.length} to activate</p>
                <p className="text-xs text-muted-foreground">
                  ₹{(toActivate.length * AVG_COMMISSION * 3).toLocaleString('en-IN')} potential
                </p>
              </div>
            </div>
          )}
          {almostConverted.length > 0 && (
            <div className="flex items-start gap-2 bg-background rounded-lg p-3 border">
              <span className="text-lg">🔵</span>
              <div>
                <p className="text-sm font-medium">{almostConverted.length} close to conversion</p>
                <p className="text-xs text-muted-foreground">Guide to first order</p>
              </div>
            </div>
          )}
          {topPerformers.length > 0 && (
            <div className="flex items-start gap-2 bg-background rounded-lg p-3 border">
              <span className="text-lg">🟢</span>
              <div>
                <p className="text-sm font-medium">{topPerformers.length} to scale</p>
                <p className="text-xs text-muted-foreground">Top performers — push higher</p>
              </div>
            </div>
          )}
          {totalMissedRevenue > 0 && (
            <div className="flex items-start gap-2 bg-destructive/10 rounded-lg p-3 border border-destructive/20">
              <IndianRupee className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">₹{totalMissedRevenue.toLocaleString('en-IN')} missed</p>
                <p className="text-xs text-muted-foreground">Revenue left on table</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AffiliateUsersBoard = () => {
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliateUsers = async () => {
    setLoading(true);
    try {
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'affiliate');

      if (roleError) throw roleError;
      if (!roleRows || roleRows.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const userIds = roleRows.map(r => r.user_id);

      const [profilesRes, affiliatesRes, eligibilityRes, referralsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, contact_person, company_name, email, phone, created_at, gstin, address, kyc_verified, bank_name, bank_account_number, bank_ifsc_code')
          .in('id', userIds),
      supabase
          .from('affiliates')
          .select('user_id, status, joined_at, activated_at, updated_at, last_nudged_at, last_nudge_type')
          .in('user_id', userIds),
        supabase
          .from('affiliate_eligibility')
          .select('user_id, kyc_verified, commission_tier')
          .in('user_id', userIds),
        supabase
          .from('referrals')
          .select('referrer_id, status, created_at')
          .in('referrer_id', userIds),
      ]);

      const profiles = profilesRes.data || [];
      const affiliates = affiliatesRes.data || [];
      const eligibility = eligibilityRes.data || [];
      const referrals = referralsRes.data || [];

      const refStats = new Map<string, { total: number; signedUp: number; rewarded: number; lastReferralAt: string | null }>();
      referrals.forEach(r => {
        const s = refStats.get(r.referrer_id) || { total: 0, signedUp: 0, rewarded: 0, lastReferralAt: null };
        s.total++;
        if (r.status === 'signed_up' || r.status === 'rewarded') s.signedUp++;
        if (r.status === 'rewarded') s.rewarded++;
        if (!s.lastReferralAt || (r.created_at && r.created_at > s.lastReferralAt)) {
          s.lastReferralAt = r.created_at;
        }
        refStats.set(r.referrer_id, s);
      });

      const result: AffiliateUser[] = userIds.map(uid => {
        const profile = profiles.find(p => p.id === uid);
        const aff = affiliates.find(a => a.user_id === uid);
        const elig = eligibility.find(e => e.user_id === uid);
        const stats = refStats.get(uid) || { total: 0, signedUp: 0, rewarded: 0, lastReferralAt: null };
        const missedRevenue = (stats.total - stats.rewarded) * AVG_COMMISSION;

        return {
          id: uid,
          contact_person: profile?.contact_person || 'Unknown',
          company_name: profile?.company_name || '—',
          email: profile?.email || '—',
          phone: profile?.phone || '—',
          created_at: profile?.created_at || '',
          last_referral_at: stats.lastReferralAt,
          last_nudged_at: (aff as any)?.last_nudged_at || null,
          last_nudge_type: (aff as any)?.last_nudge_type || null,
          gstin: profile?.gstin || null,
          address: profile?.address || null,
          kyc_verified: profile?.kyc_verified || null,
          bank_name: profile?.bank_name || null,
          bank_account_number: profile?.bank_account_number || null,
          bank_ifsc_code: profile?.bank_ifsc_code || null,
          affiliate_status: aff?.status || 'ACTIVE',
          affiliate_joined_at: aff?.joined_at || profile?.created_at || null,
          eligibility_kyc: elig?.kyc_verified || null,
          commission_tier: elig?.commission_tier || null,
          total_referrals: stats.total,
          signed_up_referrals: stats.signedUp,
          rewarded_referrals: stats.rewarded,
          activation_score: getActivationScore(stats.total, stats.signedUp, stats.rewarded),
          missed_revenue: missedRevenue > 0 ? missedRevenue : 0,
        };
      });

      result.sort((a, b) => {
        const pa = getSegmentPriority(a);
        const pb = getSegmentPriority(b);
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(result);
    } catch (error) {
      console.error('[AffiliateUsersBoard] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateUsers();
  }, []);

  const exportCSV = () => {
    if (!users.length) return;
    const rows = users.map(u => ({
      Name: u.contact_person,
      Company: u.company_name,
      Email: u.email,
      Phone: u.phone,
      'Joined At': u.affiliate_joined_at ? format(new Date(u.affiliate_joined_at), 'yyyy-MM-dd') : '—',
      'Last Active': u.last_referral_at ? format(new Date(u.last_referral_at), 'yyyy-MM-dd') : 'Never',
      Status: u.affiliate_status || '—',
      'Activation Score': u.activation_score,
      'Missed Revenue': u.missed_revenue,
      GSTIN: u.gstin || '—',
      'KYC Verified': u.kyc_verified ? 'Yes' : 'No',
      'Bank Name': u.bank_name || '—',
      'Account No': u.bank_account_number || '—',
      IFSC: u.bank_ifsc_code || '—',
      'Commission Tier': u.commission_tier || '—',
      'Total Referrals': u.total_referrals,
      'Signed Up': u.signed_up_referrals,
      Rewarded: u.rewarded_referrals,
    }));
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-users-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSegmentBadge = (user: AffiliateUser) => {
    if (user.rewarded_referrals > 0) return <Badge variant="success-soft" className="text-xs gap-1">🟢 Earning</Badge>;
    if (user.total_referrals > 0) return <Badge variant="primary-soft" className="text-xs gap-1">🔵 Trying</Badge>;
    return <Badge variant="warning-soft" className="text-xs gap-1">🟡 New</Badge>;
  };

  const handleNudge = (user: AffiliateUser) => {
    const message = getNudgeMessage(user);
    if (user.phone && user.phone !== '—') {
      const cleanPhone = user.phone.replace(/\D/g, '');
      let number = cleanPhone;
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        number = cleanPhone;
      } else if (cleanPhone.length === 10) {
        number = `91${cleanPhone}`;
      }
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Nudge message copied to clipboard');
    }
  };

  const handleNudgeAllInactive = () => {
    const inactive = users.filter(u => u.total_referrals === 0);
    if (inactive.length === 0) {
      toast.info('No inactive affiliates found');
      return;
    }
    const messages = inactive.map(u => `→ ${u.contact_person} (${u.phone || u.email}): ${getNudgeMessage(u)}`).join('\n\n');
    navigator.clipboard.writeText(messages);
    toast.success(`Nudge messages for ${inactive.length} inactive affiliates copied to clipboard`);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="active" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'PENDING': return <Badge variant="pending" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'WAITLISTED': return <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Waitlisted</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status || 'Active'}</Badge>;
    }
  };

  const getKYCBadge = (kyc: boolean | null, eligKyc: boolean | null) => {
    const verified = kyc || eligKyc;
    if (verified) return <Badge variant="success-soft" className="text-xs gap-1"><Shield className="h-3 w-3" />Verified</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground gap-1"><XCircle className="h-3 w-3" />Pending</Badge>;
  };

  const getLastActive = (user: AffiliateUser) => {
    const date = user.last_referral_at || null;
    if (!date) return <span className="text-muted-foreground text-xs">Never</span>;
    try {
      return (
        <span className="text-xs">{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>
      );
    } catch {
      return <span className="text-muted-foreground text-xs">—</span>;
    }
  };

  const inactiveCount = users.filter(u => u.total_referrals === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TodayActionPanel users={users} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Affiliate Users ({users.length})
          </CardTitle>
          <div className="flex gap-2">
            {inactiveCount > 0 && (
              <Button variant="warning" size="sm" onClick={handleNudgeAllInactive} className="gap-1">
                <Zap className="h-4 w-4" />
                Nudge {inactiveCount} Inactive
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAffiliateUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No affiliate users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name / Company</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead className="text-center">Referrals</TableHead>
                    <TableHead className="text-center">Signed Up</TableHead>
                    <TableHead className="text-center">Rewarded</TableHead>
                    <TableHead className="text-right">Missed ₹</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const scoreInfo = getScoreLabel(user.activation_score);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="text-muted-foreground font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.contact_person}</p>
                            <p className="text-sm text-muted-foreground">{user.company_name}</p>
                            {user.total_referrals === 0 && (
                              <p className="text-xs text-warning flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                Not started — hasn't invited any suppliers yet
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getSegmentBadge(user)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant={scoreInfo.variant} className="text-xs gap-1">
                              {scoreInfo.emoji} {user.activation_score}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{scoreInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[180px]">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{user.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {getLastActive(user)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.affiliate_status)}</TableCell>
                        <TableCell>{getKYCBadge(user.kyc_verified, user.eligibility_kyc)}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">GSTIN:</span>
                              <span className={user.gstin ? 'font-medium' : 'text-muted-foreground'}>{user.gstin || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Bank:</span>
                              <span className={user.bank_name ? 'font-medium' : 'text-muted-foreground'}>
                                {user.bank_name ? `${user.bank_name} (${user.bank_ifsc_code || '—'})` : 'Not linked'}
                              </span>
                            </div>
                            {user.commission_tier && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Tier:</span>
                                <Badge variant="outline" className="text-xs px-1.5 py-0">{user.commission_tier}</Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{user.total_referrals}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{user.signed_up_referrals}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="success-soft">{user.rewarded_referrals}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.missed_revenue > 0 ? (
                            <span className="text-sm font-semibold text-destructive">
                              ₹{user.missed_revenue.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleNudge(user)} className="gap-1 text-xs">
                            <MessageSquare className="h-3 w-3" />
                            {user.total_referrals === 0 ? 'Activate' : user.rewarded_referrals === 0 ? 'Guide' : 'Scale'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
