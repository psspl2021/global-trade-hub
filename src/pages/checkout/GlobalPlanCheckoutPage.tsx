import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, CreditCard, Building2, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/checkout/StripeEmbeddedCheckout";
import { WirePaymentForm } from "@/components/checkout/WirePaymentForm";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useSEO } from "@/hooks/useSEO";

type Currency = "INR" | "USD" | "EUR" | "GBP";
type TierKey = "1mo" | "3mo" | "6mo";

// Base plan fee already INCLUDES the 3% service fee bundled in.
// INR: 1,50,000 → +3% = 1,54,500 | 4,00,000 → 4,12,000 | 7,00,000 → 7,21,000
const TIERS: Record<TierKey, {
  label: string;
  duration: string;
  baseINR: number;       // plan fee only
  totalINR: number;      // plan fee + 3% service fee
  badge?: string;
  prices: Record<Currency, { priceId: string; display: string; symbol: string }>;
}> = {
  "1mo": {
    label: "1 Month",
    duration: "1 Month",
    baseINR: 150000,
    totalINR: 154500,
    prices: {
      INR: { priceId: "global_plan_1mo_inr", display: "1,54,500", symbol: "₹" },
      USD: { priceId: "global_plan_1mo_usd", display: "1,854", symbol: "$" },
      EUR: { priceId: "global_plan_1mo_eur", display: "1,699.50", symbol: "€" },
      GBP: { priceId: "global_plan_1mo_gbp", display: "1,467.75", symbol: "£" },
    },
  },
  "3mo": {
    label: "3 Months",
    duration: "3 Months",
    baseINR: 400000,
    totalINR: 412000,
    badge: "Popular",
    prices: {
      INR: { priceId: "global_plan_3mo_inr", display: "4,12,000", symbol: "₹" },
      USD: { priceId: "global_plan_3mo_usd", display: "4,944", symbol: "$" },
      EUR: { priceId: "global_plan_3mo_eur", display: "4,532", symbol: "€" },
      GBP: { priceId: "global_plan_3mo_gbp", display: "3,914", symbol: "£" },
    },
  },
  "6mo": {
    label: "6 Months",
    duration: "6 Months",
    baseINR: 700000,
    totalINR: 721000,
    badge: "Best Value",
    prices: {
      INR: { priceId: "global_plan_6mo_inr", display: "7,21,000", symbol: "₹" },
      USD: { priceId: "global_plan_6mo_usd", display: "8,652", symbol: "$" },
      EUR: { priceId: "global_plan_6mo_eur", display: "7,931", symbol: "€" },
      GBP: { priceId: "global_plan_6mo_gbp", display: "6,849.50", symbol: "£" },
    },
  },
};

const FEATURES = [
  "Unlimited reverse auctions for the full term",
  "Global supplier sourcing across 196+ countries",
  "Multi-currency POs (INR / USD / EUR / GBP)",
  "Dedicated procurement success manager",
  "Priority response on counter-offers & negotiation",
  "Multi-purchaser team accounts with role-based access",
];

