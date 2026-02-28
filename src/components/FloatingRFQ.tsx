import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FloatingRFQ() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        to="/submit-rfq"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:scale-105 hover:shadow-xl"
      >
        Get Mill-Direct Quote <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
