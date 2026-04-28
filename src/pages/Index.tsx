import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  FileText,
  Gavel,
  LineChart,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSEO, injectStructuredData, getOrganizationSchema } from '@/hooks/useSEO';
import { PageHeader } from '@/components/landing/PageHeader';
import { trackEvent } from '@/lib/analytics';

// Below-the-fold lazy sections
const LiveBuyerDemandSection = lazy(() =>
  import('@/components/landing/LiveBuyerDemandSection').then((m) => ({
    default: m.LiveBuyerDemandSection,
  })),
);
const HowItWorksSection = lazy(() =>
  import('@/components/landing/HowItWorksSection').then((m) => ({
    default: m.HowItWorksSection,
  })),
);
const HomepageFAQ = lazy(() =>
  import('@/components/landing/HomepageFAQ').then((m) => ({ default: m.HomepageFAQ })),
);
const Footer = lazy(() =>
  import('@/components/landing/Footer').then((m) => ({ default: m.Footer })),
);
const HighDemandSection = lazy(() => import('@/components/landing/HighDemandSection'));

const SectionFallback = () => (
  <div className="py-20 bg-background">
    <div className="container mx-auto px-4">
      <div className="h-8 w-64 bg-muted rounded mx-auto mb-4 animate-pulse" />
      <div className="h-4 w-96 bg-muted/60 rounded mx-auto max-w-full animate-pulse" />
    </div>
  </div>
);

const RFQ_CHIPS = [
  { label: 'TMT Bars', q: 'TMT bars Fe 500D, 25 MT, monthly' },
  { label: 'MS Pipes', q: 'MS pipes ERW, assorted sizes, 10 MT' },
  { label: 'Packaging', q: 'Corrugated boxes, 5-ply, 5000 units' },
  { label: 'Chemicals', q: 'Industrial chemicals — bulk supply' },
  { label: 'Electricals', q: 'LT cables and switchgear — project lot' },
];

