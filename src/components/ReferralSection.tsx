import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Users, Gift, Loader2, IndianRupee, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  signed_up_at: string | null;
  rewarded_at: string | null;
  referred_id: string | null;
}

interface ReferralCommission {
  id: string;
  bid_id: string;
  referred_id: string;
  bid_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  referral_share_percentage: number;
  commission_percentage: number;
  commission_amount: number;
  platform_net_revenue: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  // Calculated fields
  dispatched_qty?: number;
  calculated_commission?: number;
  calculated_platform_fee?: number;
}

interface ReferralSectionProps {
  userId: string;
  role: 'supplier' | 'logistics_partner' | 'buyer' | 'affiliate';
}

export const ReferralSection = ({ userId, role }: ReferralSectionProps) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const roleParam = role === 'affiliate' ? 'supplier' : role;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/signup?role=${roleParam}&ref=${referralCode}` : '';
  const roleLabel = role === 'buyer' ? 'buyers' : role === 'affiliate' ? 'suppliers or logistics partners' : `${role}s`.replace('_', ' ');

  const fetchReferrals = async () => {
    setLoading(true);
    
    // Fetch referrals and commissions in parallel
    const [referralsResult, commissionsResult] = await Promise.all([
      supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('referral_commissions')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
    ]);

    if (!referralsResult.error && referralsResult.data) {
      setReferrals(referralsResult.data);
      if (referralsResult.data.length > 0) {
        setReferralCode(referralsResult.data[0].referral_code);
      }
    }
    
    if (!commissionsResult.error && commissionsResult.data) {
      // Fetch bid details for accurate commission calculation
      const bidIds = [...new Set(commissionsResult.data.map(c => c.bid_id))];
      let bids: { id: string; dispatched_qty: number | null }[] = [];
      
      if (bidIds.length > 0) {
        const { data: bidData } = await supabase
          .from('bids')
          .select('id, dispatched_qty')
          .in('id', bidIds);
        bids = bidData || [];
      }
      
      // Calculate proper commission based on dispatched qty
      const commissionsWithCalculation = commissionsResult.data.map(c => {
        const bid = bids.find(b => b.id === c.bid_id);
        const platformFeePerTon = c.platform_fee_amount || 220;
        const dispatchedQty = bid?.dispatched_qty || 0;
        const totalPlatformFee = platformFeePerTon * dispatchedQty;
        const referralSharePercentage = c.referral_share_percentage || 20;
        const calculatedCommission = totalPlatformFee * (referralSharePercentage / 100);
        
        return {
          ...c,
          dispatched_qty: dispatchedQty,
          calculated_commission: calculatedCommission,
          calculated_platform_fee: totalPlatformFee,
        };
      });
      
      setCommissions(commissionsWithCalculation as ReferralCommission[]);
    }
    
    setLoading(false);
  };

  const generateReferralCode = async () => {
    const { data: codeData, error: codeError } = await supabase.rpc('generate_referral_code', { 
      user_id: userId 
    });

    if (codeError) {
      toast({
        title: 'Error generating code',
        description: codeError.message,
        variant: 'destructive',
      });
      return;
    }

    const newCode = codeData as string;

    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: userId,
        referral_code: newCode,
      });

    if (insertError) {
      toast({
        title: 'Error creating referral',
        description: insertError.message,
        variant: 'destructive',
      });
      return;
    }

    setReferralCode(newCode);
    fetchReferrals();
    toast({
      title: 'Referral code created!',
      description: 'Share your unique link to earn free bids.',
    });
  };

  useEffect(() => {
    fetchReferrals();
  }, [userId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'signed_up':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Signed Up</Badge>;
      case 'rewarded':
        return <Badge className="bg-green-500 hover:bg-green-600">Rewarded</Badge>;
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalRewards = referrals.filter(r => r.status === 'rewarded').length;
  const totalSignups = referrals.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length;
  const totalCommissionEarned = commissions.reduce((sum, c) => sum + (c.calculated_commission || 0), 0);
  const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.calculated_commission || 0), 0);
  const paidCommission = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.calculated_commission || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Refer & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Section */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border">
          <div className="flex items-start gap-3">
            <Gift className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">How it works</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>1. Share your unique referral link with {roleLabel}</li>
                <li>2. When they sign up using your link, they're linked to you</li>
                {role !== 'buyer' && <li>3. When their first bid gets accepted, you earn <strong className="text-primary">1 free bid!</strong></li>}
                <li>{role === 'buyer' ? '3' : '4'}. Earn <strong className="text-primary">20% of platform fees</strong> on every order they {role === 'buyer' ? 'place' : 'win'}!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-primary">{totalSignups}</div>
            <div className="text-sm text-muted-foreground">Signups</div>
          </div>
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-green-600">{totalRewards}</div>
            <div className="text-sm text-muted-foreground">Bids Earned</div>
          </div>
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-amber-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
              {totalCommissionEarned.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-muted-foreground">Total Commission</div>
          </div>
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
              {pendingCommission.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-muted-foreground">Pending Payout</div>
          </div>
        </div>

        {/* Referral Link */}
        {referralCode ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Referral Link</label>
            <div className="flex gap-2">
              <Input value={`/signup?role=${roleParam}&ref=${referralCode}`} readOnly className="font-mono text-sm" />
              <Button onClick={copyToClipboard} variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Full URL copied when you click the copy button</p>
          </div>
        ) : (
          <Button onClick={generateReferralCode} className="w-full">
            Generate Referral Link
          </Button>
        )}

        {/* Tabs for Referrals and Commissions */}
        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
            <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="referrals">
            {referrals.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed Up</TableHead>
                      <TableHead>Rewarded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-mono text-sm">{referral.referral_code}</TableCell>
                        <TableCell>{getStatusBadge(referral.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {referral.signed_up_at ? format(new Date(referral.signed_up_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {referral.rewarded_at ? format(new Date(referral.rewarded_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No referrals yet. Share your link to get started!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="commissions">
            {commissions.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order Value</TableHead>
                      <TableHead>Dispatched Qty</TableHead>
                      <TableHead>Platform Fee</TableHead>
                      <TableHead>Your Commission (20%)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="text-sm">
                          {format(new Date(commission.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">
                          ₹{commission.bid_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {commission.dispatched_qty?.toFixed(2) || '0'} tons
                        </TableCell>
                        <TableCell className="text-sm">
                          ₹{(commission.calculated_platform_fee || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-green-600">
                          ₹{(commission.calculated_commission || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getStatusBadge(commission.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No commissions yet. Commissions are earned when your referred accounts win bids!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};