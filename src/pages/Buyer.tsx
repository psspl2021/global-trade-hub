import { useNavigate } from "react-router-dom";
import { GlobalProcurementCorridors } from '@/components/GlobalProcurementCorridors';
import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { PostRFQModal } from "@/components/PostRFQModal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/landing/PageHeader";
import { QuoteComparisonSection } from "@/components/landing/QuoteComparisonSection";
import { StickySignupBanner } from "@/components/StickySignupBanner";
import { useSEO, injectStructuredData, getBreadcrumbSchema, getFAQSchema } from "@/hooks/useSEO";
import { AILinkingSection } from "@/components/seo";
import heroBgBuyer from "@/assets/hero-bg-buyer.jpg";

const ExitIntentPopup = lazy(() => import('@/components/landing/ExitIntentPopup').then(m => ({ default: m.ExitIntentPopup })));
import {
  ArrowRight,
  FileText,
  Package,
  Sparkles,
  Brain,
  Users,
  Building2,
  Globe,
  Eye,
  Scale,
  ClipboardCheck,
  ShieldCheck,
  Ban,
  XCircle,
  BadgeCheck,
  Factory,
  Layers,
  Lock,
} from "lucide-react";

// Who This Is For - Buyer Profiles
const buyerProfiles = [
  {
    title: "Bulk buyers sourcing recurring materials",
    desc: "Ongoing procurement with supplier consistency",
    icon: Package,
  },
  {
    title: "Project-based procurement teams",
    desc: "Compare multiple suppliers for each requirement",
    icon: Building2,
  },
  {
    title: "Importers sourcing from India",
    desc: "Access verified manufacturers for export",
    icon: Globe,
  },
  {
    title: "Businesses needing price transparency",
    desc: "Clear comparison without negotiation loops",
    icon: Scale,
  },
];

// 3-step compressed flow
const howItWorks = [
  {
    step: 1,
    title: "Post your requirement",
    description: "Submit your need in simple terms — text, voice or upload.",
    icon: FileText,
  },
  {
    step: 2,
    title: "AI matches suppliers",
    description: "Your requirement is routed to relevant verified suppliers.",
    icon: Brain,
  },
  {
    step: 3,
    title: "Receive and compare quotes",
    description: "All quotes visible in one structured view — decide with clarity.",
    icon: ClipboardCheck,
  },
];

// Supplier trust pillars
const supplierTrust = [
  {
    title: "Manufacturer & distributor network",
    desc: "Direct access to source — not resellers stacked on resellers.",
    icon: Factory,
  },
  {
    title: "Category-specific suppliers",
    desc: "TMT, pipes, packaging, chemicals and more — matched by category.",
    icon: Layers,
  },
  {
    title: "Business verification",
    desc: "GST and operational presence checks before suppliers receive RFQs.",
    icon: ShieldCheck,
  },
  {
    title: "Controlled RFQ access",
    desc: "No open marketplace spam. Suppliers are screened, not crowdsourced.",
    icon: Lock,
  },
];

// What ProcureSaathi Is NOT
const whatWeAreNot = [
  "Not a supplier directory",
  "Not a lead marketplace",
  "Not cold calling or contact selling",
];

// Buyer Advantages
const buyerAdvantages = [
  {
    title: "Transparency",
    description: "Clear line-item quotes. No hidden costs.",
    icon: Eye,
  },
  {
    title: "No obligation to award",
    description: "Review quotes freely before deciding.",
    icon: Scale,
  },
  {
    title: "Line-item comparison",
    description: "Evaluate suppliers side-by-side.",
    icon: ClipboardCheck,
  },
  {
    title: "Compliance & quality control",
    description: "Verified suppliers with business validation.",
    icon: ShieldCheck,
  },
  {
    title: "No supplier spam",
    description: "Your details remain protected.",
    icon: Ban,
  },
];

