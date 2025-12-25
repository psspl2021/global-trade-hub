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
import { toast } from 'sonner';
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
  yardLocation?: string;
  location?: string;
  gstin?: string;
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
    buyerType: '' as 'end_buyer' | 'distributor' | 'dealer' | '',
    yardLocation: '',
    location: '',
    gstin: '',
  });

  // Dynamic SEO based on role
  const getSEOConfig = () => {
    if (formData.role === 'supplier') {
      return {
        title: "Supplier Registration | List Products & Get Buyer Leads | ProcureSaathi",
        description: "Register as a verified supplier on India's top B2B marketplace. Get premium visibility, direct buyer connections, and grow your business. Free registration, unlimited product listings!",
        keywords: "supplier registration India, B2B supplier platform, sell products online B2B, wholesale supplier registration, industrial supplier marketplace, verified supplier network"
      };
    }
    if (formData.role === 'logistics_partner') {
      return {
        title: "Logistics Partner Registration | Fleet Owner & Agent Signup | ProcureSaathi",
        description: "Join India's fastest-growing logistics network. Register as fleet owner or transport agent. Get freight bookings, track shipments, and grow your transport business.",
        keywords: "logistics partner registration, fleet owner signup, transport agent India, freight booking platform, truck booking service"
      };
    }
    return {
      title: "Buyer Registration | Source Products from Verified Suppliers | ProcureSaathi",
      description: "Register as a buyer on India's trusted B2B procurement platform. Access verified suppliers, compare quotes, and streamline your procurement process.",
      keywords: "buyer registration India, B2B procurement platform, industrial buyer signup, wholesale buying platform"
    };
  };

  const seoConfig = getSEOConfig();
  useSEO({
    title: seoConfig.title,
    description: seoConfig.description,
    canonical: `https://procuresaathi.com/signup${formData.role !== 'buyer' ? `?role=${formData.role}` : ''}`,
    keywords: seoConfig.keywords
  });

  // Inject structured data for supplier signup
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": seoConfig.title,
      "description": seoConfig.description,
      "url": `https://procuresaathi.com/signup${formData.role !== 'buyer' ? `?role=${formData.role}` : ''}`,
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "ProcureSaathi B2B Platform",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
          "description": "Free supplier registration with premium visibility"
        }
      }
    };

    const faqData = formData.role === 'supplier' ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I register as a supplier on ProcureSaathi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply fill in your company details, add your yard/warehouse location, and complete the registration. You can start listing products immediately after signup."
          }
        },
        {
          "@type": "Question",
          "name": "Is supplier registration free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, supplier registration is completely free. You get unlimited product listings and access to buyer requirements at no cost."
          }
        },
        {
          "@type": "Question",
          "name": "How can I increase my visibility as a supplier?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Add complete product catalogs with detailed specifications, maintain accurate stock levels, respond quickly to buyer inquiries, and keep your profile updated for maximum visibility."
          }
        },
        {
          "@type": "Question",
          "name": "What products can I sell on ProcureSaathi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ProcureSaathi supports industrial materials including metals, chemicals, polymers, construction materials, and more. Check our categories page for the complete list."
          }
        }
      ]
    } : null;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'signup-structured-data';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    let faqScript: HTMLScriptElement | null = null;
    if (faqData) {
      faqScript = document.createElement('script');
      faqScript.type = 'application/ld+json';
      faqScript.id = 'signup-faq-data';
      faqScript.textContent = JSON.stringify(faqData);
      document.head.appendChild(faqScript);
    }

    return () => {
      const existingScript = document.getElementById('signup-structured-data');
      if (existingScript) existingScript.remove();
      const existingFaq = document.getElementById('signup-faq-data');
      if (existingFaq) existingFaq.remove();
    };
  }, [formData.role, seoConfig]);

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

    // Validate buyer type if role is buyer
    if (formData.role === 'buyer' && !formData.buyerType) {
      toast.error('Please select your buyer type');
      return;
    }

    // Validate yard/warehouse location for suppliers
    if (formData.role === 'supplier' && !formData.yardLocation.trim()) {
      setErrors({ yardLocation: 'Yard/Warehouse location is required for suppliers' });
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

    // Check for duplicate phone number
    setLoading(true);
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', result.data.phone)
      .maybeSingle();
    
    if (existingPhone) {
      setLoading(false);
      setErrors({ phone: 'This phone number is already registered' });
      return;
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', result.data.email)
      .maybeSingle();
    
    if (existingEmail) {
      setLoading(false);
      setErrors({ email: 'This email is already registered' });
      return;
    }
    setLoading(false);

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
      business_type: formData.role === 'buyer' ? formData.buyerType : null,
      address: formData.role === 'supplier' ? formData.yardLocation : result.data.location,
      gstin: result.data.gstin,
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

              {/* Buyer Type - Only visible for buyers */}
              {formData.role === 'buyer' && (
                <div className="space-y-2">
                  <Label>Buyer Type *</Label>
                  <Select
                    value={formData.buyerType}
                    onValueChange={(value) => setFormData({ ...formData, buyerType: value as 'end_buyer' | 'distributor' | 'dealer' })}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder="Select buyer type" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-[40vh]">
                      <SelectItem value="end_buyer" className="py-3">End Buyer - Direct consumer of products</SelectItem>
                      <SelectItem value="distributor" className="py-3">Distributor - Distribute to multiple buyers</SelectItem>
                      <SelectItem value="dealer" className="py-3">Dealer - Trade/resell to customers</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.buyerType === 'distributor' || formData.buyerType === 'dealer'
                      ? 'You can specify customer name when posting requirements'
                      : 'Select your buyer type to continue'}
                  </p>
                </div>
              )}

              {formData.role === 'logistics_partner' && (
                <div className="space-y-2">
                  <Label>Partner Type *</Label>
                  <Select
                    value={formData.logisticsPartnerType}
                    onValueChange={(value) => setFormData({ ...formData, logisticsPartnerType: value as 'agent' | 'fleet_owner' })}
                  >
                    <SelectTrigger 
                      className={`min-h-[44px] ${errors.logisticsPartnerType ? 'border-destructive' : ''}`}
                    >
                      <SelectValue placeholder="Tap to select partner type" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="max-h-[40vh]">
                      <SelectItem value="agent" className="py-3">Agent - I connect transporters with customers</SelectItem>
                      <SelectItem value="fleet_owner" className="py-3">Fleet Owner - I own and operate vehicles</SelectItem>
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
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="Your Company Pvt Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={`min-h-[44px] ${errors.companyName ? 'border-destructive' : ''}`}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName}</p>
                )}
              </div>

              {formData.role === 'supplier' && (
                <div className="space-y-2">
                  <Label htmlFor="yardLocation">Yard/Warehouse Location *</Label>
                  <Input
                    id="yardLocation"
                    placeholder="Enter your yard/warehouse location"
                    value={formData.yardLocation}
                    onChange={(e) => setFormData({ ...formData, yardLocation: e.target.value })}
                    className={`min-h-[44px] ${errors.yardLocation ? 'border-destructive' : ''}`}
                  />
                  {errors.yardLocation && (
                    <p className="text-sm text-destructive">{errors.yardLocation}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Full address of your yard/warehouse where products are stored
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Person *</Label>
                <Input
                  id="contact"
                  placeholder="John Doe"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`min-h-[44px] ${errors.contactPerson ? 'border-destructive' : ''}`}
                />
                {errors.contactPerson && (
                  <p className="text-sm text-destructive">{errors.contactPerson}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`min-h-[44px] ${errors.phone ? 'border-destructive' : ''}`}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (City, State) *</Label>
                <Input
                  id="location"
                  placeholder="Mumbai, Maharashtra"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`min-h-[44px] ${errors.location ? 'border-destructive' : ''}`}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN *</Label>
                <Input
                  id="gstin"
                  placeholder="22AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className={`min-h-[44px] ${errors.gstin ? 'border-destructive' : ''}`}
                  maxLength={15}
                />
                {errors.gstin && (
                  <p className="text-sm text-destructive">{errors.gstin}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  15-character GST Identification Number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`min-h-[44px] ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 chars, uppercase, lowercase, number"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`min-h-[44px] ${errors.password ? 'border-destructive' : ''}`}
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
                          setErrors({ ...errors, referredByName: undefined, referredByPhone: undefined });
                        } else if (value === 'other') {
                          setFormData({ ...formData, referredByName: '', referredByPhone: '' });
                        }
                      }}
                    >
                      <SelectTrigger 
                        className={`min-h-[44px] ${errors.referredByName && !formData.referredByName ? 'border-destructive' : ''}`}
                      >
                        <SelectValue placeholder="Tap to select who referred you" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        sideOffset={4}
                        className="max-h-[40vh]"
                      >
                        <SelectItem value="priyanka" className="py-3">Priyanka (+918368127357)</SelectItem>
                        <SelectItem value="other" className="py-3">Other (Add manually)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.referredByName && !formData.referredByName && formData.referredByName !== 'Priyanka' && (
                      <p className="text-sm text-destructive">Please select who referred you</p>
                    )}
                  </div>
                  
                  {formData.referredByName !== '' && formData.referredByName !== 'Priyanka' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="referredByName">Name *</Label>
                        <Input
                          id="referredByName"
                          placeholder="Referrer's name"
                          value={formData.referredByName}
                          onChange={(e) => setFormData({ ...formData, referredByName: e.target.value })}
                          className={`min-h-[44px] ${errors.referredByName ? 'border-destructive' : ''}`}
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
                          className={`min-h-[44px] ${errors.referredByPhone ? 'border-destructive' : ''}`}
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

              <Button type="submit" className="w-full min-h-[48px] text-base" disabled={loading || checkingPassword}>
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