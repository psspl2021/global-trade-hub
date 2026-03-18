/**
 * Auction Credits Purchase — Bulk Buy Pricing Plans
 * Allows buyers to purchase auction credit packs via Cashfree
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Loader2, Zap, Star, Crown, Wallet, Smartphone, Check, MessageCircle } from 'lucide-react';
import { formatINR } from '@/utils/auctionPricing';

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface AuctionPlan {
  id: string;
  name: string;
  auctions_count: number;
  price: number;
  price_per_auction: number;
  gst_rate: number;
  description: string | null;
}

interface AuctionCreditsPurchaseProps {
  onCreditsUpdated?: () => void;
}

export function AuctionCreditsPurchase({ onCreditsUpdated }: AuctionCreditsPurchaseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<AuctionPlan[]>([]);
  const [credits, setCredits] = useState<{ total: number; used: number } | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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

  // Fetch plans, credits, profile
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [plansRes, creditsRes, profileRes] = await Promise.all([
        supabase.from('auction_pricing_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('buyer_auction_credits').select('total_credits, used_credits').eq('buyer_id', user.id).limit(1).single(),
        supabase.from('profiles').select('contact_person, company_name, email, phone').eq('id', user.id).single(),
      ]);

      if (plansRes.data) setPlans(plansRes.data as unknown as AuctionPlan[]);
      if (creditsRes.data) setCredits({ total: (creditsRes.data as any).total_credits, used: (creditsRes.data as any).used_credits });
      if (profileRes.data) setProfile(profileRes.data);
    };
    fetchData();
  }, [user]);

  const handlePurchase = async (plan: AuctionPlan) => {
    if (!cashfreeLoaded) {
      toast({ title: 'Please wait', description: 'Payment system loading...', variant: 'destructive' });
      return;
    }
    if (!user || !profile) return;

    setIsLoading(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('cashfree-create-auction-order', {
        body: {
          buyer_id: user.id,
          plan_id: plan.id,
          customer_email: profile.email || user.email,
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

  const remainingCredits = credits ? credits.total - credits.used : 0;

  const planIcons = [Zap, Star, Crown];
  const planColors = [
    'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
    'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
    'border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20',
  ];
  const planBadges = [
    null,
    'Most Popular',
    'Best Value',
  ];

  return (
    <div className="space-y-4">
      {/* Credits Balance */}
      {credits && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Auction Credits</p>
                  <p className="text-xs text-muted-foreground">
                    {credits.used} of {credits.total} used
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{remainingCredits}</p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Title */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">Buy Auction Credits</h3>
        <p className="text-sm text-muted-foreground">Purchase credit packs to create reverse auctions</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, index) => {
          const Icon = planIcons[index] || Zap;
          const colorClass = planColors[index] || planColors[0];
          const badge = planBadges[index];
          const gst = Math.round(plan.price * (plan.gst_rate || 0.18));
          const total = plan.price + gst;

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
                    + GST {formatINR(gst)} = {formatINR(total)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-muted-foreground">{plan.auctions_count} auction credits</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-muted-foreground">{formatINR(plan.price_per_auction)}/auction</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-muted-foreground">Never expires</span>
                  </div>
                </div>

                {plan.name === 'Enterprise Pack' ? (
                  <a
                    href="https://wa.me/918368127357?text=Hi, I'm interested in the Enterprise Auction Pack (50 auctions)."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact Sales
                  </a>
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

                {/* Payment methods */}
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
    </div>
  );
}
