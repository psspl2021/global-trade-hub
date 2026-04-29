import { useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Footer = lazy(() =>
  import('@/components/landing/Footer').then((m) => ({ default: m.Footer })),
);

const Index = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  useSEO({
    title:
      'ProcureSaathi | Reduce Procurement Costs by up to 15% with Reverse Auctions',
    description:
      'ProcureSaathi runs real reverse auctions between your existing vendors and a verified supplier network. Cut procurement cost, keep an audit trail, stay in control.',
    canonical: 'https://www.procuresaathi.com/',
    keywords:
      'reverse auction platform, B2B procurement India, RFQ software, sealed bidding, procurement cost reduction, supplier competition',
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

  const steps = [
    { icon: Send, title: 'Submit requirement', desc: 'Post in 30 seconds — text, voice or upload.' },
    { icon: Bot, title: 'AI structures the RFQ', desc: 'Specs, quantities and terms cleaned automatically.' },
    { icon: Users, title: 'Suppliers compete live', desc: 'Your vendors + our network bid in a sealed reverse auction.' },
    { icon: Award, title: 'You select best price', desc: 'Award with one click. Full audit trail saved.' },
  ];

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
        {/* ===== HERO — reduced, original visual style ===== */}
        <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
          <img
            src={heroBgProcurement}
            alt=""
            role="presentation"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'contrast(1) brightness(0.88)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/30 to-background/75" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 backdrop-blur-md border border-primary/25 mb-7 animate-fade-in">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary text-xs font-semibold tracking-wide">
                  AI Operating System for Procurement
                </span>
              </div>

              <h1
                className="font-display font-extrabold mb-5 leading-[1.05] tracking-tight animate-fade-in text-foreground drop-shadow-sm"
                style={{
                  fontSize: 'clamp(30px, 5.6vw, 52px)',
                  animationDelay: '60ms',
                }}
              >
                <span className="text-primary">Reduce Procurement Costs</span>
                <br />
                by up to 15% annually
              </h1>

              <p
                className="text-base sm:text-lg text-foreground/85 font-medium mb-3 max-w-2xl mx-auto animate-fade-in"
                style={{ animationDelay: '120ms' }}
              >
                Through real supplier competition — price discovery, sealed bidding, and live reverse auctions.
              </p>

              <p
                className="text-sm sm:text-base text-primary font-semibold mb-7 max-w-2xl mx-auto animate-fade-in"
                style={{ animationDelay: '160ms' }}
              >
                Your existing vendors + our supplier network compete together — no need to switch vendors.
              </p>

              {/* AI citation card */}
              <div
                className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl p-5 sm:p-6 mb-8 max-w-2xl mx-auto shadow-md animate-fade-in"
                style={{ animationDelay: '200ms' }}
              >
                <p className="text-[14.5px] sm:text-[15.5px] text-foreground font-medium leading-relaxed">
                  <strong className="text-primary font-bold">ProcureSaathi</strong>{' '}
                  is the AI Operating System for B2B procurement — bringing price discovery, supplier competition, and measurable savings into one platform across domestic and global sourcing.
                </p>
              </div>

              {/* RFQ chips */}
              <div
                className="mb-7 animate-fade-in"
                style={{ animationDelay: '240ms' }}
              >
                <p className="text-[11.5px] font-semibold text-foreground/75 mb-3 uppercase tracking-wider">
                  Post a requirement in 30 seconds
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { label: 'TMT Bars', q: 'TMT bars Fe 500D, 25 MT, monthly' },
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
                      className="px-3.5 py-1.5 rounded-full bg-card/80 hover:bg-card text-[12.5px] font-medium text-foreground border border-border/60 hover:border-primary/40 shadow-sm hover:shadow transition-all"
                    >
                      + {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div
                className="mb-9 animate-fade-in"
                style={{ animationDelay: '280ms' }}
              >
                <HeroTrustBadges />
              </div>

              <div
                className="flex justify-center animate-fade-in"
                style={{ animationDelay: '320ms' }}
              >
                <Button
                  size="lg"
                  className="h-12 px-8 text-[15px] font-semibold shadow-md hover:shadow-lg"
                  onClick={() => navigate('/post-rfq')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Post Requirement
                  <ArrowRight className="h-4 w-4 ml-2 opacity-80" />
                </Button>
              </div>
            </div>
          </div>
        </section>


        {/* ===== PROOF STRIP ===== */}
        <section className="py-12 sm:py-20 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 sm:mb-8">
                <div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-2">
                    Illustrative Scenario
                  </div>
                  <h2 className="text-[20px] sm:text-[28px] font-display font-bold tracking-tight text-foreground leading-tight">
                    What a single auction looks like
                  </h2>
                </div>
                <p className="text-[12.5px] sm:text-sm text-muted-foreground md:max-w-xs md:text-right">
                  Outcomes vary by category, volume and market conditions.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { v: '3%', l: 'Cost reduction', s: 'In a single auction vs. previous quote' },
                    { v: '7', l: 'Suppliers competed', s: 'Live, sealed, in real time' },
                    { v: '18m', vFull: '18 min', l: 'Time to final price', s: 'From auction start to award' },
                  ].map((m) => (
                    <div
                      key={m.l}
                      className="px-3 py-4 sm:px-6 sm:py-8"
                    >
                      <div className="text-[22px] sm:text-[36px] leading-none font-display font-extrabold text-foreground tracking-tight mb-1.5 sm:mb-2">
                        <span className="sm:hidden">{m.v}</span>
                        <span className="hidden sm:inline">{m.vFull ?? m.v}</span>
                      </div>
                      <div className="text-[11.5px] sm:text-[13px] font-semibold text-foreground leading-tight mb-1">
                        {m.l}
                      </div>
                      <div className="hidden sm:block text-[12.5px] text-muted-foreground leading-snug">
                        {m.s}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="py-12 sm:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16">
              <div className="lg:col-span-4 max-w-2xl">
                <div className="text-[10px] sm:text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-2 sm:mb-3">
                  How it works
                </div>
                <h2 className="text-[22px] sm:text-[32px] font-display font-bold tracking-tight text-foreground mb-3 sm:mb-4 leading-[1.15]">
                  From requirement to award in one workflow
                </h2>
                <p className="text-[13.5px] sm:text-[15px] text-muted-foreground leading-relaxed">
                  Post once. Suppliers compete on a sealed reverse auction. You award with a full audit trail.
                </p>
              </div>

              <div className="lg:col-span-8">
                {/* Mobile: compact 2x2 card grid */}
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

                {/* Desktop: vertical numbered list */}
                <ol className="relative hidden lg:block">
                  {steps.map((s, i) => (
                    <li
                      key={s.title}
                      className={`flex items-start gap-5 py-5 ${i < steps.length - 1 ? 'border-b border-border' : ''}`}
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

        {/* ===== CAPABILITIES ===== */}
        <section className="py-12 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-2xl mb-12">
                <div className="text-[11px] font-semibold text-primary-foreground/70 uppercase tracking-[0.14em] mb-3">
                  Platform
                </div>
                <h2 className="text-[26px] sm:text-[32px] font-display font-bold tracking-tight mb-4 leading-[1.15]">
                  Procurement infrastructure, not a marketplace
                </h2>
                <p className="text-[15px] text-primary-foreground/75 leading-relaxed">
                  Everything you need to run sourcing with discipline — auctions, sealed RFQs, an immutable audit trail and CFO-ready reporting.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-primary-foreground/10 rounded-2xl overflow-hidden border border-primary-foreground/15">
                {capabilities.map((c) => (
                  <div
                    key={c.title}
                    className="bg-primary p-4 sm:p-6 lg:p-7 hover:bg-primary-foreground/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center mb-3 sm:mb-4">
                      <c.icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                    </div>
                    <div className="font-semibold text-[13.5px] sm:text-[15px] mb-1 sm:mb-1.5 leading-snug">{c.title}</div>
                    <div className="text-[12px] sm:text-[13px] text-primary-foreground/70 leading-relaxed">
                      {c.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== CONCIERGE ===== */}
        <section className="py-14 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl px-6 py-6 sm:px-10 sm:py-7 flex flex-col sm:flex-row sm:items-center gap-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-[0.14em] mb-1.5">
                  Managed Procurement
                </div>
                <p className="text-[15.5px] sm:text-base font-semibold text-foreground leading-snug mb-1">
                  Don't want to manage auctions? We'll run them for you.
                </p>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                  Share your requirement on WhatsApp. Our team negotiates. You only review and approve.
                </p>
              </div>
              <Button
                size="default"
                className="h-11 px-5 font-semibold shrink-0 shadow-none"
                onClick={() =>
                  window.open(
                    'https://wa.me/919876543210?text=Hi%2C%20I%20want%20ProcureSaathi%20to%20handle%20my%20procurement%20end-to-end.',
                    '_blank',
                  )
                }
              >
                Send on WhatsApp
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto bg-foreground text-background rounded-2xl px-8 py-12 sm:px-14 sm:py-16 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="text-[11px] font-semibold text-background/60 uppercase tracking-[0.14em] mb-3">
                  Get started
                </div>
                <h2 className="text-[28px] sm:text-[36px] font-display font-bold tracking-tight mb-4 leading-[1.1]">
                  Stop overpaying for procurement
                </h2>
                <p className="text-[15px] sm:text-base text-background/75 mb-8 leading-relaxed max-w-lg">
                  Run your first reverse auction today. No setup fees, no contracts — pay only when you save.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-[15px] font-semibold bg-background text-foreground hover:bg-background/90 shadow-none"
                    onClick={() => navigate('/post-rfq')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Post Requirement
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-[15px] font-semibold bg-transparent border-background/25 text-background hover:bg-background/10 hover:text-background hover:border-background/40 shadow-none"
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
          onClick={() => navigate('/post-rfq')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Post Requirement
        </Button>
      </div>

      {/* Footer */}
      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
