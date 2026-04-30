import { useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Sparkles,
  ArrowRight,
  ChevronDown,
  MessageSquare,
  Send,
  Bot,
  Users,
  Award,
  Gavel,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import heroBgProcurement from '@/assets/hero-bg-procurement.jpg';
import { useAuth } from '@/hooks/useAuth';
import {
  useSEO,
  injectStructuredData,
  getOrganizationSchema,
} from '@/hooks/useSEO';
import { PageHeader } from '@/components/landing/PageHeader';
import { HeroTrustBadges } from '@/components/landing/HeroTrustBadges';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { SupplierTrustSection } from '@/components/landing/SupplierTrustSection';
import { QuoteComparisonSection } from '@/components/landing/QuoteComparisonSection';
import FloatingWhatsApp from '@/components/conversion/FloatingWhatsApp';
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_CONCIERGE_MESSAGE } from '@/lib/whatsapp';
import { trackEvent } from '@/lib/analytics';

const Footer = lazy(() =>
  import('@/components/landing/Footer').then((m) => ({ default: m.Footer })),
);

const Index = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  useSEO({
    title:
      'ProcureSaathi | AI Operating System for Procurement',
    description:
      'AI Operating System for Procurement that creates real supplier competition for better pricing — via sealed reverse auctions across your existing and verified suppliers.',
    canonical: 'https://www.procuresaathi.com/',
    keywords:
      'AI procurement platform, reverse auction software, B2B procurement India, RFQ software, sealed bidding, supplier competition, procurement cost savings',
    ogImage: 'https://www.procuresaathi.com/og-early-adopter.png',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });

  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');

    const softwareAppSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ProcureSaathi',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'AI-powered B2B procurement platform with reverse auctions, sealed RFQs and audit-ready price trail.',
      url: 'https://www.procuresaathi.com',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free for buyers and free for suppliers to bid',
      },
    };
    injectStructuredData(softwareAppSchema, 'software-app-schema');
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const capabilities = [
    { icon: Gavel, title: 'Reverse auctions', desc: 'Live, sealed, time-boxed.' },
    { icon: ClipboardList, title: 'Sealed RFQs', desc: 'Structured specs, fair comparison.' },
    { icon: ShieldCheck, title: 'Audit trail', desc: 'Every bid, every move, immutable.' },
    { icon: BarChart3, title: 'Savings reporting', desc: 'CFO-ready cost-out evidence.' },
  ];

  const faqs = [
    {
      q: 'What is ProcureSaathi?',
      a: 'A B2B procurement platform that runs real reverse auctions between your existing vendors and a verified supplier network — so you discover the true market price instead of negotiating on guesses.',
    },
    {
      q: 'How do reverse auctions work?',
      a: 'You post a requirement, suppliers are invited to a time-boxed sealed auction, and prices fall as they compete. You see every bid in real time and award when you’re ready.',
    },
    {
      q: 'Is it free for buyers?',
      a: 'Yes. Buyers post requirements and run auctions for free. The platform earns a small fee only on successful awards.',
    },
    {
      q: 'Can I use my existing vendors?',
      a: 'Yes — and you should. Invite your current suppliers alongside ours. They compete together; you don’t have to switch vendors to get a better price.',
    },
    {
      q: 'How fast do I get quotes?',
      a: 'Most auctions close in 15–30 minutes. Managed (concierge) auctions typically deliver competitive quotes within 24–48 hours.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <main>
        {/* ===== HERO — cinematic dark + 3D visual (Cognilix-grade polish) ===== */}
        <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28 overflow-hidden bg-[hsl(222_70%_8%)]">
          {/* Industrial photo as visible base layer */}
          <img
            src={heroBgProcurement}
            alt=""
            role="presentation"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover opacity-[0.32] contrast-110 saturate-105"
          />
          {/* Cinematic gradient veil — readability first, photo as atmosphere */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, hsl(222 75% 6% / 0.94) 0%, hsl(222 70% 8% / 0.82) 45%, hsl(222 65% 9% / 0.62) 100%), linear-gradient(180deg, hsl(222 75% 6% / 0.78) 0%, hsl(222 70% 8% / 0.55) 50%, hsl(222 75% 6% / 0.85) 100%)',
            }}
          />
          {/* Brand glow — gold from top-right, primary from bottom-left */}
          <div
            aria-hidden
            className="absolute -top-40 -right-32 w-[640px] h-[640px] rounded-full blur-[120px] opacity-30 pointer-events-none"
            style={{ background: 'hsl(var(--gold) / 0.55)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-40 w-[560px] h-[560px] rounded-full blur-[120px] opacity-35 pointer-events-none"
            style={{ background: 'hsl(220 100% 55% / 0.45)' }}
          />
          {/* Subtle grid texture */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid xl:grid-cols-12 gap-10 xl:gap-12 items-center">
              {/* LEFT — copy + CTAs */}
              <div className="xl:col-span-7 text-center xl:text-left max-w-2xl mx-auto xl:mx-0 xl:max-w-none">

                {/* Eyebrow pills */}
                <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2 mb-6 animate-fade-in">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                    </span>
                    <span className="text-white/90 text-[11.5px] font-semibold tracking-wide">
                      AI Operating System for Procurement
                    </span>
                  </div>
                  <Link
                    to="/global-sourcing-countries"
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 hover:bg-white/[0.1] hover:border-white/20 transition-all"
                    aria-label="Explore global sourcing across countries"
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
                  style={{
                    fontSize: 'clamp(36px, 6.4vw, 68px)',
                    animationDelay: '60ms',
                  }}
                >
                  AI Operating System
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        'linear-gradient(135deg, hsl(38 95% 65%) 0%, hsl(38 88% 52%) 45%, hsl(220 100% 75%) 100%)',
                    }}
                  >
                    for Procurement
                  </span>
                </h1>

                <p
                  className="text-[16px] sm:text-lg text-white/80 mb-3 max-w-xl mx-auto xl:mx-0 animate-fade-in leading-relaxed"
                  style={{ animationDelay: '120ms' }}
                >
                  Designed to create <strong className="text-gold">real supplier competition</strong> for better pricing across your verified suppliers.
                </p>

                <p
                  className="text-[14px] sm:text-[15px] text-white/65 mb-2 max-w-xl mx-auto xl:mx-0 animate-fade-in leading-relaxed"
                  style={{ animationDelay: '150ms' }}
                >
                  Post your requirement once. Receive and compare quotes in one place.
                </p>

                <p
                  className="text-[13px] sm:text-[14px] text-white/55 mb-7 max-w-xl mx-auto xl:mx-0 animate-fade-in"
                  style={{ animationDelay: '180ms' }}
                >
                  Works with your existing suppliers <span className="text-gold font-semibold">+</span> our verified network. No vendor switching required.
                </p>

                {/* CTAs — Primary + WhatsApp secondary */}
                <div
                  className="flex flex-col sm:flex-row gap-3 justify-center xl:justify-start items-center animate-fade-in mb-6"
                  style={{ animationDelay: '240ms' }}
                >
                  <Button
                    size="lg"
                    className="h-12 px-7 text-[15px] font-semibold shadow-[0_10px_40px_-10px_hsl(38_88%_52%/0.6)] hover:shadow-[0_15px_50px_-10px_hsl(38_88%_52%/0.8)] bg-gradient-to-r from-gold to-[hsl(32_92%_48%)] hover:opacity-95 text-[hsl(222_75%_10%)] transition-all w-full sm:w-auto border-0"
                    onClick={() => {
                      trackEvent('cta_click', { source: 'hero_primary', label: 'get_better_price_now' });
                      navigate('/post-rfq');
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Better Price Now
                    <ArrowRight className="h-4 w-4 ml-2 opacity-80" />
                  </Button>
                  <a
                    href={buildWhatsAppLink(WHATSAPP_DEFAULT_MESSAGE)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('whatsapp_click', { source: 'hero_secondary' })}
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md text-[15px] font-semibold bg-[#25D366] hover:bg-[#1da851] text-white shadow-md transition-all w-full sm:w-auto"
                  >
                    <svg viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M16.001 3.2c-7.07 0-12.8 5.73-12.8 12.8 0 2.26.59 4.46 1.71 6.4L3.2 28.8l6.58-1.72a12.76 12.76 0 0 0 6.22 1.6h.01c7.06 0 12.79-5.73 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05A12.72 12.72 0 0 0 16 3.2zm5.81 16.39c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.4-.01-.61-.01-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.62 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.38 4.75.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z"/>
                    </svg>
                    Send Requirement on WhatsApp
                  </a>
                </div>

                {/* Microcopy line */}
                <div
                  className="flex flex-wrap items-center justify-center xl:justify-start gap-x-4 gap-y-1.5 text-[12px] text-white/55 animate-fade-in mb-6"
                  style={{ animationDelay: '300ms' }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    No signup required • No cost to try
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gold" />
                    Multiple suppliers compete on every RFQ
                  </span>
                </div>

                {/* RFQ chips — compact, glassy */}
                <div
                  className="animate-fade-in"
                  style={{ animationDelay: '340ms' }}
                >
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/45 mb-2.5 text-center xl:text-left">
                    Try a 30-second requirement
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center xl:justify-start">
                    {[
                      { label: 'TMT Bars', q: 'TMT bars Fe 500D, monthly requirement' },
                      { label: 'MS Pipes', q: 'MS pipes ERW, assorted sizes, 10 MT' },
                      { label: 'Packaging', q: 'Corrugated boxes, 5-ply, 5000 units' },
                      { label: 'Chemicals', q: 'Industrial chemicals — bulk supply' },
                      { label: 'Electricals', q: 'LT cables and switchgear — project lot' },
                    ].map((c) => (
                      <button
                        key={c.label}
                        onClick={() =>
                          navigate(`/post-rfq?prefill=${encodeURIComponent(c.q)}`)
                        }
                        className="px-3.5 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md text-[12px] font-medium text-white/85 border border-white/10 hover:border-gold/40 hover:bg-white/[0.1] hover:text-white transition-all"
                      >
                        + {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — 3D visual (only renders when there's enough space) */}
              <div
                className="hidden xl:block xl:col-span-5 animate-fade-in"
                style={{ animationDelay: '200ms' }}
              >
                <HeroVisual />
              </div>
            </div>

            {/* Bottom strip — trust + reframe */}
            <div
              className="mt-12 lg:mt-16 pt-8 border-t border-white/10 animate-fade-in"
              style={{ animationDelay: '440ms' }}
            >
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <HeroTrustBadges />
                <div className="text-center md:text-right">
                  <p className="text-[13px] text-white/65 max-w-md md:ml-auto leading-relaxed">
                    If you're already negotiating with suppliers, you're leaving competitive pricing on the table.
                  </p>
                  <p className="mt-1 text-[12px] italic text-white/45">
                    We don't replace your process — we improve your outcome.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAND — No Vendor Disruption ===== */}
        <section className="py-10 sm:py-14 bg-card border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-6 sm:mb-8">
                <div className="text-[10.5px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.16em] mb-2">
                  No vendor disruption required
                </div>
                <h2 className="text-[20px] sm:text-[26px] font-display font-bold tracking-tight text-foreground">
                  Keep your existing suppliers. Just unlock better pricing.
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-5">
                {[
                  {
                    t: 'Use your existing suppliers',
                    d: 'Invite your current vendors to compete in sealed auctions — no need to switch.',
                  },
                  {
                    t: 'Add new verified suppliers',
                    d: 'Optionally widen the pool with our verified network for stronger competition.',
                  },
                  {
                    t: 'Stay in full control',
                    d: 'You choose who participates, you award the bid, you keep the relationship.',
                  },
                ].map((b) => (
                  <div
                    key={b.t}
                    className="flex gap-3 p-4 sm:p-5 rounded-xl bg-background border border-border"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[14px] font-semibold text-foreground mb-1 leading-snug">
                        {b.t}
                      </div>
                      <div className="text-[12.5px] text-muted-foreground leading-relaxed">
                        {b.d}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* ===== SUPPLIER TRUST ===== */}
        <SupplierTrustSection />

        {/* ===== QUOTE COMPARISON PREVIEW (decision view) ===== */}
        <QuoteComparisonSection />

        {/* ===== BUYERS + SUPPLIERS ===== */}
        <section className="py-12 sm:py-24 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-8 sm:mb-12">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-3">
                  Who it's for
                </div>
                <h2 className="text-[22px] sm:text-[32px] font-display font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-[1.15]">
                  Built for buyers and suppliers
                </h2>
                <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
                  One platform, two sides of the table. Buyers run structured sourcing. Suppliers see real demand.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6">
                {[
                  {
                    label: 'For Buyers',
                    items: [
                      { t: 'Run RFQs & reverse auctions', d: 'Sealed, time-boxed, fully structured.' },
                      { t: 'Invite existing + new suppliers', d: 'Your vendors compete alongside ours.' },
                      { t: 'Audit-ready price trail', d: 'Every bid and award captured immutably.' },
                    ],
                  },
                  {
                    label: 'For Suppliers',
                    items: [
                      { t: 'Real RFQs, not listings', d: 'Live demand from verified buyers.' },
                      { t: 'Matched to your category', d: 'Only see what fits your capacity.' },
                      { t: 'Free to bid', d: 'No subscription, no per-bid fees.' },
                    ],
                  },
                ].map((col) => (
                  <div
                    key={col.label}
                    className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:px-8 sm:py-9 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                  >
                    <div className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-3 sm:mb-6 pb-2.5 sm:pb-4 border-b border-border">
                      {col.label}
                    </div>
                    <ul className="space-y-3 sm:space-y-5">
                      {col.items.map((it) => (
                        <li key={it.t} className="flex gap-2 sm:gap-3.5">
                          <div className="mt-[6px] sm:mt-[7px] h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] sm:text-[14.5px] font-semibold text-foreground leading-snug">
                              {it.t}
                            </div>
                            <div className="hidden sm:block text-[13.5px] text-muted-foreground mt-1 leading-relaxed">
                              {it.d}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CAPABILITIES — deep navy with gold accent ===== */}
        <section className="py-12 sm:py-20 lg:py-24 bg-brand text-brand-foreground relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: 'hsl(var(--primary) / 0.5)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'hsl(var(--gold) / 0.3)' }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-10 sm:mb-12">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="h-px w-6 bg-gold" />
                  <span className="text-[10.5px] sm:text-[11px] font-semibold text-gold uppercase tracking-[0.16em]">
                    Platform
                  </span>
                </div>
                <h2 className="text-[24px] sm:text-[34px] font-display font-bold tracking-tight mb-4 leading-[1.1]">
                  Procurement infrastructure,
                  <br className="hidden sm:block" />
                  <span className="text-brand-foreground/70">not a marketplace</span>
                </h2>
                <p className="text-[14px] sm:text-[15px] text-brand-foreground/70 leading-relaxed max-w-xl">
                  Everything you need to run sourcing with discipline — auctions, sealed RFQs, an immutable audit trail and CFO-ready reporting.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {capabilities.map((c, i) => (
                  <div
                    key={c.title}
                    className="group relative bg-brand-soft/40 backdrop-blur-sm border border-brand-foreground/10 rounded-xl p-4 sm:p-6 hover:border-gold/40 hover:bg-brand-soft/60 transition-all"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mb-3 sm:mb-4 group-hover:from-gold/30 group-hover:to-gold/10 group-hover:border-gold/40 transition-colors">
                      <c.icon className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px] text-brand-foreground" strokeWidth={2} />
                    </div>
                    <div className="font-semibold text-[13px] sm:text-[15px] mb-1 sm:mb-1.5 leading-snug">{c.title}</div>
                    <div className="text-[11.5px] sm:text-[13px] text-brand-foreground/65 leading-relaxed">
                      {c.desc}
                    </div>
                  </div>
                ))}
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
                    Don't want to manage auctions? We'll run them for you.
                  </p>
                  <p className="text-[13px] sm:text-[13.5px] text-muted-foreground leading-relaxed">
                    Share your requirement on WhatsApp. Our team negotiates. You only review and approve.
                  </p>
                </div>
                <a
                  href={buildWhatsAppLink(WHATSAPP_CONCIERGE_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('whatsapp_click', { source: 'concierge_card' })}
                  className="inline-flex items-center justify-center gap-1 h-11 px-5 rounded-md text-sm font-semibold shrink-0 bg-gradient-to-br from-[#25D366] to-[#1da851] hover:opacity-95 text-white shadow-md w-full sm:w-auto transition-all"
                >
                  Send on WhatsApp
                  <ArrowRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA — brand gradient, gold ring ===== */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-gradient-brand text-brand-foreground rounded-2xl px-8 py-12 sm:px-14 sm:py-16 relative overflow-hidden shadow-xl border border-brand-soft">
              <div
                aria-hidden
                className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'hsl(var(--primary) / 0.4)' }}
              />
              <div
                aria-hidden
                className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40"
                style={{ background: 'hsl(var(--gold) / 0.4)' }}
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
                  Stop overpaying for procurement
                </h2>
                <p className="text-[14.5px] sm:text-base text-brand-foreground/75 mb-8 leading-relaxed max-w-lg">
                  Run your first reverse auction today. No setup fees, no contracts — pay only when you save.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-[15px] font-semibold bg-gold hover:bg-gold/90 text-gold-foreground shadow-gold border-0"
                    onClick={() => {
                      trackEvent('cta_click', { source: 'final_cta', label: 'get_better_price_now' });
                      navigate('/post-rfq');
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Better Price Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-[15px] font-semibold bg-transparent border-brand-foreground/25 text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground hover:border-brand-foreground/40 shadow-none"
                    onClick={() => navigate('/contact')}
                  >
                    Talk to Sales
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ===== FAQ — max 5 ===== */}
        <section className="py-14 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-center tracking-tight mb-10">
                Frequently asked
              </h2>
              <div className="divide-y divide-border border-y border-border">
                {faqs.map((f) => (
                  <Collapsible key={f.q}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-4 text-left group">
                      <span className="text-[15px] font-medium text-foreground">
                        {f.q}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pb-4 -mt-1 text-[14.5px] text-muted-foreground leading-relaxed">
                      {f.a}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Mobile sticky CTA — single ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <Button
          className="w-full h-11 font-semibold"
          onClick={() => {
            trackEvent('cta_click', { source: 'mobile_sticky', label: 'get_better_price_now' });
            navigate('/post-rfq');
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Get Better Price Now
        </Button>
      </div>

      {/* Floating WhatsApp button — sticky right side */}
      <FloatingWhatsApp />

      {/* Footer */}
      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
