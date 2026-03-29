import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, RefreshCw, Phone, Mail, Calendar, Shield, CheckCircle2, XCircle, Clock, Download, AlertTriangle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AffiliateUser {
  id: string;
  contact_person: string;
  company_name: string;
  email: string;
  phone: string;
  created_at: string;
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
}

export const AffiliateUsersBoard = () => {
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAffiliateUsers = async () => {
    setLoading(true);
    try {
      // Step 1: Get all affiliate user IDs from user_roles
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

      // Step 2: Fetch profiles, affiliates registry, eligibility, and referrals in parallel
      const [profilesRes, affiliatesRes, eligibilityRes, referralsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, contact_person, company_name, email, phone, created_at, gstin, address, kyc_verified, bank_name, bank_account_number, bank_ifsc_code')
          .in('id', userIds),
        supabase
          .from('affiliates')
          .select('user_id, status, joined_at')
          .in('user_id', userIds),
        supabase
          .from('affiliate_eligibility')
          .select('user_id, kyc_verified, commission_tier')
          .in('user_id', userIds),
        supabase
          .from('referrals')
          .select('referrer_id, status')
          .in('referrer_id', userIds),
      ]);

      const profiles = profilesRes.data || [];
      const affiliates = affiliatesRes.data || [];
      const eligibility = eligibilityRes.data || [];
      const referrals = referralsRes.data || [];

      // Build referral stats map
      const refStats = new Map<string, { total: number; signedUp: number; rewarded: number }>();
      referrals.forEach(r => {
        const s = refStats.get(r.referrer_id) || { total: 0, signedUp: 0, rewarded: 0 };
        s.total++;
        if (r.status === 'signed_up' || r.status === 'rewarded') s.signedUp++;
        if (r.status === 'rewarded') s.rewarded++;
        refStats.set(r.referrer_id, s);
      });

      // Map to AffiliateUser
      const result: AffiliateUser[] = userIds.map(uid => {
        const profile = profiles.find(p => p.id === uid);
        const aff = affiliates.find(a => a.user_id === uid);
        const elig = eligibility.find(e => e.user_id === uid);
        const stats = refStats.get(uid) || { total: 0, signedUp: 0, rewarded: 0 };

        return {
          id: uid,
          contact_person: profile?.contact_person || 'Unknown',
          company_name: profile?.company_name || '—',
          email: profile?.email || '—',
          phone: profile?.phone || '—',
          created_at: profile?.created_at || '',
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
        };
      });

      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      Status: u.affiliate_status || '—',
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
    const message = `Hi ${user.contact_person}, you can start earning by inviting suppliers. Share your link with 5 contacts to unlock your first commission.`;
    if (user.phone && user.phone !== '—') {
      const cleanPhone = user.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      toast.success('Nudge message copied to clipboard');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Affiliate Users ({users.length})
        </CardTitle>
        <div className="flex gap-2">
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead className="text-center">Referrals</TableHead>
                  <TableHead className="text-center">Signed Up</TableHead>
                  <TableHead className="text-center">Rewarded</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-center">Signed Up</TableHead>
                  <TableHead className="text-center">Rewarded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
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
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {user.affiliate_joined_at
                          ? format(new Date(user.affiliate_joined_at), 'MMM d, yyyy')
                          : '—'}
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
                    <TableCell>
                      {user.total_referrals === 0 && (
                        <Button variant="outline" size="sm" onClick={() => handleNudge(user)} className="gap-1 text-xs">
                          <MessageSquare className="h-3 w-3" />
                          Send Reminder
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};