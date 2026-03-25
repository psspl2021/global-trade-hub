import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import procureSaathiLogo from "@/assets/procuresaathi-logo.png";
import { TrustBadges } from "@/components/landing/TrustBadges";

export default function ReverseAuction() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Reverse Auction Platform | B2B Procurement Bidding | ProcureSaathi</title>
        <meta
          name="description"
          content="Procure raw materials at the lowest price through competitive supplier bidding. Trusted by buyers across India, Middle East, and global markets."
        />
        <link rel="canonical" href="https://www.procuresaathi.com/reverse-auction" />
      </Helmet>

      {/* Brand Header */}
      <div className="flex items-center justify-center pt-6">
        <Link to="/">
          <img
            src={procureSaathiLogo}
            alt="ProcureSaathi"
            className="h-20 md:h-24 w-auto object-contain hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          Reverse Auction Platform for Global B2B Procurement
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6 text-lg">
          Procure raw materials and industrial products at the lowest price through
          competitive supplier bidding. Trusted by buyers across India, Middle East,
          and global markets.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
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
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span>✔ Verified Global Suppliers</span>
          <span>✔ Competitive Price Discovery</span>
          <span>✔ Bulk Procurement</span>
          <span>✔ Secure Transactions</span>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/40 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
            How Reverse Auction Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "📋", title: "1. Post Requirement", desc: "Submit your material requirement with specs & quantity." },
              { icon: "⚡", title: "2. Suppliers Compete", desc: "Verified suppliers bid and reduce prices in real-time." },
              { icon: "💰", title: "3. Get Best Price", desc: "Select lowest or best-value supplier and finalize deal." },
            ].map((step) => (
              <div key={step.title} className="border border-border rounded-lg p-5 text-center bg-background">
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
          Why Use Reverse Auction?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          {[
            { icon: "💸", title: "Lower Procurement Cost", desc: "Suppliers compete → prices drop → you save more." },
            { icon: "🌍", title: "Global Supplier Access", desc: "Access suppliers across India & international markets." },
            { icon: "⚡", title: "Faster Procurement", desc: "Get multiple quotes within hours instead of days." },
          ].map((b) => (
            <div key={b.title} className="border border-border rounded-lg p-5 bg-background">
              <h3 className="font-semibold text-foreground mb-2">{b.icon} {b.title}</h3>
              <p className="text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />

      {/* CTA */}
      <div className="bg-primary/5 py-10 text-center">
        <h2 className="text-xl font-semibold text-foreground mb-3">
          Ready to Reduce Procurement Costs?
        </h2>
        <Link
          to="/post-rfq"
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Start Reverse Auction →
        </Link>
      </div>
    </div>
  );
}
