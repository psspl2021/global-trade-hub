import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

interface Props {
  title: string;
}

export default function MidContentCTA({ title }: Props) {
  return (
    <section className="my-12 rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
      <p className="text-sm text-muted-foreground mb-2 font-medium">
        Still comparing quotes manually?
      </p>
      <h3 className="text-lg font-bold mb-2 text-foreground">
        Compare Prices from 5+ Verified {title} Suppliers
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Most buyers overpay by ₹2,000–₹5,000/MT because they rely on just 2–3 quotes. See what competitive pricing really looks like.
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
        Get Lowest Price Now →
      </Link>
    </section>
  );
}
