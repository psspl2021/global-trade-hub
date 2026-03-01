import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

interface Props {
  title: string;
}

export default function MidContentCTA({ title }: Props) {
  return (
    <section className="my-12 text-center rounded-xl border-2 border-primary/20 bg-primary/5 p-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Need Bulk Pricing for {title}?
      </h3>
      <Link
        to="/post-rfq"
        onClick={() =>
          trackEvent("mid_content_rfq_click", {
            source: window.location.pathname,
          })
        }
        className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-105 hover:shadow-lg"
      >
        Request Competitive Quotes
      </Link>
    </section>
  );
}
