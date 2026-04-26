import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import authBg from '@/assets/auth-bg.jpg';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\p{Nd}/u, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, updatePassword } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    // Strategy: refresh the session FIRST so Supabase sees a "fresh" auth
    // context. This avoids the reauthentication_needed error on most
    // first-login temp-password flows without forcing a logout/login loop.
    try {
      await supabase.auth.refreshSession();
    } catch (err) {
      // Non-fatal — continue and let updateUser surface the real error.
      console.warn('refreshSession before password update failed', err);
    }

    let { error } = await updatePassword(result.data.password);

    // If still blocked by reauth window, try one more refresh + retry before
    // falling back to a forced re-login. This covers the edge case where the
    // first refresh races with token expiry.
    if (error) {
      const msg = (error as any)?.message?.toLowerCase?.() || '';
      const code = (error as any)?.code || '';
      const isReauth =
        code === 'reauthentication_needed' ||
        msg.includes('reauthentication') ||
        msg.includes('reauthenticate');

      if (isReauth) {
        try {
          await supabase.auth.refreshSession();
          const retry = await updatePassword(result.data.password);
          error = retry.error;
        } catch (err) {
          console.warn('Retry refreshSession failed', err);
        }
      }
    }

    if (error) {
      setSubmitting(false);
      const msg = (error as any)?.message?.toLowerCase?.() || '';
      const code = (error as any)?.code || '';
      const isReauth =
        code === 'reauthentication_needed' ||
        msg.includes('reauthentication') ||
        msg.includes('reauthenticate');

      if (isReauth) {
        // Last resort — session truly stale (e.g. project has secure password
        // change ON). Send the user back through login so they get a brand
        // new session, then return here.
        toast({
          title: 'Please log in again',
          description:
            'For security, log in once more with your current password, then set your new password.',
        });
        try {
          (window as any).analytics?.track?.('password_change_reauth_fallback', { user_id: user?.id });
        } catch {}
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // ignore
        }
        navigate('/login');
      } else {
        toast({
          title: 'Could not update password',
          description: (error as any)?.message || 'Please try again.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Mark the temporary-password flag as cleared so the gate stops firing.
    try {
      await supabase.auth.updateUser({
        data: { password_changed_at: new Date().toISOString(), created_by_admin: null },
      });
    } catch (err) {
      console.error('Failed to clear temp password flag', err);
    }

    try {
      (window as any).analytics?.track?.('password_change_success', { user_id: user?.id });
      // Clear loop-protection marker once the change has succeeded.
      if (user?.id) sessionStorage.removeItem(`ps_pwd_change_attempted:${user.id}`);
    } catch {}

    toast({
      title: 'Password changed',
      description: 'Your new password is active. Redirecting to your dashboard…',
    });

    // Redirect by role
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      const roles = (roleData || []).map((r) => r.role as string);
      if (roles.includes('ps_admin') || roles.includes('admin')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }} />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }} />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-6">
          <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-20 w-auto object-contain" />
        </div>
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle className="text-2xl font-display">Set a New Password</CardTitle>
            </div>
            <CardDescription>
              You're signed in with a temporary password. For your security, please choose a new
              password to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`h-11 ${errors.password ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className={`h-11 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" className="w-full h-12 font-semibold text-base" disabled={submitting}>
                {submitting ? 'Updating…' : 'Update Password & Continue'}
              </Button>
              <button
                type="button"
                onClick={async () => {
                  try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
                  navigate('/login');
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Sign out and log in again
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
