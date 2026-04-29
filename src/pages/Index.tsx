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
                Reduce Procurement Costs
                <br />
                <span className="text-primary">by up to 15% annually</span>
              </h1>

              <p
                className="text-base sm:text-lg text-foreground/85 font-medium mb-9 max-w-xl mx-auto animate-fade-in"
                style={{ animationDelay: '120ms' }}
              >
                Real supplier competition through reverse auctions.
              </p>

              <div
                className="flex justify-center animate-fade-in"
                style={{ animationDelay: '180ms' }}
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

        {/* ===== PROOF STRIP — single ===== */}
        <section className="py-10 sm:py-14 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded uppercase tracking-wider">
                  Illustrative Scenario
                </span>
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm px-6 py-7 sm:py-8">
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="text-center px-2">
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-primary mb-1">
                      3%
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                      cost reduction in one auction
                    </div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-primary mb-1">
                      7
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                      suppliers competed
                    </div>
                  </div>
                  <div className="text-center px-2">
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-primary mb-1">
                      18 min
                    </div>
                    <div className="text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                      to final price
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Results vary by category and volume.
              </p>
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS — compressed vertical steps ===== */}
        <section className="py-14 sm:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-center tracking-tight mb-10">
                How it works
              </h2>
              <ol className="space-y-5">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <s.icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                          0{i + 1}
                        </span>
                        <h3 className="text-[15px] sm:text-base font-semibold text-foreground">
                          {s.title}
                        </h3>
                      </div>
                      <p className="text-[14px] text-muted-foreground mt-0.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ===== BUYERS + SUPPLIERS — merged ===== */}
        <section className="py-14 sm:py-16 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4">
            <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-center tracking-tight mb-10">
              Built for Buyers &amp; Suppliers
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                  Buyers
                </h3>
                <ul className="space-y-3 text-[15px] text-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Run RFQs &amp; reverse auctions</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Invite existing + new suppliers</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Audit-ready price trail</span>
                  </li>
                </ul>
              </div>
              <div className="md:border-l md:border-border md:pl-8">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                  Suppliers
                </h3>
                <ul className="space-y-3 text-[15px] text-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Get real RFQs (not listings)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>Matched to your category</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong className="font-semibold">Free to bid</strong> — no subscription
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CAPABILITIES — blue, tightened ===== */}
        <section className="py-14 sm:py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-[26px] sm:text-[30px] font-display font-bold text-center tracking-tight mb-10">
              Platform capabilities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {capabilities.map((c) => (
                <div key={c.title} className="text-center">
                  <div className="w-11 h-11 mx-auto mb-3 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-[15px] mb-1">{c.title}</div>
                  <div className="text-[12.5px] text-primary-foreground/70">
                    {c.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONCIERGE — single strip ===== */}
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 shadow-sm">
              <div className="flex-1">
                <p className="text-[15px] sm:text-base font-medium text-foreground leading-snug">
                  Don’t want to manage auctions?{' '}
                  <span className="text-muted-foreground">
                    We’ll handle it end-to-end.
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 font-semibold shrink-0"
                onClick={() =>
                  window.open(
                    'https://wa.me/919876543210?text=Hi%2C%20I%20want%20ProcureSaathi%20to%20handle%20my%20procurement%20end-to-end.',
                    '_blank',
                  )
                }
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send on WhatsApp
              </Button>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="py-16 sm:py-20 bg-[hsl(var(--muted))]/40 border-y border-border/60">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-[26px] sm:text-[32px] font-display font-bold tracking-tight mb-3">
              Stop overpaying for procurement
            </h2>
            <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
              Run your first reverse auction today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="h-12 px-8 text-[15px] font-semibold shadow-md"
                onClick={() => navigate('/post-rfq')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Post Requirement
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-[15px] font-semibold"
                onClick={() => navigate('/contact')}
              >
                Talk to Sales
              </Button>
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
