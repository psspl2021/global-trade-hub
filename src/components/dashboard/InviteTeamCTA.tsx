import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, X, ArrowRight } from 'lucide-react';

const DISMISS_KEY_PREFIX = 'ps_invite_cta_dismissed';
const ADMIN_ROLES = new Set([
  'buyer_manager',
  'buyer_ceo',
  'buyer_purchase_head',
  'buyer_cfo',
  'buyer_vp',
]);

/**
 * Persistent dashboard banner that nudges solo buyer-admins to invite
 * their team. Self-gated: only renders when ALL of these hold:
 *   - user is logged in
 *   - has an active buyer_company_members row with an admin-tier role
 *   - they are the only active member of that company
 *   - they haven't dismissed the banner yet (per-user localStorage key)
 *
 * Visibility is computed client-side so the banner disappears the moment
 * a teammate joins — no manual refresh needed once they re-load the page.
 */
const InviteTeamCTA = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dismissKey = `${DISMISS_KEY_PREFIX}:${user.id}`;
    if (localStorage.getItem(dismissKey)) return;

    let cancelled = false;

    (async () => {
      const { data: membership } = await supabase
        .from('buyer_company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (cancelled || !membership || !ADMIN_ROLES.has(membership.role)) return;

      const { count } = await supabase
        .from('buyer_company_members')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', membership.company_id)
        .eq('is_active', true);

      if (!cancelled && (count ?? 0) <= 1) {
        setVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!visible) return null;

  const handleDismiss = () => {
    if (user) localStorage.setItem(`${DISMISS_KEY_PREFIX}:${user.id}`, '1');
    setVisible(false);
  };

  return (
    <Card className="mb-4 sm:mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-semibold text-foreground">
            Bring your team on board
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Invite your procurement team to collaborate on RFQs and approvals.
          </p>
        </div>
        <Button asChild size="sm" className="gap-1 shrink-0">
          <Link to="/onboarding">
            Invite team
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="h-8 w-8 shrink-0 text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default InviteTeamCTA;
