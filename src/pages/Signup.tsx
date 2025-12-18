import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { signupSchema } from '@/lib/validations';
import { checkPasswordBreach, formatBreachCount } from '@/lib/passwordSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useSEO } from '@/hooks/useSEO';

type FormErrors = {
  email?: string;
  password?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  referredByName?: string;
  referredByPhone?: string;
  logisticsPartnerType?: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  
  const getInitialRole = () => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'supplier') return 'supplier';
    if (roleParam === 'logistics_partner') return 'logistics_partner';
    return 'buyer';
  };
  const initialRole = getInitialRole();
  const referralCode = searchParams.get('ref') || null;
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [breachWarning, setBreachWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useSEO({
    title: "Free B2B Registration | Join ProcureSaathi as Buyer or Supplier",
    description: "Register free on India's leading B2B platform. Join as buyer, supplier, or logistics partner. Connect with verified businesses today!",
    canonical: "https://procuresaathi.com/signup",
    keywords: "B2B registration, supplier registration, buyer signup, logistics partner India"
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    role: initialRole as 'buyer' | 'supplier' | 'logistics_partner',
    referredByName: '',
    referredByPhone: '',
    logisticsPartnerType: '' as 'agent' | 'fleet_owner' | '',
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setBreachWarning(null);

    // Validate logistics partner type if role is logistics_partner
    if (formData.role === 'logistics_partner' && !formData.logisticsPartnerType) {
      setErrors({ logisticsPartnerType: 'Please select whether you are an Agent or Fleet Owner' });
      return;
    }

    const result = signupSchema.safeParse(formData);
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

    setLoading(true);
    const { error } = await signUp(result.data.email, result.data.password, {
      company_name: result.data.companyName,
      contact_person: result.data.contactPerson,
      phone: result.data.phone,
      role: result.data.role,
      referred_by_name: result.data.referredByName,
      referred_by_phone: result.data.referredByPhone,
      logistics_partner_type: formData.role === 'logistics_partner' ? formData.logisticsPartnerType : null,
    }, referralCode);
    
    // Update referral record if signup was successful and referral code was used
    if (!error && referralCode) {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('referrals')
        .update({ 
          status: 'signed_up',
          signed_up_at: new Date().toISOString()
        })
        .eq('referral_code', referralCode)
        .is('referred_id', null);
    }
    
    setLoading(false);
    
    // Redirect to login page after successful signup
    if (!error) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <img src={procureSaathiLogo} alt="ProcureSaathi Logo" className="h-20 sm:h-32 w-auto object-contain" />
        </Link>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Join India's trusted B2B procurement marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>I am a</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as 'buyer' | 'supplier' | 'logistics_partner' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="font-normal cursor-pointer">
                      Buyer - Looking to procure products
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="supplier" id="supplier" />
                    <Label htmlFor="supplier" className="font-normal cursor-pointer">
                      Supplier - Providing products
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="logistics_partner" id="logistics_partner" />
                    <Label htmlFor="logistics_partner" className="font-normal cursor-pointer">
                      Logistics Partner - Freight & Transportation services
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.role === 'logistics_partner' && (
                <div className="space-y-2">
                  <Label>Partner Type *</Label>
                  <Select
                    value={formData.logisticsPartnerType}
                    onValueChange={(value) => setFormData({ ...formData, logisticsPartnerType: value as 'agent' | 'fleet_owner' })}
                  >
                    <SelectTrigger className={errors.logisticsPartnerType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select partner type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent - I connect transporters with customers</SelectItem>
                      <SelectItem value="fleet_owner">Fleet Owner - I own and operate vehicles</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.logisticsPartnerType && (
                    <p className="text-sm text-destructive">{errors.logisticsPartnerType}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.logisticsPartnerType === 'fleet_owner' 
                      ? 'You will need to upload RC, Aadhar, PAN and Notary agreement for verification'
                      : formData.logisticsPartnerType === 'agent'
                      ? 'You will need to upload Aadhar, PAN and Notary agreement for verification'
                      : 'Select your partner type to see verification requirements'
                    }
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Your Company Pvt Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={errors.companyName ? 'border-destructive' : ''}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  placeholder="John Doe"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={errors.contactPerson ? 'border-destructive' : ''}
                />
                {errors.contactPerson && (
                  <p className="text-sm text-destructive">{errors.contactPerson}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Referred By *</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Select Referrer *</Label>
                    <Select
                      value={formData.referredByName === 'Priyanka' ? 'priyanka' : formData.referredByName ? 'other' : ''}
                      onValueChange={(value) => {
                        if (value === 'priyanka') {
                          setFormData({ ...formData, referredByName: 'Priyanka', referredByPhone: '+918368127357' });
                        } else if (value === 'other') {
                          setFormData({ ...formData, referredByName: '', referredByPhone: '' });
                        }
                      }}
                    >
                      <SelectTrigger className={errors.referredByName ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select who referred you" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priyanka">Priyanka (+918368127357)</SelectItem>
                        <SelectItem value="other">Other (Add manually)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(formData.referredByName !== 'Priyanka' || formData.referredByPhone !== '+918368127357') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="referredByName">Name *</Label>
                        <Input
                          id="referredByName"
                          placeholder="Referrer's name"
                          value={formData.referredByName}
                          onChange={(e) => setFormData({ ...formData, referredByName: e.target.value })}
                          className={errors.referredByName ? 'border-destructive' : ''}
                        />
                        {errors.referredByName && (
                          <p className="text-sm text-destructive">{errors.referredByName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referredByPhone">Phone *</Label>
                        <Input
                          id="referredByPhone"
                          type="tel"
                          placeholder="+919876543210"
                          value={formData.referredByPhone}
                          onChange={(e) => setFormData({ ...formData, referredByPhone: e.target.value })}
                          className={errors.referredByPhone ? 'border-destructive' : ''}
                        />
                        {errors.referredByPhone && (
                          <p className="text-sm text-destructive">{errors.referredByPhone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  'Creating account...'
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;