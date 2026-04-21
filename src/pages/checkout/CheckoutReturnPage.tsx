import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);

  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setHasPlan(false); return; }
      const { data } = await supabase
        .from("global_plan_subscriptions")
        .select("status")
        .eq("user_id", u.user.id)
        .in("status", ["active", "trialing"])
        .limit(1)
        .maybeSingle();
      if (data) { setHasPlan(true); return; }
      if (attempts < 8) setTimeout(poll, 1500);
      else setHasPlan(false);
    };
    poll();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full p-8 text-center">
        {hasPlan === null ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Confirming your payment…</h1>
            <p className="text-muted-foreground text-sm">This usually takes a few seconds.</p>
          </>
        ) : hasPlan ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Plan Activated 🎉</h1>
            <p className="text-muted-foreground mb-6">
              Your Global Procurement Plan is live. Run unlimited reverse auctions for the next 6 months.
            </p>
            <Button asChild className="w-full"><Link to="/dashboard">Go to Dashboard</Link></Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Payment received</h1>
            <p className="text-muted-foreground mb-6">
              We've received your payment. Activation will complete in a few minutes — you'll get an email confirmation.
            </p>
            {sessionId && (
              <p className="text-xs text-muted-foreground mb-4 font-mono break-all">Ref: {sessionId}</p>
            )}
            <Button asChild className="w-full"><Link to="/dashboard">Go to Dashboard</Link></Button>
          </>
        )}
      </Card>
    </div>
  );
}
