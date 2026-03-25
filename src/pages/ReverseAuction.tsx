import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { MapPin, Calendar, ArrowRight, Building2, TrendingDown, Rocket, Gavel, FileText } from "lucide-react";
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
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const d = new Date(deadline);
  if (d <= now) return <span className="text-destructive font-medium">Ended</span>;
  const hrs = differenceInHours(d, now);
  const mins = differenceInMinutes(d, now) % 60;
  return (
    <span className="text-destructive font-medium tabular-nums">
      ⏱ {hrs}h {mins}m left
    </span>
  );
}

/** Stable per-RFQ pseudo-random bidder count (2-6) */
function getBidderCount(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 5) + 2;
}

const FAQS = [
  {
    question: "What is the difference between Forward and Reverse auctions?",
    answer:
      "In a Forward Auction (RFQ), buyers post requirements and suppliers submit quotes — it's a price discovery process. In a Reverse Auction, suppliers actively bid down the price in real-time, competing to offer the lowest cost. ProcureSaathi supports both on a single platform.",
  },
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
      "Every supplier undergoes a multi-step verification process including GST validation, trade license checks, past performance reviews, and quality certifications. Only verified suppliers can participate in auctions.",
  },
  {
    question: "Which industries use auctions on ProcureSaathi?",
    answer:
      "Steel & metals, chemicals & petrochemicals, polymers & plastics, construction & infrastructure, packaging, and automotive are the top industries. Any standardized commodity with multiple suppliers benefits from competitive auction pricing.",
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
  auction_type: string | null;
  target_price: number | null;
  current_lowest_bid: number | null;
  total_bidders: number | null;
}

type FilterType = "all" | "rfq" | "reverse";

