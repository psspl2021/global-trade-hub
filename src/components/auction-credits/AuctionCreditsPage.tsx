import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Loader2, Zap, Star, Crown, Wallet, Smartphone, Check, Gem, Infinity, Globe, Mail } from 'lucide-react';
import { formatINR } from '@/utils/auctionPricing';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';

declare global {
  interface Window {
    Cashfree: any;
  }
}

const PLATFORM_FEE_RATE = 0.0195;
const GST_RATE = 0.18;

interface AuctionPlan {
  id: string;
  name: string;
  auctions_count: number;
  price: number; // INR base
  price_per_auction: number;
  gst_rate: number;
  description: string | null;
}

type PlanKey = 'starter' | 'pro' | 'enterprise' | 'monthlyUnlimited' | 'halfYearlyUnlimited' | 'yearlyUnlimited';

// India INR base prices (original/restored)
const INDIA_PLANS: Record<PlanKey, AuctionPlan> = {
  starter: { id: 'starter', name: 'Starter (Launch)', auctions_count: 5, price: 12500, price_per_auction: 2500, gst_rate: 0.18, description: null },
  pro: { id: 'pro', name: 'Pro Pack', auctions_count: 20, price: 80000, price_per_auction: 4000, gst_rate: 0.18, description: null },
  enterprise: { id: 'enterprise', name: 'Enterprise Pack', auctions_count: 50, price: 135000, price_per_auction: 2700, gst_rate: 0.18, description: null },
  monthlyUnlimited: { id: 'monthlyUnlimited', name: 'Monthly Unlimited Pack', auctions_count: 9999, price: 180000, price_per_auction: 0, gst_rate: 0.18, description: null },
  halfYearlyUnlimited: { id: 'halfYearlyUnlimited', name: 'Half Yearly Unlimited Pack', auctions_count: 9999, price: 450000, price_per_auction: 0, gst_rate: 0.18, description: null },
  yearlyUnlimited: { id: 'yearlyUnlimited', name: 'Yearly Unlimited Pack', auctions_count: 9999, price: 700000, price_per_auction: 0, gst_rate: 0.18, description: null },
};

// Global INR base prices (converted to local currency via FX)
const GLOBAL_PLANS: Record<PlanKey, AuctionPlan> = {
  starter: { id: 'starter', name: 'Starter (Launch)', auctions_count: 5, price: 25000, price_per_auction: 5000, gst_rate: 0.18, description: null },
  pro: { id: 'pro', name: 'Pro Pack', auctions_count: 20, price: 150000, price_per_auction: 7500, gst_rate: 0.18, description: null },
  enterprise: { id: 'enterprise', name: 'Enterprise Pack', auctions_count: 50, price: 250000, price_per_auction: 5000, gst_rate: 0.18, description: null },
  monthlyUnlimited: { id: 'monthlyUnlimited', name: 'Monthly Unlimited Pack', auctions_count: 9999, price: 180000, price_per_auction: 0, gst_rate: 0.18, description: null },
  halfYearlyUnlimited: { id: 'halfYearlyUnlimited', name: 'Half Yearly Unlimited Pack', auctions_count: 9999, price: 800000, price_per_auction: 0, gst_rate: 0.18, description: null },
  yearlyUnlimited: { id: 'yearlyUnlimited', name: 'Yearly Unlimited Pack', auctions_count: 9999, price: 1500000, price_per_auction: 0, gst_rate: 0.18, description: null },
};

const getPlanKey = (name: string): PlanKey | null => {
  const n = name.toLowerCase();
  if (n.includes('half') || n.includes('6 month') || n.includes('semi')) return 'halfYearlyUnlimited';
  if (n.includes('yearly') || n.includes('annual')) return 'yearlyUnlimited';
  if (n.includes('monthly') && n.includes('unlimited')) return 'monthlyUnlimited';
  if (n.includes('enterprise')) return 'enterprise';
  if (n.includes('pro')) return 'pro';
  if (n.includes('starter')) return 'starter';
  return null;
};

interface AuctionCreditsPageProps {
  userId: string;
  onBack: () => void;
  onCreditsUpdated?: () => void;
}

