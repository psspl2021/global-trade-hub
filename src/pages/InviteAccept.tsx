import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

const InviteAccept = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch invite details. The URL param `id` may be either the new
  // unguessable `token` (uuid) or, for legacy links, the raw row id.
  // We try token first, then fall back to id so old emails keep working.
  useEffect(() => {
    if (!id) return;
    const fetchInvite = async () => {
      let { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('token', id)
        .maybeSingle();

      if (!data) {
        const fallback = await supabase
          .from('team_invites')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        data = fallback.data;
        error = fallback.error;
      }

      if (error || !data) {
        setError('This invite link is invalid or has expired.');
        setLoading(false);
        return;
      }

      if (data.status === 'accepted') {
        setError('This invitation has already been accepted.');
        setLoading(false);
        return;
      }

      // Expiry guard
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
        setError('This invitation has expired. Please ask your admin to send a new one.');
        setLoading(false);
        return;
      }

      setInvite(data);
      setLoading(false);
    };
    fetchInvite();
  }, [id]);

  // If user is logged in and invite is loaded, auto-join
  useEffect(() => {
    if (authLoading || !invite || !user) return;

    const joinCompany = async () => {
      setJoining(true);

      // Check if already a member of THIS company
      const { data: existing } = await supabase
        .from('buyer_company_members')
        .select('id')
        .eq('company_id', invite.company_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setSuccess(true);
        setJoining(false);
        setTimeout(() => navigate('/dashboard'), 1500);
        return;
      }

      // SAFETY: Block if user already belongs to ANOTHER buyer company.
      // Independent buyer accounts must not be silently absorbed into another org.
      const { data: otherMemberships } = await supabase
        .from('buyer_company_members')
        .select('id, buyer_companies(company_name)')
        .eq('user_id', user.id)
        .neq('company_id', invite.company_id)
        .limit(1);

      if (otherMemberships && otherMemberships.length > 0) {
        const otherCo = (otherMemberships[0] as any)?.buyer_companies?.company_name || 'another company';
        setError(
          `Your account already belongs to ${otherCo}. ` +
          `An account can only be part of one buyer organization. ` +
          `Please contact support if you need to switch organizations.`
        );
        setJoining(false);
        return;
      }

      // Join the company
      const { error: insertError } = await supabase
        .from('buyer_company_members')
        .insert({
          company_id: invite.company_id,
          user_id: user.id,
          role: invite.role || 'purchaser',
          is_active: true,
          assigned_categories: invite.categories || [],
        });

      if (insertError) {
        setError('Failed to join the team. Please try again.');
        setJoining(false);
        return;
      }

      // Mark invite as accepted
      await supabase
        .from('team_invites')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', invite.id);

      setSuccess(true);
      setJoining(false);
      setTimeout(() => navigate('/dashboard'), 1500);
    };

    joinCompany();
  }, [authLoading, invite, user, navigate]);

  // If not logged in and invite loaded, redirect to LOGIN (not signup)
  useEffect(() => {
    if (authLoading || loading || !invite) return;
    if (!user) {
      navigate(`/login?invite_id=${id}&email=${encodeURIComponent(invite.email)}`);
    }
  }, [authLoading, loading, invite, user, navigate, id]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="text-center space-y-4">
          <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-16 mx-auto" />
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-16 mx-auto" />
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invitation Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-16 mx-auto" />
            <CheckCircle className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">You've joined the team!</h2>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Joining team...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default InviteAccept;
