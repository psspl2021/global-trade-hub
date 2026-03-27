import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle, ArrowRight, Briefcase, Users, Truck, Building2, UserCheck, Network, Quote, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const targetAudience = [
  { icon: <Users className="h-5 w-5" />, label: "Freelancers & Side Hustlers" },
  { icon: <Briefcase className="h-5 w-5" />, label: "Purchase Executives & Managers" },
  { icon: <Truck className="h-5 w-5" />, label: "SCM & Logistics Professionals" },
  { icon: <Building2 className="h-5 w-5" />, label: "Traders & Brokers" },
  { icon: <UserCheck className="h-5 w-5" />, label: "Consultants & Agents" },
  { icon: <Network className="h-5 w-5" />, label: "Anyone with Supplier Network" },
];

const steps = [
  { num: "01", title: "Share your referral link", desc: "Get a unique link after signing up", critical: false },
  { num: "02", title: "Supplier signs up", desc: "They join ProcureSaathi via your link", critical: false },
  { num: "03", title: "Mention your name in 'Referred By'", desc: "Supplier MUST select or enter your name during signup", critical: true },
  { num: "04", title: "Supplier gets orders", desc: "They participate in auctions & win deals", critical: false },
  { num: "05", title: "You earn commission", desc: "20% of platform fee — automatically", critical: false },
];

const benefits = [
  { icon: "💸", text: "No investment needed" },
  { icon: "🌍", text: "Work from anywhere" },
  { icon: "📈", text: "Unlimited earning potential" },
  { icon: "🧠", text: "No technical skills required" },
  { icon: "📊", text: "Real-time tracking dashboard" },
  { icon: "⚡", text: "Instant payout processing" },
];

const testimonials = [
  { quote: "Earned ₹45K in 2 months just from my network", author: "SCM Manager, Mumbai" },
  { quote: "No investment, pure side income", author: "Freelancer, Delhi" },
  { quote: "Best for people with supplier contacts", author: "Trader, Ahmedabad" },
];

