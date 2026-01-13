import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { resetPasswordSchema } from '@/lib/validations';
import { checkPasswordBreach, formatBreachCount } from '@/lib/passwordSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type FormErrors = {
  password?: string;
  confirmPassword?: string;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, updatePassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [breachWarning, setBreachWarning] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCustomReset, setIsCustomReset] = useState(false);
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useSEO({
    title: "Reset Password | ProcureSaathi",
    description: "Set a new secure password for your ProcureSaathi account. Access your B2B procurement dashboard.",
    canonical: "https://procuresaathi.com/reset-password"
  });

  useEffect(() => {
    // Check if this is a custom reset flow
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'custom_reset') {
      setIsCustomReset(true);
      setCustomToken(token);
      return;
    }

    // Standard Supabase flow - if no session, redirect
    if (!session && !token) {
      const timeout = setTimeout(() => {
        if (!session) {
          navigate('/login');
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [session, navigate, searchParams]);

  const handleCustomReset = async () => {
    if (!customToken) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-password-reset', {
        body: { token: customToken, newPassword: password }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to reset password');
      }

      setResetSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully. Please login with your new password.",
      });
      
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. The link may have expired.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setBreachWarning(null);

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check password against known breaches
    setCheckingPassword(true);
    const breachResult = await checkPasswordBreach(result.data.password);
    setCheckingPassword(false);

    if (breachResult.isBreached) {
      setBreachWarning(
        `This password has been exposed in ${formatBreachCount(breachResult.breachCount)} data breaches. Please choose a different password.`
      );
      setErrors({ password: 'This password has been compromised in a data breach' });
      return;
    }

    // Use custom reset flow if applicable
    if (isCustomReset) {
      await handleCustomReset();
      return;
    }

    // Standard Supabase flow
    setLoading(true);
    const { error: updateError } = await updatePassword(result.data.password);
    setLoading(false);

    if (!updateError) {
      navigate('/login');
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="text-2xl font-bold">Password Updated!</h2>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Package2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">ProcureSaathi</h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {breachWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{breachWarning}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || checkingPassword}>
                {checkingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking password security...
                  </>
                ) : loading ? (
                  'Updating...'
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
