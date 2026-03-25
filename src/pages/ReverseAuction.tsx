import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { MapPin, Calendar, ArrowRight, Building2, TrendingDown, Rocket } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/procuresaathi-logo.png";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { getFAQSchema, injectStructuredData } from "@/hooks/useSEO";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function TimeLeft({ deadline }: { deadline: string }) {
  const d = new Date(deadline);
  const now = new Date();
  if (d <= now) return <span className="text-destructive font-medium">Ended</span>;
  const hrs = differenceInHours(d, now);
  const mins = differenceInMinutes(d, now) % 60;
  return (
    <span className="text-destructive font-medium tabular-nums">
      ⏱ {hrs}h {mins}m left
    </span>
  );
}

const FAQS = [
  {
    question: "What is a reverse auction in procurement?",
    answer:
      "A reverse auction is a competitive bidding process where multiple suppliers bid against each other to win a buyer's order. Unlike regular auctions, prices go down as suppliers compete, ensuring the buyer gets the best possible price for raw materials and industrial products.",
  },
  {
    question: "How much cost savings can I expect from reverse auctions?",
    answer:
      "Most buyers on ProcureSaathi achieve 10–25% savings compared to traditional procurement methods. The competitive nature of real-time bidding drives prices down significantly, especially for bulk orders of steel, chemicals, polymers, and construction materials.",
  },
  {
    question: "Is ProcureSaathi suitable for bulk industrial orders?",
    answer:
      "Yes. ProcureSaathi is purpose-built for high-volume B2B procurement. Our platform handles orders from ₹5 Lakh to ₹50 Crore+ across categories like metals, chemicals, polymers, cement, and construction materials.",
  },
  {
    question: "How are suppliers verified on ProcureSaathi?",
    answer:
      "Every supplier undergoes a multi-step verification process including GST validation, trade license checks, past performance reviews, and quality certifications. Only verified suppliers can participate in reverse auctions.",
  },
  {
    question: "Which industries use reverse auctions on ProcureSaathi?",
    answer:
      "Steel & metals, chemicals & petrochemicals, polymers & plastics, construction & infrastructure, packaging, and automotive are the top industries. Any standardized commodity with multiple suppliers benefits from reverse auction pricing.",
  },
];

const INDUSTRIES = [
  { name: "Steel & Metals", icon: "🔩", slug: "steel" },
  { name: "Chemicals & Petrochemicals", icon: "🧪", slug: "chemicals" },
  { name: "Polymers & Plastics", icon: "♻️", slug: "polymers" },
  { name: "Construction & Infrastructure", icon: "🏗️", slug: "construction" },
  { name: "Packaging Materials", icon: "📦", slug: "packaging" },
  { name: "Automotive Parts", icon: "🚗", slug: "automotive" },
  { name: "Cement & Building", icon: "🧱", slug: "cement" },
  { name: "Electrical & Electronics", icon: "⚡", slug: "electronics" },
];

interface LiveRFQ {
  id: string;
  title: string;
  delivery_location: string;
  quantity: number;
  unit: string;
  product_category: string;
  deadline: string;
  status: string;
}

