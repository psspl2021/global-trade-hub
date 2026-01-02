import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Check, Users, Gift, Loader2 } from 'lucide-react';
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

interface ReferralSectionProps {
  userId: string;
  role: 'supplier' | 'logistics_partner';
}

export const ReferralSection = ({ userId, role }: ReferralSectionProps) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const roleParam = role === 'supplier' ? 'supplier' : 'logistics_partner';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = referralCode ? `${baseUrl}/signup?role=${roleParam}&ref=${referralCode}` : '';

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferrals(data);
      if (data.length > 0) {
        setReferralCode(data[0].referral_code);
      }
    }
    setLoading(false);
  };

  const generateReferralCode = async () => {
    // Call the database function to generate a unique code
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

    // Insert the referral record
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
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalRewards = referrals.filter(r => r.status === 'rewarded').length;
  const totalSignups = referrals.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length;

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
          Refer & Earn Free Bids
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
                <li>1. Share your unique referral link with other {role === 'supplier' ? 'suppliers' : 'logistics partners'}</li>
                <li>2. When they sign up using your link, they're linked to you</li>
                <li>3. When their first bid gets accepted, you earn <strong className="text-primary">1 free bid!</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-primary">{totalSignups}</div>
            <div className="text-sm text-muted-foreground">Signups</div>
          </div>
          <div className="p-4 rounded-lg bg-card border text-center">
            <div className="text-2xl font-bold text-green-600">{totalRewards}</div>
            <div className="text-sm text-muted-foreground">Bids Earned</div>
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

        {/* Referrals Table */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Your Referrals</h4>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
