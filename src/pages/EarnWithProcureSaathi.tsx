import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle, ArrowRight, Briefcase, Users, Truck, Building2, UserCheck, Network } from "lucide-react";

const targetAudience = [
  { icon: <Users className="h-5 w-5" />, label: "Freelancers & Side Hustlers" },
  { icon: <Briefcase className="h-5 w-5" />, label: "Purchase Executives & Managers" },
  { icon: <Truck className="h-5 w-5" />, label: "SCM & Logistics Professionals" },
  { icon: <Building2 className="h-5 w-5" />, label: "Traders & Brokers" },
  { icon: <UserCheck className="h-5 w-5" />, label: "Consultants & Agents" },
  { icon: <Network className="h-5 w-5" />, label: "Anyone with Supplier Network" },
];

const steps = [
  { num: "01", title: "Share your referral link", desc: "Get a unique link after signing up" },
  { num: "02", title: "Supplier signs up", desc: "They join ProcureSaathi via your link" },
  { num: "03", title: "Supplier gets orders", desc: "They participate in auctions & win deals" },
  { num: "04", title: "You earn commission", desc: "20% of platform fee — automatically" },
];

const benefits = [
  { icon: "💸", text: "No investment needed" },
  { icon: "🌍", text: "Work from anywhere" },
  { icon: "📈", text: "Unlimited earning potential" },
  { icon: "🧠", text: "No technical skills required" },
  { icon: "📊", text: "Real-time tracking dashboard" },
  { icon: "⚡", text: "Instant payout processing" },
];

const EarnWithProcureSaathi = () => {
  const navigate = useNavigate();
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // TODO: Replace with dynamic user referral code from auth context when available
  const userReferralCode = "guest";
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
            <p className="text-sm text-green-600 font-medium mb-8">
              🔥 200+ suppliers joined via affiliates last month
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/signup")} className="gap-2">
                Start Earning (Create Account) <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/login?redirect=/affiliate")}>
                Already an Affiliate? Login
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              🚀 Most users earn their first commission within 7–14 days
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
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
              {steps.map((step) => (
                <div key={step.num} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-md transition-all">
                  <div className="text-3xl font-bold text-primary/20 mb-3">{step.num}</div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EARNING EXAMPLE */}
        <section className="py-16 px-6">
          <div className="max-w-xl mx-auto bg-success/10 border border-success/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-3">
              Illustrative Earning Scenario
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Supplier wins <span className="font-semibold text-foreground">₹10,00,000</span> order
              <br />→ Platform margin: <span className="font-semibold text-foreground">₹1,00,000</span>
              <br />→ <span className="text-success font-bold text-lg">You earn ₹20,000</span>
            </p>
            <p className="text-xs text-muted-foreground mt-4 italic">
              * This is an illustrative scenario. Actual earnings depend on deal size and platform margin.
            </p>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-16 px-6 bg-muted/50">
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
              <Button
                size="lg"
                variant="outline"
                className="bg-[#25D366] text-white hover:bg-[#20bd5a] border-none"
                asChild
              >
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Share on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* STICKY MOBILE CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 animate-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="rounded-full shadow-2xl gap-2 pointer-events-auto"
          >
            Start Earning <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EarnWithProcureSaathi;