const Index = () => {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [redirecting] = useState(false);

  useSEO({
    title: 'ProcureSaathi — Reduce procurement costs by up to 15% annually',
    description:
      'The procurement operating system for enterprises. Real supplier competition through reverse auctions and sealed bidding — measurable, transparent savings on every order.',
    canonical: 'https://www.procuresaathi.com/',
    keywords:
      'B2B procurement platform, reverse auction software, RFQ platform, supplier competition, procurement cost reduction, sealed bidding',
    ogImage: 'https://www.procuresaathi.com/og-early-adopter.png',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });

  useEffect(() => {
    injectStructuredData(getOrganizationSchema(), 'organization-schema');
    injectStructuredData(
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ProcureSaathi',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description:
          'B2B procurement platform powered by reverse auctions and sealed bidding for measurable cost reduction.',
        url: 'https://www.procuresaathi.com',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: 'Free for buyers to post requirements',
        },
      },
      'software-app-schema',
    );
  }, []);

  if (authLoading || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const goPostRfq = (source: string, prefill?: string) => {
    trackEvent('post_requirement_click', { source, prefill: prefill || null });
    navigate(prefill ? `/post-rfq?prefill=${encodeURIComponent(prefill)}` : '/post-rfq');
  };

  const openWhatsApp = () => {
    trackEvent('whatsapp_concierge_click', { source: 'homepage_concierge' });
    window.open(
      'https://wa.me/918368127357?text=Hi%2C%20I%20want%20ProcureSaathi%20to%20handle%20my%20procurement%20end-to-end.',
      '_blank',
      'noopener',
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Procurement operating system for enterprises
              </div>

              <h1 className="font-display font-semibold text-foreground tracking-tight text-[32px] leading-[1.1] sm:text-[40px] sm:leading-[1.08] lg:text-[56px] lg:leading-[1.05] mb-6">
                Reduce procurement costs by up to{' '}
                <span className="text-primary">15% annually.</span>
              </h1>

              <p className="text-base sm:text-[17px] text-muted-foreground leading-relaxed max-w-2xl mb-3">
                Real supplier competition through reverse auctions and sealed bidding.
                Transparent price discovery, measurable savings, every order.
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mb-8">
                Your existing vendors and our supplier network compete in the same auction —
                no need to switch suppliers.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Button
                  size="lg"
                  className="h-11 px-5 text-[14.5px] font-medium shadow-none"
                  onClick={() => goPostRfq('hero_primary_cta')}
                >
                  Post requirement
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-5 text-[14.5px] font-medium"
                  onClick={() => {
                    trackEvent('hero_contact_sales_click', { source: 'homepage_hero' });
                    navigate('/contact');
                  }}
                >
                  Talk to sales
                </Button>
              </div>

              {/* RFQ chips — friction reducer */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Start with a template
                </p>
                <div className="flex flex-wrap gap-2">
                  {RFQ_CHIPS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => {
                        trackEvent('rfq_chip_click', { template: c.label });
                        goPostRfq('hero_rfq_chip', c.q);
                      }}
                      className="px-3 py-1.5 rounded-md bg-background border border-border text-[13px] font-medium text-foreground hover:bg-muted hover:border-foreground/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== PROOF STRIP — Illustrative Scenario ===== */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Illustrative Scenario
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground tracking-tight mb-3">
                What a single reverse auction can look like
              </h2>
              <p className="text-sm text-muted-foreground">
                Outcomes vary by category, volume, and market conditions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                { v: '3%', l: 'Saved in a single auction', s: 'vs. previous vendor quote' },
                { v: '7', l: 'Suppliers competed', s: 'live, in real time' },
                { v: '18 min', l: 'Auction duration', s: 'from start to award' },
              ].map((stat) => (
                <div key={stat.l} className="border-l-2 border-primary pl-5">
                  <div className="text-[40px] leading-[1.1] font-display font-semibold text-foreground tracking-tight mb-2">
                    {stat.v}
                  </div>
                  <div className="text-sm font-medium text-foreground">{stat.l}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.s}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-10 max-w-2xl">
              Reverse auctions on ProcureSaathi are <span className="text-foreground font-medium">free for suppliers to bid</span>. The platform earns only on successful awards.
            </p>
          </div>
        </section>

        {/* ===== HIGH DEMAND ===== */}
        <Suspense fallback={<SectionFallback />}>
          <HighDemandSection />
        </Suspense>

        {/* ===== LIVE BUYER DEMAND ===== */}
        <Suspense fallback={<SectionFallback />}>
          <LiveBuyerDemandSection />
        </Suspense>

        {/* ===== HOW IT WORKS ===== */}
        <Suspense fallback={<SectionFallback />}>
          <HowItWorksSection />
        </Suspense>

        {/* ===== BUYER + SUPPLIER VALUE ===== */}
        <section className="border-y border-border bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid md:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border border-border">
              {/* Buyer */}
              <div className="bg-background p-8 lg:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    For buyers
                  </span>
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                  Discover better prices without changing vendors
                </h3>
                <ul className="space-y-3 mb-8">
                  {[
                    'Run sealed-bid RFQs and live reverse auctions in minutes',
                    'Invite your existing vendors plus our supplier network',
                    'Audit-ready price trail on every order',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="h-10 px-4 text-[13.5px] font-medium"
                  onClick={() => goPostRfq('value_split_buyer')}
                >
                  Post requirement
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>

              {/* Supplier */}
              <div className="bg-background p-8 lg:p-10">
                <div className="flex items-center gap-2 mb-6">
                  <Gavel className="h-5 w-5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    For suppliers
                  </span>
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-4">
                  Compete on real, qualified demand
                </h3>
                <ul className="space-y-3 mb-8">
                  {[
                    'Live RFQs from verified buyers, not directory listings',
                    'Matched only to your category and capacity',
                    'Reverse auctions are free to bid — no subscription',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="h-10 px-4 text-[13.5px] font-medium"
                  onClick={() => {
                    trackEvent('value_split_supplier_click', { source: 'homepage' });
                    navigate('/signup?role=supplier');
                  }}
                >
                  Become a supplier
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CAPABILITIES ===== */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground tracking-tight mb-3">
                Built for procurement teams that ship savings
              </h2>
              <p className="text-sm text-muted-foreground">
                One system for sourcing, negotiation, awarding, and audit.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Gavel,
                  t: 'Reverse auctions',
                  d: 'Live, time-boxed competition with full bid history.',
                },
                {
                  icon: FileText,
                  t: 'Sealed-bid RFQs',
                  d: 'Structured requirements, side-by-side comparison.',
                },
                {
                  icon: ShieldCheck,
                  t: 'Audit ledger',
                  d: 'Cryptographically chained price trail on every order.',
                },
                {
                  icon: LineChart,
                  t: 'Savings reporting',
                  d: 'CFO-ready evidence of measurable cost reduction.',
                },
              ].map((f) => (
                <div key={f.t}>
                  <f.icon className="h-5 w-5 text-primary mb-4" />
                  <div className="text-[15px] font-semibold text-foreground mb-1.5">
                    {f.t}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONCIERGE ===== */}
        <section className="border-b border-border bg-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-medium text-background/60 uppercase tracking-wide mb-4">
                Managed procurement
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-display font-semibold text-background tracking-tight leading-[1.15] mb-4">
                Don't want to run the auction yourself? We will.
              </h2>
              <p className="text-[15px] text-background/70 leading-relaxed mb-8 max-w-2xl">
                Send your requirement on WhatsApp. Our procurement desk runs the auction,
                negotiates with suppliers, and returns a competitive quote — you only review
                and approve.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 mb-10 max-w-2xl">
                {[
                  { t: 'Zero learning curve', d: 'No system to onboard.' },
                  { t: 'WhatsApp-first', d: 'Brief us in a message.' },
                  { t: '24–48 hr turnaround', d: 'Quotes back, ready to award.' },
                ].map((x) => (
                  <div key={x.t} className="border-t border-background/15 pt-4">
                    <div className="text-sm font-medium text-background mb-1">{x.t}</div>
                    <div className="text-xs text-background/60">{x.d}</div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="h-11 px-5 text-[14.5px] font-medium bg-background text-foreground hover:bg-background/90 shadow-none"
                onClick={openWhatsApp}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Get procurement done for you
              </Button>
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <Suspense fallback={<SectionFallback />}>
          <LazyFAQ />
        </Suspense>
      </main>

      <Suspense fallback={<div className="h-32 bg-muted/20" />}>
        <Footer />
      </Suspense>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3 flex gap-2">
        <Button
          className="flex-1 h-11 text-[14px] font-medium shadow-none"
          onClick={() => goPostRfq('mobile_sticky_cta')}
        >
          Post requirement
        </Button>
        <Button
          variant="outline"
          className="h-11 px-4 text-[14px] font-medium"
          onClick={openWhatsApp}
          aria-label="WhatsApp concierge"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
      {/* Spacer so sticky CTA never overlaps last content on mobile */}
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
};

export default Index;
