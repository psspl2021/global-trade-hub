import { useNavigate, Link } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { AILinkingSection } from "@/components/seo";
import { EarlyPartnerOffer } from "@/components/landing/EarlyPartnerOffer";
import { usePartnerCounts } from "@/hooks/usePartnerCounts";
import LiveBuyerDemandSection from "@/components/landing/LiveBuyerDemandSection";
import heroBgSeller from "@/assets/hero-bg-seller.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import {
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  Brain,
  Eye,
  ShieldCheck,
  Ban,
  Scale,
  Lock,
  Send,
  Users,
  Handshake,
} from "lucide-react";

// 3. How Demand Reaches You — compressed, no per-step descriptions
const demandFlow = [
  { step: 1, title: "Buyer submits requirement", icon: Send },
  { step: 2, title: "AI structures the RFQ", icon: Brain },
  { step: 3, title: "Relevant suppliers notified", icon: Users },
  { step: 4, title: "Sealed bidding + fulfilment", icon: Handshake },
];

// 4. What Suppliers Actually Gain — outcome-driven
const supplierBenefits = [
  { title: "Access to active RFQs", description: "Not listings — real purchase demand.", icon: Eye },
  { title: "No cold outreach", description: "Buyers come to you through matched RFQs.", icon: Ban },
  { title: "No lead buying", description: "You bid on verified requirements only.", icon: ShieldCheck },
  { title: "Verified buyers", description: "Every RFQ is screened before routing.", icon: CheckCircle2 },
  { title: "Fair competition", description: "Sealed bids, structured comparison.", icon: Scale },
];

// 5. RFQ Quality Controls
const qualityControls = [
  "Buyer verification before RFQ goes live",
  "Specification completeness checks",
  "Category-based supplier routing",
  "Capacity-aware matching",
  "No bulk RFQ blasting",
];

// 6. Trust Model — 3 tight blocks
const trustBlocks = [
  { title: "AI Matching", desc: "No contact selling. Suppliers reach buyers through structured RFQs.", icon: Brain },
  { title: "Protected Identities", desc: "Both sides stay anonymous until award.", icon: Lock },
  { title: "Pay on Success", desc: "No upfront fees. A small service fee only on closed deals.", icon: Shield },
];

// 8. FAQ — trimmed to 4
const supplierFAQs = [
  {
    question: "Do you sell leads?",
    answer: "No. ProcureSaathi does not sell leads or buyer contact information. Suppliers are matched to verified buyer requirements through AI-detected demand signals."
  },
  {
    question: "Is onboarding free? What does it cost to bid?",
    answer: "Onboarding is completely free. Reverse auctions are 100% free — no bid fees ever. Forward auctions are also free to bid; the first 100 verified suppliers (register by 15th August 2026) get 1 Year Forward-Auction Premium Access free. The only optional cost is email notifications: every supplier gets 2 free email alerts per day, and extra alerts are available via a one-time ₹500 pack of 200 emails (no expiry, until consumed) — the same pack covers both forward and reverse."
  },
  {
    question: "Who sees my details?",
    answer: "Buyer and supplier identities are protected during bidding. Your company details are revealed only after a deal is awarded and both parties proceed to fulfilment."
  },
  {
    question: "How are RFQs matched?",
    answer: "RFQs are routed by category, capability and capacity — not by listings or bulk blasts. Only suppliers genuinely able to fulfil the requirement are notified."
  }
];

