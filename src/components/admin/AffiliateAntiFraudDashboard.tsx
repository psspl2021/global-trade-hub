import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, 
  Clock, Users, Ban, Loader2, RefreshCw, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FlaggedCommission {
  id: string;
  referrer_id: string;
  referred_id: string;
  bid_id: string;
  commission_amount: number;
  fraud_score: number | null;
  fraud_flags: any;
  fraud_review_status: string | null;
  release_eligible_at: string | null;
  release_hold_reason: string | null;
  status: string;
  created_at: string;
  referrer_profile?: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    gstin: string | null;
  } | null;
  referred_profile?: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string;
    gstin: string | null;
  } | null;
}

interface RelatedParty {
  id: string;
  user_id_1: string;
  user_id_2: string;
  relationship_type: string;
  confidence_score: number;
  detected_at: string;
  is_confirmed: boolean;
  notes: string;
}

export function AffiliateAntiFraudDashboard() {
  const [flaggedCommissions, setFlaggedCommissions] = useState<FlaggedCommission[]>([]);
  const [relatedParties, setRelatedParties] = useState<RelatedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch flagged/on-hold commissions
    const { data: commissions, error: commError } = await supabase
      .from('referral_commissions')
      .select('*')
      .in('fraud_review_status', ['pending', 'flagged'])
      .order('fraud_score', { ascending: false });

    if (!commError && commissions) {
      // Enrich with profile data
      const enrichedCommissions = await Promise.all(
        commissions.map(async (comm) => {
          const [referrerRes, referredRes] = await Promise.all([
            supabase.from('profiles').select('company_name, contact_person, email, phone, gstin').eq('id', comm.referrer_id).single(),
            supabase.from('profiles').select('company_name, contact_person, email, phone, gstin').eq('id', comm.referred_id).single()
          ]);
          return {
            ...comm,
            referrer_profile: referrerRes.data,
            referred_profile: referredRes.data
          };
        })
      );
      setFlaggedCommissions(enrichedCommissions);
    }

    // Fetch related parties
    const { data: parties, error: partiesError } = await supabase
      .from('related_party_registry')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(50);

    if (!partiesError && parties) {
      setRelatedParties(parties);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewAction = async (commissionId: string, action: 'clear' | 'block') => {
    setProcessing(commissionId);
    
    const updates = action === 'clear' 
      ? { 
          fraud_review_status: 'cleared', 
          fraud_reviewed_at: new Date().toISOString(),
          status: 'pending' // Release from hold
        }
      : { 
          fraud_review_status: 'blocked', 
          fraud_reviewed_at: new Date().toISOString(),
          status: 'cancelled',
          commission_amount: 0
        };

    const { error } = await supabase
      .from('referral_commissions')
      .update(updates)
      .eq('id', commissionId);

    if (error) {
      toast.error('Failed to update commission status');
    } else {
      toast.success(`Commission ${action === 'clear' ? 'cleared' : 'blocked'} successfully`);
      fetchData();
    }
    setProcessing(null);
  };

  const getFraudSeverityBadge = (score: number) => {
    if (score >= 100) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Critical</Badge>;
    }
    if (score >= 50) {
      return <Badge className="bg-amber-500 gap-1"><AlertTriangle className="h-3 w-3" /> High</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Review</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'cleared':
        return <Badge className="bg-green-500">Cleared</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    totalFlagged: flaggedCommissions.filter(c => c.fraud_review_status === 'flagged').length,
    pendingReview: flaggedCommissions.filter(c => c.fraud_review_status === 'pending').length,
    relatedParties: relatedParties.length,
    totalAtRisk: flaggedCommissions.reduce((sum, c) => sum + c.commission_amount, 0)
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
            <Shield className="h-6 w-6 text-primary" />
            Affiliate Anti-Fraud Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor and review referral commissions for self-referral fraud
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged (Auto)</p>
                <p className="text-2xl font-bold text-destructive">{stats.totalFlagged}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Related Parties</p>
                <p className="text-2xl font-bold">{stats.relatedParties}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk Amount</p>
                <p className="text-2xl font-bold text-amber-600">
                  ₹{stats.totalAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <Ban className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Rules Alert */}
      <Alert className="border-primary/50 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertTitle>Anti-Fraud Rules Active</AlertTitle>
        <AlertDescription className="text-sm">
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Self-referral blocking:</strong> Same email, phone, GSTIN, or bank account = 100% fraud score</li>
            <li><strong>30-day cooling period:</strong> All commissions held for 30 days before payout eligibility</li>
            <li><strong>Related party detection:</strong> Same company name, address = flagged for review</li>
            <li><strong>Commission caps:</strong> ₹50,000/order, ₹5,00,000/month maximum</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="flagged">
        <TabsList>
          <TabsTrigger value="flagged" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Flagged Commissions ({flaggedCommissions.length})
          </TabsTrigger>
          <TabsTrigger value="related" className="gap-2">
            <Users className="h-4 w-4" />
            Related Parties ({relatedParties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged">
          {flaggedCommissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium text-lg">All Clear!</h3>
                <p className="text-muted-foreground">No flagged commissions requiring review.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Fraud Score</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Release Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedCommissions.map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{comm.referrer_profile?.company_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{comm.referrer_profile?.email}</p>
                          <p className="text-xs text-muted-foreground">{comm.referrer_profile?.gstin}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{comm.referred_profile?.company_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{comm.referred_profile?.email}</p>
                          <p className="text-xs text-muted-foreground">{comm.referred_profile?.gstin}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{comm.commission_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getFraudSeverityBadge(comm.fraud_score)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Array.isArray(comm.fraud_flags) && comm.fraud_flags.length > 0 ? (
                            comm.fraud_flags.slice(0, 3).map((flag: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs mr-1">
                                {flag.type?.replace('_', ' ')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Standard review</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(comm.fraud_review_status)}</TableCell>
                      <TableCell className="text-sm">
                        {comm.release_eligible_at 
                          ? format(new Date(comm.release_eligible_at), 'MMM d, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewAction(comm.id, 'clear')}
                            disabled={processing === comm.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {processing === comm.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewAction(comm.id, 'block')}
                            disabled={processing === comm.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="related">
          {relatedParties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium text-lg">No Related Parties Detected</h3>
                <p className="text-muted-foreground">The system has not detected any related party relationships.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User 1</TableHead>
                    <TableHead>User 2</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedParties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-mono text-xs">{party.user_id_1.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-xs">{party.user_id_2.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline">{party.relationship_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{party.confidence_score}%</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(party.detected_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {party.is_confirmed ? (
                          <Badge variant="destructive">Confirmed</Badge>
                        ) : (
                          <Badge variant="secondary">Suspected</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
