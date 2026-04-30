import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PostRFQModal } from "@/components/PostRFQModal";
import { PageHeader } from "@/components/landing/PageHeader";
import { QuoteComparisonSection } from "@/components/landing/QuoteComparisonSection";
import { SupplierTrustSection } from "@/components/landing/SupplierTrustSection";
import { GlobalProcurementCorridors } from "@/components/GlobalProcurementCorridors";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { AILinkingSection } from "@/components/seo";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_CONCIERGE_MESSAGE } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import heroBgBuyer from "@/assets/hero-bg-buyer.jpg";

const ExitIntentPopup = lazy(() =>
  import("@/components/landing/ExitIntentPopup").then((m) => ({ default: m.ExitIntentPopup })),
);

import {
  ArrowRight,
  Sparkles,
  ChevronDown,
  Send,
  Bot,
  ClipboardCheck,
  Globe,
  CheckCircle2,
  Eye,
  Scale,
  ShieldCheck,
  Ban,
  XCircle,
  Package,
  Building2,
  MessageSquare,
  Users,
  Gavel,
  ClipboardList,
  BarChart3,
} from "lucide-react";

const buyerProfiles = [
  { title: "Bulk buyers sourcing recurring materials", desc: "Ongoing procurement with supplier consistency.", icon: Package },
  { title: "Project-based procurement teams", desc: "Compare multiple suppliers for each requirement.", icon: Building2 },
  { title: "Importers sourcing from India", desc: "Access verified manufacturers for export.", icon: Globe },
  { title: "Businesses needing price transparency", desc: "Clear comparison without negotiation loops.", icon: Scale },
];

const steps = [
  { icon: Send, title: "Post your requirement", desc: "Text, voice or upload — takes about 30 seconds." },
  { icon: Bot, title: "AI matches relevant suppliers", desc: "Verified suppliers in your category are invited automatically." },
  { icon: ClipboardCheck, title: "Receive and compare quotes", desc: "Every quote in one structured view — decide without follow-ups." },
];

const capabilities = [
  { icon: Gavel, title: "Reverse auctions", desc: "Live, sealed, time-boxed." },
  { icon: ClipboardList, title: "Sealed RFQs", desc: "Structured specs, fair comparison." },
  { icon: ShieldCheck, title: "Audit trail", desc: "Every bid, every move, immutable." },
  { icon: BarChart3, title: "Savings reporting", desc: "CFO-ready cost-out evidence." },
];

const buyerAdvantages = [
  { title: "Transparency", description: "Clear line-item quotes. No hidden costs.", icon: Eye },
  { title: "No obligation to award", description: "Review quotes freely before deciding.", icon: Scale },
  { title: "Line-item comparison", description: "Evaluate suppliers side-by-side.", icon: ClipboardCheck },
  { title: "Compliance & quality control", description: "Verified suppliers with business validation.", icon: ShieldCheck },
  { title: "No supplier spam", description: "Your details remain protected.", icon: Ban },
  { title: "Existing + new suppliers", description: "Invite your vendors alongside our verified network.", icon: Users },
];

const whatWeAreNot = [
  "Not a supplier directory",
  "Not a lead marketplace",
  "Not cold calling or contact selling",
];

const buyerFAQs = [
  {
    question: "What is ProcureSaathi?",
    answer: "An AI-powered B2B procurement platform that helps buyers structure RFQs, reach verified suppliers and compare quotes in one place — without supplier spam.",
  },
  {
    question: "How is this different from a marketplace?",
    answer: "Marketplaces sell leads or list directories. ProcureSaathi runs a structured RFQ process — suppliers are screened before they receive your requirement.",
  },
  {
    question: "Are supplier quotes comparable?",
    answer: "Yes. Quotes land in one structured view with price, delivery, payment terms and notes — so you can decide without chasing follow-ups.",
  },
  {
    question: "Is buyer data shared?",
    answer: "Buyer details remain protected. ProcureSaathi manages supplier interaction within a controlled process.",
  },
  {
    question: "Can I use it for export sourcing?",
    answer: "Yes. Buyers from USA, UK, Europe, Germany and Singapore source from verified Indian manufacturers via ProcureSaathi.",
  },
  {
    question: "Are suppliers verified?",
    answer: "Suppliers are screened with GST and business verification before receiving RFQs — to ensure relevant, reliable responses.",
  },
];