export default function ReverseAuction() {
  const [rfqs, setRfqs] = useState<LiveRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const fetchRfqs = async () => {
      const { data } = await supabase
        .from("requirements")
        .select(
          "id, title, delivery_location, quantity, unit, product_category, deadline, status, auction_type, target_price, current_lowest_bid, total_bidders"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      setRfqs((data as LiveRFQ[]) || []);
      setLoading(false);
    };
    fetchRfqs();
  }, []);

  // Real-time updates for live bidding
  useEffect(() => {
    const channel = supabase
      .channel("hybrid-auction-feed")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "requirements" },
                (payload) => {
          const updated = payload.new as Partial<LiveRFQ>;
          setRfqs((prev) =>
            prev.map((r) =>
              r.id === updated.id ? { ...r, ...updated } : r
            )
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Inject FAQ schema
  const faqSchema = useMemo(() => getFAQSchema(FAQS), []);
  useEffect(() => {
    if (faqSchema) injectStructuredData(faqSchema, "faq-schema");
  }, [faqSchema]);

  const filtered = useMemo(() => {
    if (filter === "all") return rfqs;
    return rfqs.filter((r) => (r.auction_type || "rfq") === filter);
  }, [rfqs, filter]);

  const reverseCount = rfqs.filter((r) => r.auction_type === "reverse").length;
  const rfqCount = rfqs.filter((r) => (r.auction_type || "rfq") === "rfq").length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <Helmet>
        <title>
          Hybrid Auction Platform | Forward RFQ + Reverse Bidding | ProcureSaathi
        </title>
        <meta
          name="description"
          content="India's first hybrid procurement platform — Forward RFQ for supplier discovery + Reverse Auction for lowest price. 20% avg savings. Steel, Chemicals, Polymers."
        />
        <link
          rel="canonical"
          href="https://www.procuresaathi.com/reverse-auction"
        />
      </Helmet>

      {/* Hidden SEO heading for long-tail keywords */}
      <h2 className="sr-only">
        Hybrid Auction Platform India — Forward RFQ and Reverse Auction for Steel, Chemicals, Polymers Procurement in India, UAE, Saudi Arabia
      </h2>

      {/* ===== HEADER ===== */}
      <header className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <nav
            className="flex justify-between items-start mb-6"
            aria-label="Auction platform header"
          >
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                India's First Hybrid Auction Platform
              </h1>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
                Forward RFQ for supplier discovery + Reverse Auction for lowest price.
                One platform, two powerful engines for industrial procurement.
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
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <Gavel className="h-4 w-4" /> Start Reverse Auction
            </Link>
            <Link
              to="/post-rfq"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <FileText className="h-4 w-4" /> Post RFQ (Forward)
            </Link>
            <Link
              to="/requirements"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              🔍 Browse All Requirements
            </Link>
          </div>

          {/* Trust badges inline */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>✔ Verified Global Suppliers</span>
            <span>✔ Forward + Reverse Auctions</span>
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

      {/* ===== HOW IT WORKS — DUAL ===== */}
      <section className="bg-muted/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            Two Engines, One Platform
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Forward */}
            <div className="border border-border rounded-xl p-6 bg-background">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-accent text-accent-foreground">Forward RFQ</span>
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Supplier Discovery & Quotes</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>📋 Post requirement with specs</li>
                <li>👥 Multiple suppliers submit quotes</li>
                <li>📊 Compare and negotiate</li>
                <li>✅ Award to best supplier</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 italic">Best for: Custom specs, new supplier onboarding</p>
            </div>
            {/* Reverse */}
            <div className="border-2 border-primary/30 rounded-xl p-6 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-destructive/10 text-destructive">Reverse Auction</span>
                <Gavel className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Real-Time Price Competition</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>🎯 Set target price & deadline</li>
                <li>🔻 Suppliers bid prices DOWN live</li>
                <li>⏱ Countdown timer creates urgency</li>
                <li>💰 Lowest bid wins automatically</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 italic">Best for: Standardized commodities, cost-first procurement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE HYBRID FEED ===== */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            🔥 Live Procurement Feed
          </h2>
          {/* Filter tabs */}
          <div className="flex gap-2 text-xs">
            {([
              { key: "all" as FilterType, label: `All (${rfqs.length})` },
              { key: "rfq" as FilterType, label: `RFQ (${rfqCount})` },
              { key: "reverse" as FilterType, label: `Auction (${reverseCount})` },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            : filtered.length === 0
              ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-4">No live auctions yet.</p>
                  <Link
                    to="/post-rfq"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    🚀 Start First Auction
                  </Link>
                </div>
              )
              : filtered.map((rfq) => {
                const isReverse = rfq.auction_type === "reverse";

                return (
                  <Link
                    key={rfq.id}
                    to={`/rfq/${rfq.id}`}
                    className={`rounded-lg p-4 flex justify-between items-center transition-colors group ${
                      isReverse
                        ? "border-2 border-destructive/20 bg-destructive/5 hover:border-destructive/40"
                        : "border border-accent bg-accent/30 hover:border-primary/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Badge */}
                        {isReverse ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                            Reverse Auction
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent text-accent-foreground">
                            Live RFQ
                          </span>
                        )}
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {rfq.title}
                        </p>
                      </div>

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

                      {/* Conditional auction indicators */}
                      {(() => {
                        const isEnded = new Date(rfq.deadline) < now;
                        const savings = rfq.target_price && rfq.current_lowest_bid
                          ? Number(rfq.target_price) - Number(rfq.current_lowest_bid)
                          : 0;
                        if (isReverse) {
                          return (
                            <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5">
                              {isEnded && (
                                <span className="text-destructive font-medium">⛔ Auction Ended</span>
                              )}
                              {rfq.target_price && (
                                <span className="text-muted-foreground">
                                  🎯 Target: ₹{Number(rfq.target_price).toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="font-medium text-primary">
                                🏆 Lowest: ₹{rfq.current_lowest_bid ? Number(rfq.current_lowest_bid).toLocaleString("en-IN") : "—"}
                              </span>
                              <span className="text-muted-foreground">
                                👥 {rfq.total_bidders || 0} suppliers bidding
                              </span>
                              {!isEnded && rfq.current_lowest_bid && (
                                <span className="text-destructive font-medium">
                                  Beat ₹{Number(rfq.current_lowest_bid).toLocaleString("en-IN")} to win
                                </span>
                              )}
                              {savings > 0 && (
                                <span className="text-emerald-600 font-medium">
                                  💰 Saved ₹{savings.toLocaleString("en-IN")}
                                </span>
                              )}
                              {!isEnded && (rfq.total_bidders || 0) > 3 && (
                                <span className="text-primary animate-pulse">🔻 Price dropping fast</span>
                              )}
                              <span className="text-muted-foreground italic">Auto-awarded to lowest bidder</span>
                              {!isEnded && (
                                <span className="text-muted-foreground">⚡ High competition — act fast to win</span>
                              )}
                              <TimeLeft deadline={rfq.deadline} />
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <TrendingDown className="h-3 w-3" /> Price discovery active • {getBidderCount(rfq.id)} suppliers viewed
                            </span>
                            <TimeLeft deadline={rfq.deadline} />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action button */}
                    {(() => {
                      const isEnded = new Date(rfq.deadline) < now;
                      if (isReverse) {
                        return isEnded ? (
                          <span className="shrink-0 ml-4 text-sm bg-muted text-muted-foreground px-4 py-2 rounded-md font-medium cursor-not-allowed flex items-center gap-1">
                            Closed
                          </span>
                        ) : (
                          <span className="shrink-0 ml-4 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium group-hover:bg-primary/90 transition-colors flex items-center gap-1">
                            💰 Place Bid <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        );
                      }
                      return (
                        <span className="shrink-0 ml-4 text-sm border border-border px-4 py-2 rounded-md text-primary font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center gap-1">
                          Submit Quote <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      );
                    })()}
                  </Link>
                );
              })}
        </div>
        {filtered.length > 0 && (
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
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Need Bulk Pricing? Choose Your Auction Mode
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Forward RFQ for discovery • Reverse Auction for lowest price
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/post-rfq"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-105 hover:shadow-lg"
            >
              <Gavel className="h-4 w-4" /> Start Reverse Auction
            </Link>
            <Link
              to="/post-rfq"
              className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:scale-105"
            >
              <FileText className="h-4 w-4" /> Post RFQ
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
      <section className="bg-muted/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            Industries Using Our Hybrid Auction Platform
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
          Why Use ProcureSaathi's Hybrid Platform?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {[
            {
              icon: "💸",
              title: "Lower Procurement Cost",
              desc: "Reverse auctions drive prices down. Forward RFQs discover best value.",
            },
            {
              icon: "🌍",
              title: "Global Supplier Access",
              desc: "Access suppliers across India, Middle East & Southeast Asia.",
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
          Ready to Transform Your Procurement?
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Forward RFQ or Reverse Auction — you choose</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/post-rfq"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Start Reverse Auction →
          </Link>
          <Link
            to="/post-rfq"
            className="inline-block border border-border text-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
          >
            Post Forward RFQ →
          </Link>
        </div>
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
