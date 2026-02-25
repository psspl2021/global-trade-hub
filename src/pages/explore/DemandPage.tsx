import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function DemandPage() {
  const { slug } = useParams<{ slug: string }>();

  const [signal, setSignal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSignal() {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      console.log("SUPABASE URL:", (supabase as any).supabaseUrl);
      console.log("Slug:", slug);

      const { data, error } = await supabase
        .from("demand_intelligence_signals")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Fetch error:", error);
        setError("Failed to load demand signal.");
      } else if (!data) {
        setError("Demand signal not found.");
      } else {
        setSignal(data);
      }

      setLoading(false);
    }

    fetchSignal();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading demand signal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">404</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/explore" className="text-primary hover:underline">
            Back to Demand
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-4">{signal.category}</h1>
        <p className="text-muted-foreground">Country: {signal.country}</p>
        <p className="text-muted-foreground">Intent Score: {signal.intent_score}</p>
        <p className="text-muted-foreground">Discovered: {signal.discovered_at}</p>
      </div>
    </main>
  );
}
