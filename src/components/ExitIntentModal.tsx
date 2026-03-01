import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { X } from "lucide-react";

export default function ExitIntentModal() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed) {
        setShow(true);
        trackEvent("exit_intent_triggered", {
          page: window.location.pathname,
        });
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [dismissed]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-w-md rounded-xl bg-background p-8 text-center shadow-2xl">
        <button
          onClick={() => {
            setShow(false);
            setDismissed(true);
          }}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="mb-2 text-lg font-bold text-foreground">
          Before You Leave — Get a Price Benchmark
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Submit a quick RFQ and receive competitive quotes from verified suppliers.
        </p>
        <Link
          to="/post-rfq"
          onClick={() => {
            trackEvent("exit_intent_rfq_click");
            setShow(false);
            setDismissed(true);
          }}
          className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:scale-105"
        >
          Get Instant RFQ
        </Link>
      </div>
    </div>
  );
}