export function AuctionCreditsPage({ userId, onBack, onCreditsUpdated }: AuctionCreditsPageProps) {
  const { toast } = useToast();
  const { isGlobal, baseCurrency, country, formatAmount } = useGlobalBuyerContext();
  const [dbPlanIds, setDbPlanIds] = useState<Partial<Record<PlanKey, string>>>({});
  const [credits, setCredits] = useState<{ total: number; used: number } | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [starterUsed, setStarterUsed] = useState(false);
  const [fxRate, setFxRate] = useState<number | null>(null); // multiplier: INR * fxRate => local

  // Fetch FX rate for global buyers
  useEffect(() => {
    if (!isGlobal || baseCurrency === 'INR') return;
    supabase
      .from('fx_rates')
      .select('rate_from_inr')
      .eq('currency_code', baseCurrency)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.rate_from_inr) setFxRate(Number(data.rate_from_inr));
      });
  }, [isGlobal, baseCurrency]);

  // Tax label by region
  const taxLabel = useMemo(() => {
    if (country === 'IN' || country === 'India' || !isGlobal) return 'GST 18%';
    if (['AE', 'SA', 'QA'].includes(country || '')) return 'VAT 5%';
    if (country === 'GB' || country === 'United Kingdom') return 'VAT 20%';
    if (country === 'US' || country === 'United States') return 'Sales Tax (as applicable)';
    return 'Local taxes (as applicable)';
  }, [country, isGlobal]);

  const taxRate = useMemo(() => {
    if (country === 'IN' || country === 'India' || !isGlobal) return 0.18;
    if (['AE', 'SA', 'QA'].includes(country || '')) return 0.05;
    if (country === 'GB' || country === 'United Kingdom') return 0.20;
    return 0; // US sales tax & others — buyer pays at invoicing
  }, [country, isGlobal]);

  // Format any INR base amount → display in buyer's currency
  const displayAmount = (inrAmount: number): string => {
    if (!isGlobal || baseCurrency === 'INR') return formatINR(inrAmount);
    if (!fxRate) return formatINR(inrAmount); // fallback while FX loads
    return formatAmount(inrAmount * fxRate, baseCurrency);
  };

  // Load Cashfree SDK (India only)
  useEffect(() => {
    if (isGlobal) return;
    if (window.Cashfree) {
      setCashfreeLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => setCashfreeLoaded(true);
    script.onerror = () => console.error('Failed to load Cashfree SDK');
    document.body.appendChild(script);
  }, [isGlobal]);

  // Check payment status from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('auction_payment');
    if (status === 'success') {
      toast({ title: 'Auction Credits Activated! 🎉', description: 'Your credits have been added to your account.' });
      window.history.replaceState({}, '', window.location.pathname);
      onCreditsUpdated?.();
    } else if (status === 'failed') {
      toast({ title: 'Payment Failed', description: 'Please try again.', variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, onCreditsUpdated]);

  // Fetch data
  useEffect(() => {
    if (!userId) return;

    supabase
      .from('auction_pricing_plans')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (!data) return;
        const ids: Partial<Record<PlanKey, string>> = {};
        data.forEach((plan) => {
          const key = getPlanKey(plan.name);
          if (key && !ids[key]) ids[key] = plan.id;
        });
        setDbPlanIds(ids);
      });

    supabase
      .from('profiles')
      .select('contact_person, company_name, email, phone')
      .eq('id', userId)
      .single()
      .then(({ data }) => { if (data) setProfile(data); });

    supabase
      .from('buyer_auction_credits')
      .select('total_credits, used_credits')
      .eq('buyer_id', userId)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setCredits({ total: (data as any).total_credits, used: (data as any).used_credits });
      });

    supabase
      .from('auction_credit_payments')
      .select('metadata')
      .eq('buyer_id', userId)
      .eq('status', 'paid')
      .then(({ data }) => {
        const hasStarter = data?.some((p: any) => p.metadata?.plan_name?.toLowerCase().includes('starter'));
        setStarterUsed(!!hasStarter);
      });
  }, [userId]);

  const handleContactSales = (plan: AuctionPlan) => {
    const subject = encodeURIComponent(`Global Plan Enquiry — ${plan.name}`);
    const body = encodeURIComponent(
      `Hi ProcureSaathi team,\n\nI'm interested in the ${plan.name} for our company.\n\nCompany: ${profile?.company_name || ''}\nCountry: ${country || ''}\nPreferred currency: ${baseCurrency}\n\nPlease share invoice and payment options.\n\nThanks`
    );
    window.location.href = `mailto:sales@procuresaathi.com?subject=${subject}&body=${body}`;
  };

  const handlePurchase = async (plan: AuctionPlan) => {
    // Global buyers → contact sales (Cashfree is India only)
    if (isGlobal) {
      handleContactSales(plan);
      return;
    }

    const key = getPlanKey(plan.name);
    const planId = key ? dbPlanIds[key] : plan.id;

    if (!planId) {
      toast({ title: 'Please wait', description: 'Payment plan is still connecting...', variant: 'destructive' });
      return;
    }

    if (!cashfreeLoaded) {
      toast({ title: 'Please wait', description: 'Payment system loading...', variant: 'destructive' });
      return;
    }
    if (!profile) return;

    setIsLoading(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('cashfree-create-auction-order', {
        body: {
          buyer_id: userId,
          plan_id: planId,
          customer_email: profile.email,
          customer_phone: profile.phone || '0000000000',
          customer_name: profile.company_name || profile.contact_person || 'Buyer',
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to create order');
      }

      const cashfree = window.Cashfree({ mode: 'production' });
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (err: any) {
      console.error('Purchase error:', err);
      toast({ title: 'Error', description: err.message || 'Payment failed', variant: 'destructive' });
    } finally {
      setIsLoading(null);
    }
  };

  const DISPLAY_PLANS = isGlobal ? GLOBAL_PLANS : INDIA_PLANS;
  const creditPlans = [DISPLAY_PLANS.starter, DISPLAY_PLANS.pro, DISPLAY_PLANS.enterprise];
  const monthlyUnlimitedPlan = DISPLAY_PLANS.monthlyUnlimited;
  const halfYearlyPlan = DISPLAY_PLANS.halfYearlyUnlimited;
  const yearlyPlan = DISPLAY_PLANS.yearlyUnlimited;

  const calcTotal = (basePrice: number) => {
    const tax = Math.round(basePrice * taxRate);
    const platformFee = Math.round(basePrice * PLATFORM_FEE_RATE);
    const total = basePrice + tax + platformFee;
    return { tax, platformFee, total };
  };

  const remainingCredits = credits ? credits.total - credits.used : 0;
  const planIcons = [Zap, Star, Crown];
  const planColors = [
    'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
    'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
    'border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20',
  ];
  const planBadges = [null, 'Most Popular', 'Best Value'];

  const monthlyCalc = calcTotal(monthlyUnlimitedPlan.price);
  const halfYearlyCalc = calcTotal(halfYearlyPlan.price);
  const halfYearlyOriginal = 1000000;
  const yearlyCalc = calcTotal(yearlyPlan.price);

  const ctaLabel = (planId: string, total: number) =>
    isGlobal
      ? `Contact Sales — ${displayAmount(total)}`
      : `Buy Now - ${displayAmount(total)}`;

  const ctaIcon = (planId: string) => {
    if (isLoading === planId) return <Loader2 className="w-4 h-4 animate-spin mr-2" />;
    return isGlobal ? <Mail className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Auction Credits</h2>
        <p className="text-sm text-muted-foreground">Manage your credits and purchase new packs</p>
      </div>

      {/* Region banner for global buyers */}
      {isGlobal && (
        <Card className="border-indigo-300 bg-indigo-50/40 dark:border-indigo-800 dark:bg-indigo-950/20">
          <CardContent className="py-3 flex items-center gap-3">
            <Globe className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                Showing prices in {baseCurrency} {country ? `for ${country}` : ''}
                {fxRate && <span className="text-xs text-muted-foreground font-normal"> · live FX from INR</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                Global plans are billed via wire / card invoice. Click "Contact Sales" for an invoice in your currency.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credits Balance */}
      {credits && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    {remainingCredits > 0 && credits.total <= 5 ? 'Free Auction Credits' : 'Auction Credits'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {credits.used} of {credits.total} used
                    {credits.total <= 5 && remainingCredits > 0 ? ' • Free trial' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{remainingCredits}</p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buy Credits Section */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">Buy Auction Credits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {creditPlans.map((plan, index) => {
            const Icon = planIcons[index] || Zap;
            const colorClass = planColors[index] || planColors[0];
            const badge = planBadges[index];
            const { tax, platformFee, total } = calcTotal(plan.price);
            const showStarterUsed = plan.name.includes('Starter') && starterUsed && !isGlobal;

            return (
              <Card key={plan.id} className={`relative ${colorClass} transition-shadow hover:shadow-md`}>
                {badge && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs">
                    {badge}
                  </Badge>
                )}
                <CardContent className="pt-5 pb-4 px-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">{plan.name}</span>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-foreground">{displayAmount(plan.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      + {taxLabel}{taxRate > 0 ? ` (${displayAmount(tax)})` : ''} + Platform fee 1.95% ({displayAmount(platformFee)})
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      Total: {displayAmount(total)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">{plan.auctions_count} auction credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">{displayAmount(plan.price_per_auction)}/auction</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">
                        {plan.name === 'Enterprise Pack' ? '2 free auctions/day' : '1 free auction/day'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">Never expires</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    * Free daily auctions valid until {plan.auctions_count} credits exhaust. Does not carry forward.
                  </p>

                  {plan.name.includes('Starter') && !starterUsed && (
                    <p className="text-xs text-muted-foreground">
                      ⚡ One-time launch offer (per company)
                    </p>
                  )}

                  {showStarterUsed ? (
                    <Button disabled className="w-full" variant="outline">
                      Starter Already Used
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(plan)}
                      disabled={isLoading !== null || (!isGlobal && !cashfreeLoaded)}
                      className="w-full"
                      variant={index === 1 ? 'default' : 'outline'}
                    >
                      {ctaIcon(plan.id)}
                      {isLoading === plan.id ? 'Processing...' : ctaLabel(plan.id, total)}
                    </Button>
                  )}

                  {!isGlobal && (
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cards</span>
                      <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> UPI</span>
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Unlimited Plans (Monthly + Half-Yearly + Yearly) */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-3">Unlimited Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Unlimited */}
            <Card className="relative border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20 transition-shadow hover:shadow-md">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs">
                Monthly Plan
              </Badge>
              <CardContent className="pt-5 pb-4 px-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Infinity className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-foreground">Monthly Unlimited Pack</span>
                </div>

                <div>
                  <p className="text-2xl font-bold text-foreground">{displayAmount(monthlyUnlimitedPlan.price)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">
                    + {taxLabel}{taxRate > 0 ? ` (${displayAmount(monthlyCalc.tax)})` : ''} + Platform fee 1.95% ({displayAmount(monthlyCalc.platformFee)})
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    Total: {displayAmount(monthlyCalc.total)} • Billed monthly
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Unlimited Auctions</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Email Reminders</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Full AI Assistance</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Priority Support</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic">* Cancel anytime</p>

                <Button
                  onClick={() => handlePurchase(monthlyUnlimitedPlan)}
                  disabled={isLoading !== null || (!isGlobal && !cashfreeLoaded)}
                  className="w-full"
                  variant="outline"
                >
                  {ctaIcon(monthlyUnlimitedPlan.id)}
                  {isLoading === monthlyUnlimitedPlan.id ? 'Processing...' : ctaLabel(monthlyUnlimitedPlan.id, monthlyCalc.total)}
                </Button>
              </CardContent>
            </Card>

            {/* Half-Yearly Unlimited */}
            <Card className="relative border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 transition-shadow hover:shadow-md">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs">
                6-Month Plan • Save 20%
              </Badge>
              <CardContent className="pt-5 pb-4 px-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-foreground">Half Yearly Unlimited Pack</span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-2xl font-bold text-foreground">{displayAmount(halfYearlyPlan.price)}<span className="text-sm font-normal text-muted-foreground">/6 months</span></p>
                    <span className="text-sm text-muted-foreground line-through">{displayAmount(halfYearlyOriginal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    + {taxLabel}{taxRate > 0 ? ` (${displayAmount(halfYearlyCalc.tax)})` : ''} + Platform fee 1.95% ({displayAmount(halfYearlyCalc.platformFee)})
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    Total: {displayAmount(halfYearlyCalc.total)} • Fixed 6-month pricing
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Unlimited Auctions</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Email Reminders</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Full AI Assistance</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Priority Support</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic">* Best for mid-cycle teams</p>

                <Button
                  onClick={() => handlePurchase(halfYearlyPlan)}
                  disabled={isLoading !== null || (!isGlobal && !cashfreeLoaded)}
                  className="w-full"
                  variant="outline"
                >
                  {ctaIcon(halfYearlyPlan.id)}
                  {isLoading === halfYearlyPlan.id ? 'Processing...' : ctaLabel(halfYearlyPlan.id, halfYearlyCalc.total)}
                </Button>
              </CardContent>
            </Card>

            {/* Yearly Unlimited */}
            <Card className="relative border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 transition-shadow hover:shadow-md">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs">
                Annual Plan • Best Value
              </Badge>
              <CardContent className="pt-5 pb-4 px-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-foreground">Yearly Unlimited Pack</span>
                </div>

                <div>
                  <p className="text-2xl font-bold text-foreground">{displayAmount(yearlyPlan.price)}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                  <p className="text-xs text-muted-foreground">
                    + {taxLabel}{taxRate > 0 ? ` (${displayAmount(yearlyCalc.tax)})` : ''} + Platform fee 1.95% ({displayAmount(yearlyCalc.platformFee)})
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    Total: {displayAmount(yearlyCalc.total)} • Fixed annual pricing
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Unlimited Auctions</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Email Reminders</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Full AI Assistance</span></div>
                  <div className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-muted-foreground">Priority Support + Custom Onboarding</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic">* Custom onboarding included</p>

                <Button
                  onClick={() => handlePurchase(yearlyPlan)}
                  disabled={isLoading !== null || (!isGlobal && !cashfreeLoaded)}
                  className="w-full"
                  variant="default"
                >
                  {ctaIcon(yearlyPlan.id)}
                  {isLoading === yearlyPlan.id ? 'Processing...' : ctaLabel(yearlyPlan.id, yearlyCalc.total)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
