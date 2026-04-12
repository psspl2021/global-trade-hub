import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

interface Props {
  title: string;
}

export default function MidContentCTA({ title }: Props) {
  return (
    <section className="my-12 space-y-6">
      {/* Interactive Decision Hook */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <p className="text-base font-semibold text-foreground mb-2">
          How many supplier quotes did you compare last time — 2, 3, or more than 5?
        </p>
        <p className="text-sm text-muted-foreground">
          If it's less than 5, you're not seeing the real market price. Most procurement teams compare 2–3 quotes and assume they have the best deal. They don't.
        </p>
      </div>

      {/* Trust Proof */}
      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-5">
        <p className="text-sm font-semibold text-foreground">
          ProcureSaathi buyers typically see 5–12% price reduction when supplier competition is structured properly.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          On a ₹50 lakh procurement, that's ₹2.5–6 lakh saved — without changing suppliers.
        </p>
      </div>

      {/* Main CTA with Speed Trigger */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
        <p className="text-sm text-muted-foreground mb-2 font-medium">
          Still comparing quotes manually?
        </p>
        <h3 className="text-lg font-bold mb-2 text-foreground">
          Run a Private Reverse Auction with Your {title} Suppliers
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Invite your own suppliers. Get competitive bids across borders with full control, compliance, and transparency.
        </p>
        <Link
          to="/post-rfq"
          onClick={() =>
            trackEvent("mid_content_rfq_click", {
              source: window.location.pathname,
            })
          }
          className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:scale-105 hover:shadow-lg"
        >
          Get Lowest Price in 24 Hours →
        </Link>
        {/* Friction Removal */}
        <p className="text-xs text-muted-foreground mt-3 opacity-80">
          No commitment. No platform fees. Get supplier quotes in 24 hours.
        </p>
      </div>

      {/* Micro-Commitment CTA for low-intent */}
      <p className="text-sm text-muted-foreground text-center">
        Not ready to run a reverse auction yet?{" "}
        <Link
          to="/browseproducts"
          onClick={() => trackEvent("micro_cta_browse_click", { source: window.location.pathname })}
          className="text-primary font-semibold hover:underline"
        >
          See current market price trends first →
        </Link>
      </p>
    </section>
  );
}
