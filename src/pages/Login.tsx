import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { loginSchema, resetEmailSchema } from '@/lib/validations';
import { TOTPVerification } from '@/components/auth/TOTPVerification';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import authBg from '@/assets/auth-bg.jpg';
import { useSEO } from '@/hooks/useSEO';

import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [resetErrors, setResetErrors] = useState<{ email?: string }>({});
  const [showTOTPVerification, setShowTOTPVerification] = useState(false);
  const [checkingTOTP, setCheckingTOTP] = useState(false);

  useSEO({
    title: "Login | ProcureSaathi B2B Platform",
    description: "Sign in to your ProcureSaathi account. Access your dashboard, manage requirements, and connect with verified B2B partners.",
    canonical: "https://procuresaathi.com/login"
  });

  useEffect(() => {
    if (user && !showTOTPVerification && !checkingTOTP) {
      checkTOTPStatus();
    }
  }, [user, showTOTPVerification, checkingTOTP]);

  const checkTOTPStatus = async () => {
    if (!user) return;
    
    setCheckingTOTP(true);
    try {
      const { data: totpData } = await supabase
        .from('user_totp_secrets')
        .select('is_enabled')
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .maybeSingle();

      if (totpData?.is_enabled) {
        setShowTOTPVerification(true);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    } finally {
      setCheckingTOTP(false);
    }
  };

  const handleTOTPSuccess = () => {
    setShowTOTPVerification(false);
    navigate('/dashboard');
  };

  const handleTOTPCancel = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setShowTOTPVerification(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    await signIn(result.data.email, result.data.password);
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrors({});
    
    const result = resetEmailSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setResetErrors(fieldErrors);
      return;
    }

    setResetLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset-brevo', {
        body: { 
          email: result.data.email,
          redirectUrl: `${window.location.origin}/reset-password`
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to send reset email');
      }

      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading || checkingTOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }} />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  // Show TOTP verification screen
  if (showTOTPVerification && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }} />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="w-full max-w-md relative z-10">
          <Link to="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
            <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-20 sm:h-32 w-auto object-contain" />
          </Link>
          <TOTPVerification onSuccess={handleTOTPSuccess} onCancel={handleTOTPCancel} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBg})` }} />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-20 sm:h-32 w-auto object-contain" />
        </Link>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your ProcureSaathi account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="px-0 h-auto text-sm text-muted-foreground">
                        Forgot password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="you@company.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className={resetErrors.email ? 'border-destructive' : ''}
                          />
                          {resetErrors.email && (
                            <p className="text-sm text-destructive">{resetErrors.email}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full" disabled={resetLoading}>
                          {resetLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;