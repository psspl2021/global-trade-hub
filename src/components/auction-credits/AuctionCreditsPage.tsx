import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Loader2, Zap, Star, Crown, Wallet, Smartphone, Check, Gem, Mail, Bot, Infinity } from 'lucide-react';
import { formatINR } from '@/utils/auctionPricing';

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
  price: number;
  price_per_auction: number;
  gst_rate: number;
  description: string | null;
}

interface AuctionCreditsPageProps {
  userId: string;
  onBack: () => void;
  onCreditsUpdated?: () => void;
}

export function AuctionCreditsPage({ userId, onBack, onCreditsUpdated }: AuctionCreditsPageProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AuctionPlan[]>([]);
  const [credits, setCredits] = useState<{ total: number; used: number } | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [starterUsed, setStarterUsed] = useState(false);

  // Load Cashfree SDK
  useEffect(() => {
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
  }, []);

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

  // Fetch data — plans load first (fast render), other data fills in progressively
  useEffect(() => {
    if (!userId) return;

    // Plans: highest priority, render immediately
    supabase
      .from('auction_pricing_plans')
      .select('id, name, auctions_count, price, price_per_auction, gst_rate, description')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPlans(data as unknown as AuctionPlan[]);
      });

    // Profile + credits in parallel (independent of plans)
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

    // Starter-used check is non-critical — defer
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

  const handlePurchase = async (plan: AuctionPlan) => {
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
          plan_id: plan.id,
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

  // Find unlimited plans dynamically (yearly + monthly)
  const yearlyPlan = plans.find(p => p.name.toLowerCase().includes('yearly'));
  const monthlyUnlimitedPlan = plans.find(p => {
    const n = p.name.toLowerCase();
    return n.includes('monthly') && n.includes('unlimited');
  });

  const handleYearlyPurchase = () => {
    if (!yearlyPlan) {
      toast({ title: 'Error', description: 'Yearly plan not found', variant: 'destructive' });
      return;
    }
    handlePurchase(yearlyPlan);
  };

  const handleMonthlyUnlimitedPurchase = () => {
    if (!monthlyUnlimitedPlan) {
      toast({ title: 'Coming soon', description: 'Monthly Unlimited Pack will be enabled shortly.', variant: 'destructive' });
      return;
    }
    handlePurchase(monthlyUnlimitedPlan);
  };

  const calcTotal = (basePrice: number) => {
    const gst = Math.round(basePrice * GST_RATE);
    const platformFee = Math.round(basePrice * PLATFORM_FEE_RATE);
    const total = basePrice + gst + platformFee;
    return { gst, platformFee, total };
  };

  const remainingCredits = credits ? credits.total - credits.used : 0;
  const planIcons = [Zap, Star, Crown];
  const planColors = [
    'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
    'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
    'border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20',
  ];
  const planBadges = [null, 'Most Popular', 'Best Value'];

  const yearlyBase = 700000;
  const yearlyOriginal = 1000000;
  const yearlyCalc = calcTotal(yearlyBase);
  const monthlyBase = 180000;
  const monthlyCalc = calcTotal(monthlyBase);

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
          {plans.filter(p => !p.name.toLowerCase().includes('yearly')).map((plan, index) => {
            const Icon = planIcons[index] || Zap;
            const colorClass = planColors[index] || planColors[0];
            const badge = planBadges[index];
            const { gst, platformFee, total } = calcTotal(plan.price);

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
                    <p className="text-2xl font-bold text-foreground">{formatINR(plan.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      + GST 18% ({formatINR(gst)}) + Platform fee 1.95% ({formatINR(platformFee)})
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      Total: {formatINR(total)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">{plan.auctions_count} auction credits</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-muted-foreground">{formatINR(plan.price_per_auction)}/auction</span>
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

                  {plan.name.includes('Starter') && starterUsed ? (
                    <Button disabled className="w-full" variant="outline">
                      Starter Already Used
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(plan)}
                      disabled={isLoading !== null || !cashfreeLoaded}
                      className="w-full"
                      variant={index === 1 ? 'default' : 'outline'}
                    >
                      {isLoading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {isLoading === plan.id ? 'Processing...' : `Buy Now - ${formatINR(total)}`}
                    </Button>
                  )}

                  <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cards</span>
                    <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> UPI</span>
                    <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Unlimited Plans (Monthly + Yearly) — same card style as top three */}
        <div className="mt-8">
          <h3 className="text-base font-semibold text-foreground mb-3">Unlimited Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-2xl font-bold text-foreground">{formatINR(monthlyBase)}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground">
                    + GST 18% ({formatINR(monthlyCalc.gst)}) + Platform fee 1.95% ({formatINR(monthlyCalc.platformFee)})
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    Total: {formatINR(monthlyCalc.total)} • Billed monthly
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Unlimited Auctions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Email Reminders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Full AI Assistance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Priority Support</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic">* Cancel anytime</p>

                <Button
                  onClick={handleMonthlyUnlimitedPurchase}
                  disabled={isLoading !== null || !cashfreeLoaded}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading === 'monthly-unlimited' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isLoading === 'monthly-unlimited' ? 'Processing...' : `Buy Now - ${formatINR(monthlyCalc.total)}`}
                </Button>

                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cards</span>
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> UPI</span>
                  <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
                </div>
              </CardContent>
            </Card>

            {/* Yearly Unlimited */}
            <Card className="relative border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 transition-shadow hover:shadow-md">
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs">
                Annual Plan • Save 30%
              </Badge>
              <CardContent className="pt-5 pb-4 px-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-foreground">Yearly Unlimited Pack</span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-2xl font-bold text-foreground">{formatINR(yearlyBase)}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                    <span className="text-sm text-muted-foreground line-through">{formatINR(yearlyOriginal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    + GST 18% ({formatINR(yearlyCalc.gst)}) + Platform fee 1.95% ({formatINR(yearlyCalc.platformFee)})
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">
                    Total: {formatINR(yearlyCalc.total)} • Fixed annual pricing
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Unlimited Auctions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Email Reminders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Full AI Assistance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-muted-foreground">Priority Support</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 italic">* Custom onboarding included</p>

                <Button
                  onClick={handleYearlyPurchase}
                  disabled={isLoading !== null || !cashfreeLoaded}
                  className="w-full"
                  variant="default"
                >
                  {isLoading === 'yearly' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isLoading === 'yearly' ? 'Processing...' : `Buy Now - ${formatINR(yearlyCalc.total)}`}
                </Button>

                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cards</span>
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> UPI</span>
                  <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