const Seller = () => {
  const navigate = useNavigate();
  const { supplierCount, logisticsCount, isLoading } = usePartnerCounts();

  useSEO({
    title: "Access Verified Buyer Demand — Not Leads | ProcureSaathi Suppliers",
    description: "AI routes real RFQs to qualified suppliers based on capability, not listings. No lead selling. Demand-first onboarding.",
    canonical: "https://procuresaathi.com/seller",
    keywords: "B2B supplier portal, verified RFQs, AI buyer matching, no lead selling, demand-first onboarding, sealed bidding"
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Access Verified Buyer Demand — ProcureSaathi Supplier Portal",
      "description": "AI routes real RFQs to qualified suppliers based on capability, not listings.",
      "url": "https://procuresaathi.com/seller",
      "mainEntity": {
        "@type": "Service",
        "name": "AI-Powered Supplier Matching",
        "provider": { "@type": "Organization", "name": "ProcureSaathi" },
        "serviceType": "B2B Supplier Discovery",
        "areaServed": "Worldwide"
      }
    }, 'seller-webpage-schema');

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Supplier Portal", url: "https://procuresaathi.com/seller" }
    ]), 'seller-breadcrumb-schema');

    injectStructuredData(getFAQSchema(supplierFAQs), "seller-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* 1. HERO — sharpened */}
      <section className="relative py-16 md:py-20 lg:py-24 overflow-hidden">
        <img
          src={heroBgSeller}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'contrast(0.95) brightness(0.85)' }}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/55 to-background/70" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-md border border-white/20 mb-6 shadow-lg">
              <Brain className="h-4 w-4 text-warning" />
              <span className="text-xs font-bold tracking-[0.16em] text-warning uppercase">Demand-first onboarding</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-extrabold mb-5">
              Access Verified Buyer Demand — <span className="text-primary">Not Leads</span>
            </h1>

            <p className="text-lg md:text-xl text-foreground font-semibold mb-8 max-w-2xl mx-auto">
              AI routes real RFQs to qualified suppliers based on capability, not listings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                size="lg"
                className="h-12 md:h-14 px-8 text-base font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => navigate('/demand')}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                View Live Demand
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 md:h-14 px-8 text-base font-semibold bg-background/20 backdrop-blur-md border-white/30 text-foreground hover:bg-background/30"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Join as Supplier
              </Button>
            </div>
            <p className="text-xs text-foreground/80 font-semibold mt-4 tracking-wide">
              Verified RFQs • No lead selling • Demand-first onboarding
            </p>
          </div>
        </div>
      </section>

      {/* 2. DEMAND PROOF — moved up, the core hook */}
      <LiveBuyerDemandSection />

      {/* 3. HOW DEMAND REACHES YOU — tight, no per-step explanations */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold tracking-[0.16em] text-primary uppercase mb-2">Process</div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">How Demand Reaches You</h2>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {demandFlow.map((item) => (
              <li
                key={item.step}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  0{item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground leading-snug">{item.title}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. WHAT SUPPLIERS ACTUALLY GAIN — outcome-driven */}
      <section className="py-14 bg-[hsl(var(--muted))]/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold tracking-[0.16em] text-primary uppercase mb-2">Commercial outcomes</div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">What Suppliers Actually Gain</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {supplierBenefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="group border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                    <benefit.icon className="h-5 w-5 text-warning" />
                  </div>
                  <h3 className="font-display font-semibold text-base mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CONTROL & QUALITY LAYER — new */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="text-xs font-semibold tracking-[0.16em] text-primary uppercase mb-2">Control layer</div>
              <h2 className="text-2xl md:text-3xl font-display font-bold">How We Control RFQ Quality</h2>
              <p className="text-muted-foreground mt-2 text-sm">Suppliers see fewer, sharper opportunities — not noise.</p>
            </div>

            <ul className="grid sm:grid-cols-2 gap-3">
              {qualityControls.map((control) => (
                <li
                  key={control}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{control}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. TRUST MODEL — reframed, 3 tight blocks */}
      <section className="py-14 bg-[hsl(var(--muted))]/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="text-xs font-semibold tracking-[0.16em] text-success uppercase mb-2">Trust model</div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">No Lead Selling. No Data Leakage.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {trustBlocks.map((b) => (
              <Card key={b.title} className="border-success/20 bg-card">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                    <b.icon className="h-5 w-5 text-success" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EARLY PROGRAM — moved down, reframed as selective */}
      <Suspense fallback={null}>
        <EarlyPartnerOffer
          showCountdown={true}
          showNumbers={true}
          supplierCount={isLoading ? 38 : supplierCount}
          logisticsCount={isLoading ? 5 : logisticsCount}
          ctaLabel="Apply for Early Access"
          onCTAClick={() => navigate('/signup?role=supplier')}
        />
      </Suspense>

      {/* 8. FAQ — trimmed */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {supplierFAQs.map((faq, idx) => (
              <Card key={idx} className="border-border/60">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA — sharpened */}
      <section className="py-16 gradient-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-3">
              Start Receiving Verified RFQs
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/85 mb-8">
              Get matched to real buyer demand — not databases.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Join as Supplier
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base font-semibold bg-white/10 text-primary-foreground border-white/40 hover:bg-white/20"
                onClick={() => navigate('/demand')}
              >
                View Demand
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Steel Intelligence Hubs */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-foreground mb-5 text-center">Steel Intelligence Hubs</h2>
          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link to="/steel-comparisons" className="rounded-xl border border-border bg-background p-4 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm">
              Grade Comparisons
            </Link>
            <Link to="/industrial-use-cases" className="rounded-xl border border-border bg-background p-4 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm">
              Industrial Use Cases
            </Link>
            <Link to="/global-sourcing-countries" className="rounded-xl border border-border bg-background p-4 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm">
              Global Trade Hub
            </Link>
            <Link to="/demand" className="rounded-xl border border-border bg-background p-4 text-center font-semibold text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors text-sm">
              Live Demand
            </Link>
          </div>
        </div>
      </section>

      <AILinkingSection
        title="Related Resources for Suppliers"
        links={[
          { title: "Supplier Discovery Guide", url: "/find-verified-b2b-suppliers", description: "How buyers find you", emoji: "🔍" },
          { title: "Export-Import Guide", url: "/export-import-sourcing-guide", description: "International trade", emoji: "🌍" },
          { title: "AI Procurement Guide", url: "/ai-b2b-procurement-platform-guide", description: "Platform overview", emoji: "🤖" }
        ]}
      />

      <section className="py-8 text-center bg-muted/20">
        <Button
          variant="link"
          className="text-muted-foreground font-medium"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </section>

      <StickySignupBanner />
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
    </div>
  );
};

export default Seller;
