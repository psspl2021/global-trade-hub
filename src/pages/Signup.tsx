import { useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Loader2, Lock, Clock, MessageSquare, Mail, Globe, ArrowLeft, ShoppingBag, Building2, Truck, CheckCircle, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { signupSchema } from '@/lib/validations';
import { checkPasswordBreach, formatBreachCount } from '@/lib/passwordSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useSEO } from '@/hooks/useSEO';
import { SupplierCategorySelector } from '@/components/signup/SupplierCategorySelector';
import { EmailNotificationConsent } from '@/components/signup/EmailNotificationConsent';
import { getTaxConfigForCountry, getCountryFromContext, clearCountryContext } from '@/data/countryTaxConfig';
import { getCountryByCode } from '@/data/supportedCountries';
import { EarlyPartnerOffer } from '@/components/landing/EarlyPartnerOffer';
import { usePartnerCounts } from '@/hooks/usePartnerCounts';

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
  categories?: string;
  emailNotificationConsent?: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  
  // Detect country context from URL or referrer
  const detectedCountry = useMemo(() => {
    const countryParam = searchParams.get('country');
    if (countryParam) return countryParam.toLowerCase();
    return getCountryFromContext() || 'india';
  }, [searchParams]);
  
  const taxConfig = useMemo(() => getTaxConfigForCountry(detectedCountry), [detectedCountry]);
  const countryInfo = useMemo(() => getCountryByCode(detectedCountry), [detectedCountry]);
  
  const getInitialRole = () => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'supplier') return 'supplier';
    if (roleParam === 'logistics_partner') return 'logistics_partner';
    if (roleParam === 'affiliate') return 'affiliate';
    return 'buyer';
  };
  const getInitialTab = () => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'supplier') return 'suppliers';
    if (roleParam === 'logistics_partner') return 'logistics';
    if (roleParam === 'affiliate') return 'affiliate';
    return 'buyers';
  };
  const initialRole = getInitialRole();
  const initialTab = getInitialTab();
  const referralCodeFromUrl = searchParams.get('ref') || '';
  const [referralCode, setReferralCode] = useState(referralCodeFromUrl);
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [breachWarning, setBreachWarning] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [emailNotificationConsent, setEmailNotificationConsent] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  const { supplierCount, logisticsCount, isLoading: countsLoading } = usePartnerCounts();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    location: '',
    gstin: '',
    role: initialRole as 'buyer' | 'supplier' | 'logistics_partner' | 'affiliate',
    referredByName: 'Priyanka',
    referredByPhone: '+918368127357',
    buyerType: '' as '' | 'end_buyer' | 'distributor' | 'dealer',
    logisticsPartnerType: '' as '' | 'agent' | 'fleet_owner',
    yardLocation: '',
    buyerIndustry: '',
  });

  const [referrerSelection, setReferrerSelection] = useState<'priyanka' | 'other'>('priyanka');

  // SEO based on role
  const seoConfig = useMemo(() => ({
    buyer: {
      title: 'Partner with Us - Buyers | ProcureSaathi',
      description: 'Join ProcureSaathi as a buyer. Post RFQs, compare verified supplier bids, and streamline your B2B procurement.',
      canonical: 'https://www.procuresaathi.com/signup?role=buyer',
    },
    supplier: {
      title: 'Partner with Us - Suppliers | ProcureSaathi',
      description: 'Join ProcureSaathi as a verified supplier. Access AI-detected buyer demand and grow your B2B business.',
      canonical: 'https://www.procuresaathi.com/signup?role=supplier',
    },
    logistics_partner: {
      title: 'Partner with Us - Logistics | ProcureSaathi',
      description: 'Join ProcureSaathi as a logistics partner. Connect with shippers and grow your freight business.',
      canonical: 'https://www.procuresaathi.com/signup?role=logistics_partner',
    },
    affiliate: {
      title: 'Partner with Us - Affiliate | ProcureSaathi',
      description: 'Earn by referring businesses to ProcureSaathi. Join our affiliate program and start earning commissions.',
      canonical: 'https://www.procuresaathi.com/signup?role=affiliate',
    },
  }), []);

  useSEO(seoConfig[formData.role]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handle tab change to update role
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'buyers') {
      setFormData({ ...formData, role: 'buyer' });
    } else if (value === 'suppliers') {
      setFormData({ ...formData, role: 'supplier' });
    } else if (value === 'logistics') {
      setFormData({ ...formData, role: 'logistics_partner' });
    } else if (value === 'affiliate') {
      setFormData({ ...formData, role: 'affiliate' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setBreachWarning(null);
    if (import.meta.env.DEV) console.log('Signup form submitted, role:', formData.role);

    // Validate logistics partner type if role is logistics_partner
    if (formData.role === 'logistics_partner' && !formData.logisticsPartnerType) {
      setErrors({ logisticsPartnerType: 'Please select whether you are an Agent or Fleet Owner' });
      return;
    }

    // Validate email notification consent for suppliers, logistics partners, and affiliates
    if ((formData.role === 'supplier' || formData.role === 'logistics_partner' || formData.role === 'affiliate') && !emailNotificationConsent) {
      setErrors({ emailNotificationConsent: 'You must agree to receive email notifications to complete signup' });
      return;
    }

    // Validate categories and subcategories for suppliers
    if (formData.role === 'supplier') {
      if (selectedCategories.length === 0) {
        setErrors({ categories: 'Please select at least one category you deal in' });
        return;
      }
      if (selectedSubcategories.length === 0) {
        setErrors({ categories: 'Please select at least one subcategory within your selected categories' });
        return;
      }
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

    // Validate Tax ID based on country config
    const isTaxRequired = taxConfig.isRequired && formData.role !== 'logistics_partner';
    if (isTaxRequired && !formData.gstin.trim()) {
      setErrors({ gstin: `${taxConfig.label} is required` });
      return;
    }
    
    // Validate tax ID format if pattern is defined and value is provided
    if (formData.gstin.trim() && taxConfig.pattern) {
      if (!taxConfig.pattern.test(formData.gstin.trim())) {
        setErrors({ gstin: taxConfig.patternError || `Please enter a valid ${taxConfig.label}` });
        return;
      }
    }

    // Validate referrer fields
    if (!formData.referredByName.trim()) {
      setErrors({ referredByName: 'Referrer name is required' });
      return;
    }
    if (!formData.referredByPhone.trim()) {
      setErrors({ referredByPhone: 'Referrer phone is required' });
      return;
    }

    // Validate using Zod schema
    const result = signupSchema.safeParse({
      email: formData.email,
      password: formData.password,
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Check password breach before signing up
    setCheckingPassword(true);
    try {
      const breachResult = await checkPasswordBreach(formData.password);
      if (breachResult.isBreached && breachResult.breachCount) {
        setBreachWarning(
          `⚠️ This password has been exposed in ${formatBreachCount(breachResult.breachCount)} data breaches. Please choose a more secure password for your account safety.`
        );
        setCheckingPassword(false);
        return;
      }
    } catch (error) {
      console.error('Password breach check failed:', error);
    }
    setCheckingPassword(false);

    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, {
      company_name: formData.companyName,
      contact_person: formData.contactPerson,
      phone: formData.phone,
      location: formData.location,
      gstin: formData.gstin,
      role: formData.role,
      referral_code: referralCode,
      referred_by_name: formData.referredByName,
      referred_by_phone: formData.referredByPhone,
      buyer_type: formData.role === 'buyer' ? formData.buyerType : null,
      logistics_partner_type: formData.role === 'logistics_partner' ? formData.logisticsPartnerType : null,
      yard_location: formData.role === 'supplier' ? formData.yardLocation : null,
      buyer_industry: formData.role === 'buyer' ? formData.buyerIndustry : null,
      categories: formData.role === 'supplier' ? selectedCategories : null,
      subcategories: formData.role === 'supplier' ? selectedSubcategories : null,
      email_notification_consent: emailNotificationConsent,
      country: detectedCountry,
    });

    setLoading(false);
    
    if (!error) {
      clearCountryContext();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden border-b bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Partner with Us</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <span className="text-sm font-semibold text-primary">🤝 Let's work together</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Partner with Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Whether you're looking to optimize your procurement or partner with us as a supplier — we're here to help.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Form Column */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="buyers" className="gap-1.5 text-xs sm:text-sm py-2.5 flex-col sm:flex-row">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Buyers</span>
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="gap-1.5 text-xs sm:text-sm py-2.5 flex-col sm:flex-row">
                  <Building2 className="h-4 w-4" />
                  <span>Suppliers</span>
                </TabsTrigger>
                <TabsTrigger value="logistics" className="gap-1.5 text-xs sm:text-sm py-2.5 flex-col sm:flex-row">
                  <Truck className="h-4 w-4" />
                  <span>Logistics</span>
                </TabsTrigger>
                <TabsTrigger value="affiliate" className="gap-1.5 text-xs sm:text-sm py-2.5 flex-col sm:flex-row">
                  <Gift className="h-4 w-4" />
                  <span>Affiliate</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="shadow-lg border-border/50">
              <CardContent className="p-6 md:p-8">
                {/* Title based on role */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {formData.role === 'buyer' && 'Request a Demo'}
                    {formData.role === 'supplier' && 'Join as a Supplier Partner'}
                    {formData.role === 'logistics_partner' && 'Join as a Logistics Partner'}
                    {formData.role === 'affiliate' && 'Join as an Affiliate Partner'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {formData.role === 'buyer' && 'See how ProcureSaathi can transform your procurement decisions.'}
                    {formData.role === 'supplier' && 'Start receiving AI-detected buyer demand and grow your business.'}
                    {formData.role === 'logistics_partner' && 'Freight & Transportation services — connect with shippers nationwide.'}
                    {formData.role === 'affiliate' && 'Want to earn by referring? Earn commissions by bringing businesses to ProcureSaathi.'}
                  </p>
                </div>

                {/* Early Partner Offer for Suppliers and Logistics */}
                {(formData.role === 'supplier' || formData.role === 'logistics_partner') && (
                  <Suspense fallback={null}>
                    <div className="mb-6">
                      <EarlyPartnerOffer
                        showCountdown={true}
                        showNumbers={true}
                        supplierCount={countsLoading ? 38 : supplierCount}
                        logisticsCount={countsLoading ? 5 : logisticsCount}
                        ctaLabel="Complete Form Below"
                        onCTAClick={() => {
                          document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    </div>
                  </Suspense>
                )}

                {/* Affiliate Benefits Card */}
                {formData.role === 'affiliate' && (
                  <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Affiliate Benefits
                    </h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Earn commission on every successful referral</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Track your referrals and earnings in real-time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Monthly payouts with transparent reporting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Dedicated affiliate support team</span>
                      </li>
                    </ul>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Buyer Type - Only for buyers */}
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
                        <SelectContent>
                          <SelectItem value="end_buyer">End Buyer - Direct consumer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                          <SelectItem value="dealer">Dealer / Reseller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Logistics Partner Type */}
                  {formData.role === 'logistics_partner' && (
                    <div className="space-y-2">
                      <Label>Partner Type *</Label>
                      <Select
                        value={formData.logisticsPartnerType}
                        onValueChange={(value) => setFormData({ ...formData, logisticsPartnerType: value as 'agent' | 'fleet_owner' })}
                      >
                        <SelectTrigger className={`min-h-[44px] ${errors.logisticsPartnerType ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select partner type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent - I connect transporters</SelectItem>
                          <SelectItem value="fleet_owner">Fleet Owner - I own vehicles</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.logisticsPartnerType && <p className="text-sm text-destructive">{errors.logisticsPartnerType}</p>}
                    </div>
                  )}

                  {/* Supplier Categories */}
                  {formData.role === 'supplier' && (
                    <SupplierCategorySelector
                      selectedCategories={selectedCategories}
                      selectedSubcategories={selectedSubcategories}
                      onCategoriesChange={setSelectedCategories}
                      onSubcategoriesChange={setSelectedSubcategories}
                      error={errors.categories}
                    />
                  )}

                  {/* Two-column layout for name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person *</Label>
                      <Input
                        id="contactPerson"
                        placeholder="John Doe"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className={`min-h-[44px] ${errors.contactPerson ? 'border-destructive' : ''}`}
                      />
                      {errors.contactPerson && <p className="text-sm text-destructive">{errors.contactPerson}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        placeholder="Acme Industries"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className={`min-h-[44px] ${errors.companyName ? 'border-destructive' : ''}`}
                      />
                      {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                    </div>
                  </div>

                  {/* Email and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`min-h-[44px] ${errors.email ? 'border-destructive' : ''}`}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`min-h-[44px] ${errors.phone ? 'border-destructive' : ''}`}
                      />
                      {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Location and Tax ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (City, State) *</Label>
                      <Input
                        id="location"
                        placeholder="Mumbai, Maharashtra"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`min-h-[44px] ${errors.location ? 'border-destructive' : ''}`}
                      />
                      {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin">
                        {taxConfig.label} {(taxConfig.isRequired && formData.role !== 'logistics_partner') ? '*' : '(Optional)'}
                      </Label>
                      <Input
                        id="gstin"
                        placeholder={taxConfig.placeholder}
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                        className={`min-h-[44px] ${errors.gstin ? 'border-destructive' : ''}`}
                        maxLength={taxConfig.maxLength}
                      />
                      {errors.gstin && <p className="text-sm text-destructive">{errors.gstin}</p>}
                    </div>
                  </div>

                  {/* Yard Location for Suppliers */}
                  {formData.role === 'supplier' && (
                    <div className="space-y-2">
                      <Label htmlFor="yardLocation">Yard/Warehouse Location *</Label>
                      <Input
                        id="yardLocation"
                        placeholder="Full address of your warehouse"
                        value={formData.yardLocation}
                        onChange={(e) => setFormData({ ...formData, yardLocation: e.target.value })}
                        className={`min-h-[44px] ${errors.yardLocation ? 'border-destructive' : ''}`}
                      />
                      {errors.yardLocation && <p className="text-sm text-destructive">{errors.yardLocation}</p>}
                    </div>
                  )}

                  {/* Password */}
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
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Email Consent for Partners */}
                  {(formData.role === 'supplier' || formData.role === 'logistics_partner' || formData.role === 'affiliate') && (
                    <EmailNotificationConsent
                      checked={emailNotificationConsent}
                      onChange={setEmailNotificationConsent}
                      error={errors.emailNotificationConsent}
                      role={formData.role === 'affiliate' ? 'supplier' : formData.role}
                    />
                  )}

                  {/* Referral Section - Collapsible */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm font-medium mb-3">Referred By</p>
                    <Select
                      value={referrerSelection}
                      onValueChange={(value: 'priyanka' | 'other') => {
                        setReferrerSelection(value);
                        if (value === 'priyanka') {
                          setFormData({ ...formData, referredByName: 'Priyanka', referredByPhone: '+918368127357' });
                        } else {
                          setFormData({ ...formData, referredByName: '', referredByPhone: '' });
                        }
                      }}
                    >
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Select referrer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priyanka">Priyanka (+91 8368127357)</SelectItem>
                        <SelectItem value="other">Other (Add manually)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {referrerSelection === 'other' && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Input
                          placeholder="Name"
                          value={formData.referredByName}
                          onChange={(e) => setFormData({ ...formData, referredByName: e.target.value })}
                          className={errors.referredByName ? 'border-destructive' : ''}
                        />
                        <Input
                          placeholder="Phone"
                          value={formData.referredByPhone}
                          onChange={(e) => setFormData({ ...formData, referredByPhone: e.target.value })}
                          className={errors.referredByPhone ? 'border-destructive' : ''}
                        />
                      </div>
                    )}
                  </div>

                  {breachWarning && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{breachWarning}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full min-h-[48px] text-base font-semibold" disabled={loading || checkingPassword}>
                    {checkingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking password security...
                      </>
                    ) : loading ? (
                      'Creating account...'
                    ) : formData.role === 'buyer' ? (
                      'Request Demo'
                    ) : formData.role === 'affiliate' ? (
                      'Join Affiliate Program'
                    ) : (
                      'Create Partner Account'
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

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* What to Expect */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">What to expect</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Quick Response</p>
                      <p className="text-xs text-muted-foreground">We'll get back within 1-2 business days</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Personalized Onboarding</p>
                      <p className="text-xs text-muted-foreground">See how ProcureSaathi fits your needs</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Verified Network</p>
                      <p className="text-xs text-muted-foreground">Access verified buyers and suppliers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Inquiry */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-primary mb-2">Enterprise Inquiry?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For enterprise partnerships and large-scale deployments, reach out directly.
                </p>
                <a 
                  href="mailto:sales@procuresaathi.com" 
                  className="flex items-center gap-2 text-primary font-medium text-sm hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  sales@procuresaathi.com
                </a>
              </CardContent>
            </Card>

            {/* Global Operations */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Global Operations</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Serving B2B buyers and suppliers across 195 countries
                </p>
              </CardContent>
            </Card>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Your data is secure. We never share your information without consent.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Signup;