// Buyer FAQ — tightened to 6
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

      {/* HERO — kept as is */}
      <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
        <img
          src={heroBgBuyer}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'contrast(0.95) brightness(0.85)' }}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/50 to-background/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/25 via-transparent to-background/25" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in shadow-lg">
              <Brain className="h-4 w-4 text-primary drop-shadow-md" />
              <span className="text-sm font-bold text-primary drop-shadow-sm">MANAGED PROCUREMENT</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold mb-6 animate-slide-up">
              AI-Powered B2B Procurement for{" "}
              <span className="text-primary drop-shadow-lg">Smarter Sourcing</span>
            </h1>

            <p className="text-xl md:text-2xl text-foreground font-bold mb-5 max-w-3xl mx-auto animate-slide-up delay-100 drop-shadow-md">
              Post one RFQ. AI structures it and invites verified suppliers to bid.
            </p>

            <p className="text-base md:text-lg text-primary font-bold mb-10 flex items-center justify-center gap-2 animate-slide-up delay-150 drop-shadow-md">
              <Sparkles className="h-4 w-4" />
              AI analyzes buyer requirements to enable transparent, sealed bidding.
            </p>

            <div className="bg-background/10 backdrop-blur-lg border border-white/15 rounded-2xl p-6 md:p-8 mb-12 max-w-3xl mx-auto animate-slide-up delay-200 shadow-xl">
              <p className="text-base md:text-lg text-foreground leading-relaxed font-semibold drop-shadow-sm">
                <strong className="text-primary">ProcureSaathi</strong> is an AI-powered B2B procurement platform that helps buyers source products by detecting demand, structuring RFQs, and managing fulfilment with verified suppliers. Buyer identities remain protected throughout the process.
              </p>
            </div>

            <div className="flex flex-col items-center animate-slide-up delay-300">
              <Button
                size="lg"
                className="h-14 md:h-16 px-10 md:px-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 gradient-primary"
                onClick={() => setShowRFQModal(true)}
              >
                <span className="mr-2 inline-block w-3 h-3 rounded-full bg-success animate-pulse"></span>
                Post RFQ – Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-foreground/80 font-medium mt-4 drop-shadow-sm">
                Verified suppliers only • No obligation • Buyer details protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — DECISION VIEW (white) */}
      <QuoteComparisonSection />

      {/* SECTION 2 — WHO THIS IS FOR (light grey) */}
      <section className="py-16 bg-[hsl(var(--muted))]/40">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                Built for teams that buy regularly or at scale
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {buyerProfiles.map((p) => (
                <div
                  key={p.title}
                  className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/60"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-[14.5px] leading-tight mb-1">{p.title}</div>
                    <div className="text-[12.5px] text-muted-foreground leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS (white, compressed) */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                From requirement to quotes — in three steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {howItWorks.map((s) => (
                <Card key={s.step} className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <s.icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Step {s.step}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-[15.5px] mb-1.5">{s.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{s.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — SUPPLIER TRUST (light grey) */}
      <section className="py-16 bg-[hsl(var(--muted))]/40">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-9 text-center mx-auto">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-3">
                Verified suppliers across key categories
              </h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">
                Suppliers are screened before receiving RFQs to ensure relevant and reliable responses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {supplierTrust.map((t) => (
                <div key={t.title} className="p-4 bg-card rounded-xl border border-border/60">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <t.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-[14px] leading-tight mb-1.5">{t.title}</h3>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT PROCURESAATHI IS NOT (white) */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-7">
              What ProcureSaathi is <span className="text-destructive">not</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-2.5">
              {whatWeAreNot.map((text) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border text-[13px] font-medium text-foreground"
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

      {/* SECTION 6 — BUYER ADVANTAGES (light grey) */}
      <section className="py-16 bg-[hsl(var(--muted))]/40">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                Buyer advantages
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {buyerAdvantages.map((a) => (
                <Card key={a.title} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <a.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-[15px] mb-1.5">
                      {a.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {a.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FAQ (white, tightened accordion) */}
      <section className="py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
                Frequently asked questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full border-t border-border">
              {buyerFAQs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-border">
                  <AccordionTrigger className="py-4 text-left text-[14.5px] font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-0 text-[13.5px] text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA (deep navy) */}
      <section className="py-16 bg-[hsl(222_65%_28%)] text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-5">
              <BadgeCheck className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Start AI-powered procurement
            </h2>
            <p className="text-[15px] md:text-base text-primary-foreground/85 mb-8 max-w-xl mx-auto leading-relaxed">
              Post your requirement and receive comparable supplier quotes in one place.
            </p>
            <div className="flex flex-col items-center">
              <Button
                size="lg"
                variant="secondary"
                className="h-13 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                onClick={() => setShowRFQModal(true)}
              >
                <span className="mr-2 inline-block w-2.5 h-2.5 rounded-full bg-success animate-pulse"></span>
                Post RFQ — Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[12.5px] text-primary-foreground/70 mt-4">
                Verified suppliers only • No obligation • Buyer details protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Linking Section */}
      <AILinkingSection
        title="Related Resources for Buyers"
        links={[
          { title: "How to Post RFQ Online", url: "/how-to-post-rfq-online", description: "Step-by-step guide", emoji: "📝" },
          { title: "Find Verified Suppliers", url: "/find-verified-b2b-suppliers", description: "Supplier discovery guide", emoji: "🔍" },
          { title: "Enterprise Procurement", url: "/enterprise-procurement-guide", description: "For large organizations", emoji: "🏢" },
        ]}
      />

      <GlobalProcurementCorridors />

      <section className="py-10 text-center bg-[hsl(var(--muted))]/40">
        <Button
          variant="link"
          className="text-muted-foreground font-medium"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </Button>
      </section>

      <PostRFQModal open={showRFQModal} onOpenChange={setShowRFQModal} />

      <StickySignupBanner />
      <Suspense fallback={null}>
        <ExitIntentPopup />
      </Suspense>
    </div>
  );
};

export default Buyer;
