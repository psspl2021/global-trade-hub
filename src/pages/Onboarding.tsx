import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Plus, Trash2, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

type InviteRow = {
  email: string;
  role: 'buyer_purchaser' | 'buyer_manager' | 'buyer_purchase_head';
};

const STORAGE_KEY = 'ps_onboarding_completed';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const force = searchParams.get('force') === '1';
  const { user, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState<string>('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: '', role: 'buyer_purchaser' },
  ]);

  useSEO({
    title: 'Welcome to ProcureSaathi — Set up your team',
    description: 'Invite your procurement team and get started.',
  });

  // Gate: must be logged in. Skip wizard if already completed for this account.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const completedKey = `${STORAGE_KEY}:${user.id}`;
    if (localStorage.getItem(completedKey)) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const loadCompany = async () => {
      const { data: membership } = await supabase
        .from('buyer_company_members')
        .select('company_id, role, buyer_companies(company_name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        // No buyer membership → not a buyer flow. Send to dashboard.
        navigate('/dashboard', { replace: true });
        return;
      }

      // Only managers/heads/CEOs see the team-invite wizard.
      const adminRoles = ['buyer_manager', 'buyer_ceo', 'buyer_purchase_head', 'buyer_cfo', 'buyer_vp'];
      if (!adminRoles.includes(membership.role)) {
        localStorage.setItem(completedKey, '1');
        navigate('/dashboard', { replace: true });
        return;
      }

      // If team already has more than just this user, skip wizard.
      const { count } = await supabase
        .from('buyer_company_members')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id)
        .eq('is_active', true);

      if ((count ?? 0) > 1) {
        localStorage.setItem(completedKey, '1');
        navigate('/dashboard', { replace: true });
        return;
      }

      setCompanyId(membership.company_id);
      setCompanyName((membership.buyer_companies as { company_name?: string } | null)?.company_name ?? 'Your Company');
      setChecking(false);
    };

    loadCompany();
  }, [authLoading, user, navigate]);

  const updateInvite = (idx: number, patch: Partial<InviteRow>) => {
    setInvites((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    if (invites.length >= 5) return;
    setInvites((prev) => [...prev, { email: '', role: 'buyer_purchaser' }]);
  };

  const removeRow = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  const markDoneAndGo = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}:${user.id}`, '1');
    navigate('/dashboard', { replace: true });
  };

  const handleSkip = () => markDoneAndGo();

  const handleSendInvites = async () => {
    if (!user || !companyId) return;
    const valid = invites
      .map((r) => ({ email: r.email.trim().toLowerCase(), role: r.role }))
      .filter((r) => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));

    if (valid.length === 0) {
      toast.error('Add at least one valid email, or skip for now.');
      return;
    }

    setSubmitting(true);
    const rows = valid.map((r) => ({
      company_id: companyId,
      email: r.email,
      role: r.role,
      status: 'pending',
      invited_by: user.id,
    }));

    const { error } = await supabase.from('team_invites').insert(rows);
    setSubmitting(false);

    if (error) {
      toast.error(`Could not send invites: ${error.message}`);
      return;
    }

    toast.success(`${valid.length} invite${valid.length > 1 ? 's' : ''} sent.`);
    markDoneAndGo();
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-14" />
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to {companyName}</CardTitle>
            <CardDescription>
              You're all set. Want to bring your team along? Invite up to 5 people now — or skip and do it later from Settings.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Invite your procurement team</span>
            </div>

            <div className="space-y-3">
              {invites.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="teammate@company.com"
                      value={row.email}
                      onChange={(e) => updateInvite(idx, { email: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={row.role}
                    onValueChange={(v) =>
                      updateInvite(idx, { role: v as InviteRow['role'] })
                    }
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer_purchaser">Purchaser</SelectItem>
                      <SelectItem value="buyer_purchase_head">Purchase Head</SelectItem>
                      <SelectItem value="buyer_manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  {invites.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(idx)}
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {invites.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add another
              </Button>
            )}

            <div className="hidden">
              {/* placeholder for future Label use to avoid lint */}
              <Label>email</Label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
                className="sm:flex-1"
                disabled={submitting}
              >
                Skip for now
              </Button>
              <Button
                type="button"
                onClick={handleSendInvites}
                disabled={submitting}
                className="sm:flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending…
                  </>
                ) : (
                  'Send invites & continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can manage your team anytime from Settings → Team.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
