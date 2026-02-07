import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { loginSchema, resetEmailSchema } from '@/lib/validations';
import { TOTPVerification } from '@/components/auth/TOTPVerification';
import { supabase } from '@/integrations/supabase/client';

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
        // Get user role and redirect to appropriate dashboard
        await redirectBasedOnRole();
      }
    } catch {
      navigate('/dashboard');
    } finally {
      setCheckingTOTP(false);
    }
  };

  const redirectBasedOnRole = async () => {
    if (!user) {
      navigate('/dashboard');
      return;
    }

    try {
      // Get user's primary role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleData && roleData.length > 0) {
        const roles = roleData.map(r => r.role as string);
        
        // Check for management roles (highest priority)
        const managementRoles = ['ceo', 'buyer_ceo', 'cfo', 'buyer_cfo', 'manager', 'buyer_manager'];
        if (roles.some(r => managementRoles.includes(r))) {
          navigate('/management');
          return;
        }
        
        // Check for admin roles
        if (roles.includes('ps_admin') || roles.includes('admin')) {
          navigate('/admin');
          return;
        }
        
        // Check for affiliate
        if (roles.includes('affiliate')) {
          navigate('/affiliate');
          return;
        }
      }
      
      // Default to /dashboard for purchaser/buyer/supplier/logistics_partner
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  const handleTOTPSuccess = async () => {
    setShowTOTPVerification(false);
    await redirectBasedOnRole();
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
            <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-28 sm:h-40 w-auto object-contain" />
          </Link>
          <TOTPVerification onSuccess={handleTOTPSuccess} onCancel={handleTOTPCancel} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${authBg})` }} />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-primary-foreground">
          <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-32 w-auto object-contain mb-8 brightness-0 invert" />
          <h2 className="text-3xl font-display font-bold text-center mb-4">Welcome Back to ProcureSaathi</h2>
          <p className="text-center text-primary-foreground/80 max-w-md text-lg">
            India's trusted B2B procurement platform. Access verified suppliers, manage RFQs, and grow your business.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">1000+</div>
              <div className="text-sm text-primary-foreground/80">Verified Suppliers</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-3xl font-bold mb-1">23+</div>
              <div className="text-sm text-primary-foreground/80">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-8 bg-background">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center mb-8 lg:hidden hover:opacity-80 transition-opacity">
            <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-20 md:h-24 w-auto object-contain" />
          </Link>

          <Card className="shadow-xl border-border/50">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display">Sign In</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-11 ${errors.email ? 'border-destructive' : ''}`}
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
                        <Button variant="link" className="px-0 h-auto text-sm text-primary">
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
                          <Button type="submit" className="w-full h-11" disabled={resetLoading}>
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
                    className={`h-11 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-12 font-semibold text-base" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">New to ProcureSaathi?</span>
                </div>
              </div>

              <div className="text-center">
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;