const fmtINR = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function GlobalPlanCheckoutPage() {
  useSEO({
    title: "Global Procurement Plan | 1, 3 or 6-Month Tiers | ProcureSaathi",
    description:
      "Activate unlimited reverse auctions and global sourcing. Choose 1, 3, or 6-month tiers. Pay via UPI, card, or wire transfer.",
  });

  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<TierKey>("6mo");
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

  const selectedTier = TIERS[tier];
  const price = selectedTier.prices[currency];

  // GST only for INR (India)
  const showGST = currency === "INR";
  const gstAmount = showGST ? Math.round(selectedTier.totalINR * 0.18) : 0;
  const grandTotalINR = selectedTier.totalINR + gstAmount;

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">Global Procurement Infrastructure Contract</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Global Procurement Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlimited reverse auctions, global supplier network, and dedicated success management. Choose the term that fits your sourcing pipeline.
          </p>
        </div>

        {/* Tier selector */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {(Object.keys(TIERS) as TierKey[]).map((t) => {
            const item = TIERS[t];
            const isActive = tier === t;
            return (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`relative text-left rounded-xl border-2 p-5 transition ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {item.badge && (
                  <Badge className="absolute -top-2 right-3 text-xs">{item.badge}</Badge>
                )}
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="text-2xl font-bold mt-1">₹{fmtINR(item.baseINR)}</div>
                <div className="text-xs text-muted-foreground mt-1">+ 3% service fee</div>
                <div className="text-xs font-medium text-foreground mt-2">
                  Total: ₹{fmtINR(item.totalINR)}
                </div>
              </button>
            );
          })}
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

              {/* CASHFREE */}
              <TabsContent value="cashfree" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Pay by UPI, Netbanking or Indian Card</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For Indian buyers. Instant activation upon payment confirmation.
                  </p>
                  <div className="bg-muted/30 rounded-lg p-4 mb-4 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan fee ({selectedTier.label})</span>
                      <span>₹{fmtINR(selectedTier.baseINR)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee (3%)</span>
                      <span>₹{fmtINR(selectedTier.totalINR - selectedTier.baseINR)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>₹{fmtINR(Math.round(selectedTier.totalINR * 0.18))}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-border">
                      <span className="text-sm font-medium">Total today</span>
                      <span className="text-2xl font-bold">
                        ₹{fmtINR(selectedTier.totalINR + Math.round(selectedTier.totalINR * 0.18))}
                      </span>
                    </div>
                  </div>
                  <Button asChild className="w-full" size="lg">
                    <a href={`/buyer?upgrade=global-plan&tier=${tier}`}>
                      Continue with Cashfree (INR)
                    </a>
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
                  <div className="bg-muted/30 rounded-lg p-3 mt-3 text-sm">
                    <span className="text-muted-foreground">Amount due: </span>
                    <span className="font-semibold">
                      {price.symbol}{price.display}
                      {showGST && ` + 18% GST`}
                    </span>
                  </div>
                </div>
                <WirePaymentForm defaultCurrency={currency} />
              </TabsContent>

              {/* STRIPE */}
              <TabsContent value="stripe" className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Pay by card</h3>
                    <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-3 mb-4 text-xs text-amber-900 dark:text-amber-200">
                    International card payments are temporarily unavailable while our Stripe account approval is in progress. Please use <strong>UPI / India</strong> or <strong>Wire Transfer</strong> in the meantime.
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Currency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(selectedTier.prices) as Currency[]).map((c) => (
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
                      Includes 3% service fee. {showGST ? "+ 18% GST." : "Tax-exclusive for non-Indian buyers."}
                    </p>
                  </div>
                </div>

                {!showStripe ? (
                  <Button disabled className="w-full" size="lg">
                    Card payments unavailable — use UPI or Wire
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
            </Tabs>
          </Card>

          {/* Plan summary sidebar */}
          <Card className="p-6 h-fit lg:sticky lg:top-6">
            <h3 className="font-bold text-lg mb-1">Global Procurement Plan</h3>
            <p className="text-sm text-muted-foreground mb-4">{selectedTier.duration} · Unlimited reverse auctions</p>

            <div className="space-y-3 mb-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan fee</span>
                <span className="font-medium">₹{fmtINR(selectedTier.baseINR)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service fee (3%)</span>
                <span className="font-medium">₹{fmtINR(selectedTier.totalINR - selectedTier.baseINR)}</span>
              </div>
              {showGST && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">₹{fmtINR(gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="font-semibold">Total ({currency})</span>
                <span className="font-bold">
                  {currency === "INR"
                    ? `₹${fmtINR(grandTotalINR)}`
                    : `${price.symbol}${price.display}`}
                </span>
              </div>
              {!showGST && (
                <p className="text-xs text-muted-foreground italic pt-1">
                  Tax-exclusive for non-Indian buyers. Local taxes (if any) handled in your jurisdiction.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
