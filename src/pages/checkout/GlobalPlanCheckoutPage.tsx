import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, CreditCard, Building2, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GLOBAL_BUYER_PLAN } from "@/lib/global-positioning";
import { StripeEmbeddedCheckout } from "@/components/checkout/StripeEmbeddedCheckout";
import { WirePaymentForm } from "@/components/checkout/WirePaymentForm";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useSEO } from "@/hooks/useSEO";

type Currency = "INR" | "USD" | "EUR" | "GBP";

const PRICE_MAP: Record<Currency, { priceId: string; display: string; symbol: string }> = {
  INR: { priceId: "global_plan_inr", display: "7,00,000", symbol: "₹" },
  USD: { priceId: "global_plan_usd", display: "8,400", symbol: "$" },
  EUR: { priceId: "global_plan_eur", display: "7,700", symbol: "€" },
  GBP: { priceId: "global_plan_gbp", display: "6,650", symbol: "£" },
};

export default function GlobalPlanCheckoutPage() {
  useSEO({
    title: "Activate Global Procurement Plan | ProcureSaathi",
    description: "Unlock unlimited reverse auctions and global supplier sourcing for 6 months. Pay via card, UPI, or wire transfer.",
  });

  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [showStripe, setShowStripe] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login?redirect=/checkout/global-plan");
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const price = PRICE_MAP[currency];

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">6-Month Procurement Infrastructure Contract</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{GLOBAL_BUYER_PLAN.name}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {GLOBAL_BUYER_PLAN.positioning}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Payment methods */}
          <Card className="p-6">
            <Tabs defaultValue="cashfree" onValueChange={() => setShowStripe(false)}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="cashfree" className="gap-2">
                  <CreditCard className="h-4 w-4" /> UPI / India
                </TabsTrigger>
                <TabsTrigger value="wire" className="gap-2">
                  <Building2 className="h-4 w-4" /> Wire Transfer
                </TabsTrigger>
                <TabsTrigger value="stripe" className="gap-2">
                  <Globe className="h-4 w-4" /> Card / Global
                </TabsTrigger>
              </TabsList>

              {/* STRIPE */}
              <TabsContent value="stripe" className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Pay by card (auto-renewing)</h3>
                    <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 mb-4 text-xs text-amber-900 dark:text-amber-200">
                    International card payments are temporarily unavailable while our Stripe account approval is in progress. Please use <strong>UPI / India</strong> or <strong>Wire Transfer</strong> in the meantime.
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Instant activation. Renews every 6 months. Cancel anytime from billing portal.
                  </p>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(PRICE_MAP) as Currency[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCurrency(c); setShowStripe(false); }}
                          className={`px-3 py-2 rounded-md text-sm font-medium border transition ${
                            currency === c
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total today</span>
                      <span className="text-2xl font-bold">{price.symbol}{price.display}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-renews every 6 months at the same rate. INR-anchored pricing.
                    </p>
                  </div>
                </div>

                {!showStripe ? (
                  <Button onClick={() => setShowStripe(true)} className="w-full" size="lg">
                    Continue to Payment
                  </Button>
                ) : (
                  <StripeEmbeddedCheckout
                    priceId={price.priceId}
                    customerEmail={user?.email}
                    userId={user?.id}
                    returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
                  />
                )}
              </TabsContent>

              {/* CASHFREE */}
              <TabsContent value="cashfree" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Pay by UPI, Netbanking or Indian Card</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For Indian buyers. Instant activation upon payment confirmation.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total today</span>
                      <span className="text-2xl font-bold">₹7,00,000</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">+ 18% GST applied at checkout</p>
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <a href="/buyer?upgrade=global-plan">Continue with Cashfree (INR)</a>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    You'll be redirected to our secure Cashfree payment gateway.
                  </p>
                </div>
              </TabsContent>

              {/* WIRE */}
              <TabsContent value="wire">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Wire Transfer / SWIFT (Proforma)</h3>
                  <p className="text-sm text-muted-foreground">
                    Best for enterprise procurement teams that pay by bank wire. Plan activates after our finance team reconciles your transfer.
                  </p>
                </div>
                <WirePaymentForm defaultCurrency={currency} />
              </TabsContent>
            </Tabs>
          </Card>

          {/* Plan summary sidebar */}
          <Card className="p-6 h-fit lg:sticky lg:top-6">
            <h3 className="font-bold text-lg mb-1">{GLOBAL_BUYER_PLAN.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{GLOBAL_BUYER_PLAN.duration}</p>

            <div className="space-y-3 mb-6">
              {GLOBAL_BUYER_PLAN.features.map((f, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base price (INR)</span>
                <span className="font-medium">₹7,00,000</span>
              </div>
              <p className="text-xs text-muted-foreground">{GLOBAL_BUYER_PLAN.bonus}</p>
              <p className="text-xs text-muted-foreground italic">{GLOBAL_BUYER_PLAN.roi}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