const EarnWithProcureSaathi = () => {
  const navigate = useNavigate();
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [deals, setDeals] = useState(5);
  const [userReferralCode, setUserReferralCode] = useState("guest");
  const [loadingReferral, setLoadingReferral] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharedCount, setSharedCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchReferralCode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("affiliates")
          .select("referral_code")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.referral_code) setUserReferralCode(data.referral_code);
      }
      setLoadingReferral(false);
    };
    fetchReferralCode();
  }, []);

  const whatsappRef = useRef<HTMLDivElement | null>(null);

  const handleCopyLink = () => {
    if (isSharing) return;
    setIsSharing(true);
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your supplier network." });
    setTimeout(() => {
      whatsappRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    setTimeout(() => {
      window.open(`https://wa.me/?text=${whatsappText}`, "_blank");
      setSharedCount((prev) => Math.min(prev + 1, 20));
      toast({ title: "Invite started 🚀", description: "You're one step closer to earning your first commission" });
      setIsSharing(false);
    }, 800);
    setTimeout(() => setCopied(false), 2000);
  };
  const referralLink = `https://www.procuresaathi.com/signup?ref=${userReferralCode}`;
  const whatsappText = encodeURIComponent(
    `Start earning with ProcureSaathi — connect suppliers and earn commission on every deal: ${referralLink}`
  );

  return (
    <>
      <Helmet>
        <title>Earn Extra Income | Connect Suppliers & Earn Commission | ProcureSaathi</title>
        <meta name="description" content="Earn 20% commission by connecting suppliers to ProcureSaathi. No investment needed. Ideal for freelancers, purchase executives, SCM professionals, and anyone with a supplier network." />
        <link rel="canonical" href="https://www.procuresaathi.com/earn-with-procuresaathi" />
        <meta property="og:title" content="Earn Extra Income from Your Network | ProcureSaathi" />
        <meta property="og:description" content="Know suppliers? Connect them to ProcureSaathi and earn 20% commission on every deal they win." />
        <meta property="og:url" content="https://www.procuresaathi.com/earn-with-procuresaathi" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Earn with ProcureSaathi",
          "description": "Connect suppliers to ProcureSaathi and earn commission on every deal they win.",
          "step": steps.map((s, i) => ({
            "@type": "HowToStep",
            "position": i + 1,
            "name": s.title,
            "text": s.desc,
          })),
        })}</script>
      </Helmet>

      <PageHeader />

      <main className="min-h-screen">
        {/* HERO */}
        <section className="relative overflow-hidden py-20 px-6 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />
          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              💰 Income Opportunity
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
              Earn ₹20,000+ Per Deal by Connecting Suppliers 💰
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed">
              Know suppliers, manufacturers, or traders?
              Connect them to ProcureSaathi and earn{" "}
              <span className="text-primary font-semibold">20% commission</span>{" "}
              on every deal they win.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Trusted by suppliers across India • High-value industrial deals • No investment required
            </p>

            {/* Live activity strip */}
            <p className="text-sm text-success font-medium pulse mb-1">
              🔥 127 suppliers joined via affiliates this week
            </p>
            <p className="text-xs text-muted-foreground mb-8">
              🌍 Open for India, UAE, Saudi Arabia & global suppliers
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/signup")} className="gap-2">
                Start Earning (Create Account) <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login?redirect=/affiliate")}>
                Already an Affiliate? Login
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              🚀 Most users earn their first commission within 7–14 days
            </p>
            <p className="text-sm text-primary font-medium mt-3">
              If you know just 5 suppliers, you can start earning this month
            </p>
          </div>
        </section>

        {/* WHO IS THIS FOR */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
              Who Can Earn with This?
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {targetAudience.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 border border-border rounded-xl p-5 bg-card hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-16 px-6 bg-muted/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
              How You Earn
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-5">
              {steps.map((step) => (
                <div key={step.num} className={`bg-card border rounded-xl p-6 text-center hover:shadow-md transition-all ${step.critical ? 'border-destructive/50 ring-1 ring-destructive/20' : 'border-border'}`}>
                  <div className="text-3xl font-bold text-primary/20 mb-3">{step.num}</div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  {step.critical && (
                    <span className="text-xs text-destructive block mt-1 font-medium">
                      Mandatory for commission tracking
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Important referral warning */}
            <div className="mt-8 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm text-foreground max-w-2xl mx-auto">
              ⚠️ <strong>Important:</strong> Supplier must mention your name in the <b>"Referred By"</b> field during signup. Without this, the referral will not be tracked and commission will not be applicable.
            </div>

            {/* Loss aversion */}
            <p className="text-center text-destructive text-sm mt-4">
              ⚠️ If supplier doesn't mention your name, commission will not be tracked
            </p>
          </div>
        </section>

        {/* EARNING EXAMPLE — Dynamic feel */}
        <section className="py-16 px-6">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-success/10 border border-success/30 rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">Recent affiliate earnings:</p>
              <p className="text-lg font-semibold text-success mt-2">
                ₹18,500 • ₹32,000 • ₹9,200 earned this week
              </p>
              <p className="text-xs text-muted-foreground mt-4 italic">
                * Illustrative figures. Actual earnings depend on deal size and platform margin.
              </p>
            </div>

            {/* Earnings calculator */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">🧮 Estimate Your Earnings</h3>
              <p className="text-sm text-muted-foreground mb-6">
                How many supplier deals per month?
              </p>
              <Slider
                value={[deals]}
                onValueChange={(v) => setDeals(v[0])}
                min={1}
                max={20}
                step={1}
                className="max-w-xs mx-auto mb-4"
              />
              <p className="text-sm text-muted-foreground">
                {deals} deal{deals > 1 ? "s" : ""} / month
              </p>
              <p className="text-2xl font-bold text-success mt-2">
                ₹{(deals * 20000).toLocaleString("en-IN")} potential earnings
              </p>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Based on avg. ₹20,000 commission per deal
              </p>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="py-16 px-6 bg-muted/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
              What Affiliates Say
            </h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="bg-card border border-border rounded-xl p-6 relative hover:shadow-md transition-all"
                >
                  <Quote className="h-5 w-5 text-primary/30 mb-3" />
                  <p className="text-foreground font-medium leading-relaxed mb-4">
                    "{t.quote}"
                  </p>
                  <p className="text-xs text-muted-foreground">— {t.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
              Why People Love This
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {benefits.map((b) => (
                <div key={b.text} className="flex items-center gap-3 bg-card border border-border rounded-xl p-5">
                  <span className="text-2xl">{b.icon}</span>
                  <span className="font-medium text-foreground">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 px-6 bg-primary text-primary-foreground text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Start Earning Today
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Turn your network into income — no investment required
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/signup")}
                className="gap-2"
              >
                Join Now <ArrowRight className="h-4 w-4" />
              </Button>
              <div ref={whatsappRef}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-[#25D366] text-white hover:bg-[#20bd5a] border-none"
                  asChild
                  disabled={loadingReferral}
                >
                  <a
                    href={!loadingReferral ? `https://wa.me/?text=${whatsappText}` : "#"}
                    onClick={(e) => loadingReferral && e.preventDefault()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Share on WhatsApp
                  </a>
                </Button>
              </div>
              <p className="text-xs text-foreground/80 mt-1">
                No spam — only share with relevant suppliers you know
              </p>
            </div>
            <p className="text-xs text-foreground/80 mt-2">
              🔥 100+ suppliers joined this week via affiliates
            </p>

            {/* Referral Link Display */}
            <div className="mt-6 text-sm text-foreground/70 text-center">
              <p>Your referral link:</p>
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                <span className="font-medium text-primary break-all bg-muted px-3 py-1.5 rounded-md text-xs">
                  {loadingReferral ? "Loading..." : referralLink}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  disabled={loadingReferral}
                  className="gap-1 text-xs"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "✅ Copied" : "📋 Copy"}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-primary mt-1">
                  👉 Paste this link in WhatsApp and send to your supplier contacts
                </p>
              )}
              <p className="text-xs text-foreground font-medium mt-2">
                🎯 Progress: {sharedCount}/{sharedCount < 5 ? 5 : sharedCount < 10 ? 10 : 20} invites initiated
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(sharedCount / (sharedCount < 5 ? 5 : sharedCount < 10 ? 10 : 20)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-foreground/70 mt-1">
                {Math.round((sharedCount / (sharedCount < 5 ? 5 : sharedCount < 10 ? 10 : 20)) * 100)}% completed
              </p>
              {sharedCount >= 5 && (
                <p className="text-sm text-foreground font-medium mt-2">
                  🎉 Great start! You're likely to earn your first commission soon
                  <br />
                  🔥 Next milestone: {sharedCount < 10 ? 10 : 20} invites — increase your chances {sharedCount < 10 ? "2x" : "5x"}
                </p>
              )}
              <p className="text-xs text-amber-600 mt-1">
                🏆 Top affiliates invite 15–25 suppliers in their first week
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* STICKY CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 animate-fade-in pointer-events-none">
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="rounded-full shadow-2xl gap-2 pointer-events-auto animate-scale-in"
          >
            Start Earning Now → <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EarnWithProcureSaathi;