const Buyer = () => {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);

  useSEO({
    title: "AI-Powered B2B Procurement for Smarter Sourcing | ProcureSaathi",
    description: "Post one RFQ. Compare verified supplier quotes side-by-side — price, delivery, terms — in one structured view. Buyer details protected.",
    keywords: "AI procurement platform, B2B sourcing India, verified suppliers, RFQ platform, supplier quote comparison, managed procurement, export sourcing",
    canonical: "https://procuresaathi.com/buyer",
    ogImage: "/og-early-adopter.png",
  });

  useEffect(() => {
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "AI-Powered B2B Procurement for Smarter Sourcing - ProcureSaathi",
      description: "Post one RFQ. Compare verified supplier quotes in one structured view.",
      url: "https://procuresaathi.com/buyer",
      mainEntity: {
        "@type": "Service",
        name: "AI-Powered B2B Procurement",
        provider: { "@type": "Organization", name: "ProcureSaathi" },
        serviceType: "Managed B2B Procurement Platform",
        areaServed: "Worldwide",
      },
    }, "buyer-page-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Buyer Portal", url: "https://procuresaathi.com/buyer" },
    ]), "buyer-breadcrumb-schema");

    injectStructuredData(getFAQSchema(buyerFAQs), "buyer-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <main>
        {/* ===== HERO — cinematic dark + gold/navy gradient (homepage parity) ===== */}
        <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28 overflow-hidden bg-[hsl(222_70%_8%)]">
          <img
            src={heroBgBuyer}
            alt=""
            role="presentation"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.32] contrast-110 saturate-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, hsl(222 75% 6% / 0.94) 0%, hsl(222 70% 8% / 0.82) 45%, hsl(222 65% 9% / 0.62) 100%), linear-gradient(180deg, hsl(222 75% 6% / 0.78) 0%, hsl(222 70% 8% / 0.55) 50%, hsl(222 75% 6% / 0.85) 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-40 -right-32 w-[640px] h-[640px] rounded-full blur-[120px] opacity-30 pointer-events-none"
            style={{ background: "hsl(var(--gold) / 0.55)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full blur-[120px] opacity-35 pointer-events-none"
            style={{ background: "hsl(220 100% 55% / 0.45)" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Eyebrow pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                  </span>
                  <span className="text-white/90 text-[11.5px] font-semibold tracking-wide">
                    For Buyers · Managed Procurement
                  </span>
                </div>
                <Link
                  to="/global-sourcing-countries"
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all"
                >
                  <Globe className="h-3 w-3 text-gold" />
                  <span className="text-white/90 text-[11.5px] font-semibold tracking-wide">
                    Global sourcing available
                  </span>
                  <ArrowRight className="h-3 w-3 text-white/70 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <h1
                className="font-display font-extrabold mb-5 leading-[1.02] tracking-tight animate-fade-in text-white"
                style={{ fontSize: "clamp(34px, 5.6vw, 60px)", animationDelay: "60ms" }}
              >
                AI-Powered Procurement
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, hsl(38 95% 65%) 0%, hsl(38 88% 52%) 45%, hsl(220 100% 75%) 100%)",
                  }}
                >
                  for Smarter Sourcing
                </span>
              </h1>

              <p
                className="text-[16px] sm:text-lg text-white/80 mb-3 max-w-xl mx-auto animate-fade-in leading-relaxed"
                style={{ animationDelay: "120ms" }}
              >
                Post one RFQ. AI structures it and invites <strong className="text-gold">verified suppliers</strong> to bid.
              </p>

              <p
                className="text-[14px] sm:text-[15px] text-white/65 mb-8 max-w-xl mx-auto animate-fade-in leading-relaxed"
                style={{ animationDelay: "150ms" }}
              >
                Every quote lands in one structured view. Compare price, delivery and terms without chasing follow-ups.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in mb-6"
                style={{ animationDelay: "240ms" }}
              >
                <Button
                  size="lg"
                  className="h-12 px-7 text-[15px] font-semibold shadow-[0_10px_40px_-10px_hsl(38_88%_52%/0.6)] hover:shadow-[0_15px_50px_-10px_hsl(38_88%_52%/0.8)] bg-gradient-to-r from-gold to-[hsl(32_92%_48%)] hover:opacity-95 text-[hsl(222_75%_10%)] transition-all w-full sm:w-auto border-0"
                  onClick={() => {
                    trackEvent("cta_click", { source: "buyer_hero_primary", label: "post_rfq" });
                    setShowRFQModal(true);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Post RFQ — Free
                  <ArrowRight className="h-4 w-4 ml-2 opacity-80" />
                </Button>
                <a
                  href={buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { source: "buyer_hero_secondary" })}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-[15px] font-semibold bg-[#25D366] hover:bg-[#1da851] text-white shadow-md transition-all w-full sm:w-auto"
                >
                  <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.58-1.72a12.76 12.76 0 0 0 6.22 1.6h.01c7.06 0 12.79-5.73 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05A12.72 12.72 0 0 0 16 3.2zm5.81 16.39c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.4-.01-.61-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
                  </svg>
                  Send Requirement on WhatsApp
                </a>
              </div>

              <div
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-white/55 animate-fade-in"
                style={{ animationDelay: "300ms" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Verified suppliers only
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                  Buyer details protected
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-emerald-400" />
                  No obligation to award
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== DECISION VIEW (white) — moved high for trust ===== */}
        <QuoteComparisonSection />

        {/* ===== WHO THIS IS FOR — light grey band ===== */}
        <section className="py-12 sm:py-20 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-8 sm:mb-12">
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.16em] mb-2.5">
                  Who it's for
                </div>
                <h2 className="text-[22px] sm:text-[32px] font-display font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-[1.15]">
                  Built for teams that buy regularly or at scale
                </h2>
                <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
                  From recurring bulk orders to project-based sourcing — structured procurement, without the chaos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                {buyerProfiles.map((p) => (
                  <div
                    key={p.title}
                    className="flex items-start gap-3.5 p-4 sm:p-5 rounded-xl bg-card border border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
                      <p.icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-[14.5px] font-semibold text-foreground leading-snug mb-1">
                        {p.title}
                      </div>
                      <div className="text-[13px] text-muted-foreground leading-relaxed">
                        {p.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS — vertical numbered list (homepage pattern) ===== */}
        <section className="py-12 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16">
              <div className="lg:col-span-4 max-w-2xl">
                <div className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-2 sm:mb-3">
                  How it works
                </div>
                <h2 className="text-[22px] sm:text-[32px] font-display font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-[1.15]">
                  From requirement to quotes — in three steps
                </h2>
                <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
                  Post once. Suppliers respond. You compare in one place.
                </p>
              </div>

              <div className="lg:col-span-8">
                <ol className="grid grid-cols-2 gap-2.5 lg:hidden">
                  {steps.map((s, i) => (
                    <li
                      key={s.title}
                      className="bg-card border border-border rounded-xl p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/15 text-primary flex items-center justify-center">
                          <s.icon className="h-[14px] w-[14px]" strokeWidth={2} />
                        </div>
                        <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="text-[12.5px] font-semibold text-foreground leading-snug mb-1">
                        {s.title}
                      </h3>
                      <p className="text-[11.5px] text-muted-foreground leading-snug">
                        {s.desc}
                      </p>
                    </li>
                  ))}
                </ol>

                <ol className="relative hidden lg:block">
                  {steps.map((s, i) => (
                    <li
                      key={s.title}
                      className={`flex items-start gap-5 py-5 ${i < steps.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 text-primary flex items-center justify-center">
                        <s.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="text-[11px] font-mono font-semibold text-muted-foreground tracking-wider">
                            0{i + 1}
                          </span>
                          <h3 className="text-[15.5px] font-semibold text-foreground">
                            {s.title}
                          </h3>
                        </div>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SUPPLIER TRUST (homepage component) ===== */}
        <SupplierTrustSection />

        {/* ===== WHAT WE ARE NOT — chips ===== */}
        <section className="py-12 sm:py-16 bg-card border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-[10.5px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.16em] mb-2.5">
                Positioning
              </div>
              <h2 className="text-[22px] sm:text-[28px] font-display font-bold tracking-tight text-foreground mb-7">
                What ProcureSaathi is <span className="text-destructive">not</span>
              </h2>
              <div className="flex flex-wrap justify-center gap-2.5">
                {whatWeAreNot.map((text) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-border text-[13px] font-medium text-foreground"
                  >
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    {text}
                  </span>
                ))}
              </div>
              <p className="text-[13px] text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">
                Buyer details remain protected. ProcureSaathi manages supplier interaction within a structured process.
              </p>
            </div>
          </div>
        </section>

        {/* ===== CAPABILITIES — deep navy with gold accent (homepage parity) ===== */}
        <section className="py-12 sm:py-20 lg:py-24 bg-brand text-brand-foreground relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "hsl(var(--primary) / 0.5)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: "hsl(var(--gold) / 0.3)" }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-10 sm:mb-12">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="h-px w-6 bg-gold" />
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-gold uppercase tracking-[0.16em]">
                    Buyer advantages
                  </span>
                </div>
                <h2 className="text-[24px] sm:text-[34px] font-display font-bold tracking-tight mb-4 leading-[1.1]">
                  Procurement infrastructure,
                  <br className="hidden sm:block" />
                  <span className="text-brand-foreground/70">built around the buyer</span>
                </h2>
                <p className="text-[14px] sm:text-[15px] text-brand-foreground/70 leading-relaxed max-w-xl">
                  Structured RFQs, sealed bidding, transparent comparison — and an audit trail you can defend in any review.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {buyerAdvantages.map((c) => (
                  <div
                    key={c.title}
                    className="group relative bg-brand-soft/40 backdrop-blur-sm border border-brand-foreground/10 rounded-xl p-4 sm:p-6 hover:border-gold/40 hover:bg-brand-soft/60 transition-all"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-gold/30 group-hover:to-gold/10 group-hover:border-gold/40 transition-colors">
                      <c.icon className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px] text-brand-foreground" strokeWidth={2} />
                    </div>
                    <div className="font-semibold text-[13px] sm:text-[15px] mb-1 sm:mb-1.5 leading-snug">
                      {c.title}
                    </div>
                    <div className="text-[11.5px] sm:text-[13px] text-brand-foreground/65 leading-relaxed">
                      {c.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* Capability strip */}
              <div className="mt-10 pt-8 border-t border-brand-foreground/10">
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-gold uppercase tracking-[0.16em] mb-4">
                  Powered by
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {capabilities.map((c) => (
                    <div
                      key={c.title}
                      className="flex items-start gap-3 p-3 rounded-lg bg-brand-soft/30 border border-brand-foreground/10"
                    >
                      <c.icon className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" strokeWidth={2} />
                      <div>
                        <div className="text-[12.5px] font-semibold leading-snug">{c.title}</div>
                        <div className="text-[11.5px] text-brand-foreground/60 leading-snug mt-0.5">{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONCIERGE — gold-edge accent ===== */}
        <section className="py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto relative">
              <div className="absolute inset-y-4 left-0 w-1 rounded-full bg-gradient-to-b from-gold via-gold/60 to-transparent" />
              <div className="bg-card border border-border rounded-2xl px-6 py-6 sm:px-10 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-5 shadow-medium ml-2">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gold-soft border border-gold/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gold-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] sm:text-[11px] font-semibold text-gold-foreground uppercase tracking-[0.14em] mb-1.5">
                    Managed Procurement · Concierge
                  </div>
                  <p className="text-[15px] sm:text-base font-semibold text-foreground leading-snug mb-1">
                    Don't want to manage the RFQ? We'll run it for you.
                  </p>
                  <p className="text-[13px] sm:text-[13.5px] text-muted-foreground leading-relaxed">
                    Share your requirement on WhatsApp. Our team handles supplier outreach. You only review and approve.
                  </p>
                </div>
                <a
                  href={buildWhatsAppLink(WHATSAPP_CONCIERGE_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { source: "buyer_concierge_card" })}
                  className="inline-flex items-center justify-center gap-1 h-11 px-5 rounded-md text-sm font-semibold shrink-0 bg-gradient-to-br from-[#25D366] to-[#1da851] hover:opacity-95 text-white shadow-md w-full sm:w-auto transition-all"
                >
                  Send on WhatsApp
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA — brand gradient (homepage parity) ===== */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-gradient-brand text-brand-foreground rounded-2xl px-8 py-12 sm:px-14 sm:py-16 relative overflow-hidden shadow-xl border border-brand-soft">
              <div
                aria-hidden
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none"
                style={{ background: "hsl(var(--primary) / 0.4)" }}
              />
              <div
                aria-hidden
                className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40"
                style={{ background: "hsl(var(--gold) / 0.4)" }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
              />
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="h-px w-6 bg-gold" />
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-gold uppercase tracking-[0.16em]">
                    Get started
                  </span>
                </div>
                <h2 className="text-[26px] sm:text-[36px] font-display font-bold tracking-tight mb-4 leading-[1.1]">
                  Start AI-powered procurement
                </h2>
                <p className="text-[14.5px] sm:text-base text-brand-foreground/75 mb-8 leading-relaxed max-w-lg">
                  Post your requirement and receive comparable supplier quotes in one place. No setup fees, no contracts.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-[15px] font-semibold bg-gold hover:bg-gold/90 text-gold-foreground shadow-gold border-0"
                    onClick={() => {
                      trackEvent("cta_click", { source: "buyer_final_cta", label: "post_rfq" });
                      setShowRFQModal(true);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Post RFQ — Free
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-[15px] font-semibold bg-transparent border-brand-foreground/25 text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground hover:border-brand-foreground/40 shadow-none"
                    onClick={() => navigate("/contact")}
                  >
                    Talk to Sales
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FAQ — Collapsible (homepage parity) ===== */}
        <section className="py-14 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-center tracking-tight mb-10">
                Frequently asked
              </h2>
              <div className="divide-y divide-border border-y border-border">
                {buyerFAQs.map((f) => (
                  <Collapsible key={f.question}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-4 text-left group">
                      <span className="text-[15px] font-medium text-foreground">{f.question}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pb-4 -mt-1 text-[14.5px] text-muted-foreground leading-relaxed">
                      {f.answer}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* AI Linking + corridors */}
      <AILinkingSection
        title="Related Resources for Buyers"
        links={[
          { title: "How to Post RFQ Online", url: "/how-to-post-rfq-online", description: "Step-by-step guide", emoji: "📝" },
          { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide", emoji: "🔍" },
          { title: "Enterprise Procurement", url: "/enterprise-procurement-guide", description: "For large organizations", emoji: "🏢" },
        ]}
      />

      <GlobalProcurementCorridors />

      <PostRFQModal open={showRFQModal} onOpenChange={setShowRFQModal} />

      <StickySignupBanner />
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
    </div>
  );
};

export default Buyer;