export default function ReverseAuction() {
  const [rfqs, setRfqs] = useState<LiveRFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      const { data } = await supabase
        .from("requirements")
        .select(
          "id, title, delivery_location, quantity, unit, product_category, deadline, status"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      setRfqs((data as LiveRFQ[]) || []);
      setLoading(false);
    };
    fetchRfqs();
  }, []);

  // Inject FAQ schema
  const faqSchema = useMemo(() => getFAQSchema(FAQS), []);
  useEffect(() => {
    if (faqSchema) injectStructuredData(faqSchema, "faq-schema");
  }, [faqSchema]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <Helmet>
        <title>
          Reverse Auction Platform | B2B Procurement Bidding | ProcureSaathi
        </title>
        <meta
          name="description"
          content="Procure raw materials at the lowest price through competitive supplier bidding. 20% avg savings. Trusted by buyers across India, Middle East, and global markets."
        />
        <link
          rel="canonical"
          href="https://www.procuresaathi.com/reverse-auction"
        />
      </Helmet>

      {/* Hidden SEO heading for long-tail keywords */}
      <h2 className="sr-only">
        Reverse Auction Platform India, UAE, Saudi Arabia for Steel, Chemicals, Polymers Procurement
      </h2>

      {/* ===== HEADER (same as /requirements) ===== */}
      <header className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <nav
            className="flex justify-between items-start mb-6"
            aria-label="Reverse auction header"
          >
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                Reverse Auction Platform for Global B2B Procurement
              </h1>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
                Procure raw materials and industrial products at the lowest
                price through competitive supplier bidding. Trusted by buyers
                across India, Middle East, and global markets.
              </p>
            </div>
            <Link
              to="/"
              className="inline-block shrink-0"
              aria-label="Go to ProcureSaathi homepage"
            >
              <img
                src={logo}
                alt="ProcureSaathi - B2B Procurement Platform"
                className="h-20 md:h-24 hover:opacity-80 transition-opacity"
                width="96"
                height="96"
              />
            </Link>
          </nav>

          {/* Hero CTAs */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              to="/post-rfq"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              🚀 Start Reverse Auction
            </Link>
            <Link
              to="/requirements"
              className="border border-border text-foreground px-6 py-3 rounded-md text-sm hover:bg-muted transition-colors"
            >
              🔍 View Live Auctions
            </Link>
          </div>

          {/* Trust badges inline */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>✔ Verified Global Suppliers</span>
            <span>✔ Competitive Price Discovery</span>
            <span>✔ Bulk Procurement</span>
            <span>✔ Secure Transactions</span>
          </div>
        </div>
      </header>

      {/* ===== KPI STRIP ===== */}
      <section className="bg-primary/5 border-y border-border py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center gap-6 text-sm px-4">
          <div>
            <p className="text-2xl font-bold text-primary">₹50Cr+</p>
            <p className="text-muted-foreground">Procurement Value</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">20%</p>
            <p className="text-muted-foreground">Avg Cost Savings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">500+</p>
            <p className="text-muted-foreground">Verified Suppliers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">24-48h</p>
            <p className="text-muted-foreground">Auction Completion</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          Avg buyer saved <span className="font-semibold text-primary">₹2.4 Lakhs</span> per auction
        </p>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-muted/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            How Reverse Auction Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📋",
                title: "1. Post Requirement",
                desc: "Submit your material requirement with specs & quantity.",
              },
              {
                icon: "⚡",
                title: "2. Suppliers Compete",
                desc: "Verified suppliers bid and reduce prices in real-time.",
              },
              {
                icon: "💰",
                title: "3. Get Best Price",
                desc: "Select lowest or best-value supplier and finalize deal.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="border border-border rounded-lg p-5 text-center bg-background"
              >
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="font-semibold text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIVE AUCTIONS FEED ===== */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          🔥 Live Reverse Auctions
        </h2>
        <div className="grid gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))
            : rfqs.length === 0
              ? (
                <p className="text-muted-foreground text-sm py-4">
                  No active auctions right now.{" "}
                  <Link to="/post-rfq" className="text-primary underline">
                    Start one →
                  </Link>
                </p>
              )
              : rfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  to={`/rfq/${rfq.id}`}
                  className="border border-border rounded-lg p-4 flex justify-between items-center bg-background hover:border-primary/40 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {rfq.title}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {rfq.delivery_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {rfq.quantity} {rfq.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(rfq.deadline), "PP")}
                      </span>
                    </div>
                    {/* Live auction indicators */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <TrendingDown className="h-3 w-3" /> Price dropping • suppliers bidding
                      </span>
                      <TimeLeft deadline={rfq.deadline} />
                    </div>
                  </div>
                  <span className="shrink-0 ml-4 text-sm border border-border px-3 py-1.5 rounded-md text-primary font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center gap-1">
                    Join Auction <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
        </div>
        {rfqs.length > 0 && (
          <div className="text-center mt-6">
            <Link
              to="/requirements"
              className="text-sm text-primary hover:underline"
            >
              View all live requirements →
            </Link>
          </div>
        )}
      </section>

      {/* ===== MID CTA ===== */}
      <section className="my-4 mx-auto max-w-6xl px-4">
        <div className="text-center rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Need Bulk Pricing? Start a Reverse Auction Now
          </h3>
          <Link
            to="/post-rfq"
            className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-105 hover:shadow-lg"
          >
            Request Competitive Quotes
          </Link>
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
      <section className="bg-muted/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            Industries Using Reverse Auctions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.slug}
                className="border border-border rounded-lg p-4 text-center bg-background hover:border-primary/40 transition-colors"
              >
                <div className="text-2xl mb-1">{ind.icon}</div>
                <p className="font-medium text-foreground">{ind.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
          Why Use Reverse Auction?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {[
            {
              icon: "💸",
              title: "Lower Procurement Cost",
              desc: "Suppliers compete → prices drop → you save more.",
            },
            {
              icon: "🌍",
              title: "Global Supplier Access",
              desc: "Access suppliers across India & international markets.",
            },
            {
              icon: "⚡",
              title: "Faster Procurement",
              desc: "Get multiple quotes within hours instead of days.",
            },
          ].map((b) => (
            <div
              key={b.title}
              className="border border-border rounded-lg p-5 bg-background"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {b.icon} {b.title}
              </h3>
              <p className="text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Trusted by buyers across India, UAE, Saudi Arabia, and Southeast Asia
          for bulk procurement
        </p>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* ===== FAQ ===== */}
      <section className="max-w-4xl mx-auto px-4 py-10" aria-label="FAQs">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="multiple" defaultValue={["faq-0", "faq-1"]}>
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-foreground">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="bg-primary/5 py-10 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Ready to Reduce Procurement Costs?
        </h2>
        <Link
          to="/post-rfq"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Start Reverse Auction →
        </Link>
      </section>

      {/* ===== STICKY CTA (mobile + desktop) ===== */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
        <Link
          to="/post-rfq"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg text-sm font-semibold hover:scale-105 transition-transform"
        >
          <Rocket className="h-4 w-4" /> Start Auction
        </Link>
      </div>
    </main>
  );
}
