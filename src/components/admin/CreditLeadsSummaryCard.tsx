import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

const parseCredit = (v: string | null) => Number((v || "0").replace(/[^0-9]/g, "")) || 0;

export function CreditLeadsSummaryCard() {
  const [openCount, setOpenCount] = useState(0);
  const [pipeline, setPipeline] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("credit_leads")
        .select("credit_required, status");
      if (data) {
        const open = data.filter((l) => (l.status || "new") !== "closed");
        setOpenCount(open.length);
        setPipeline(open.reduce((s, l) => s + parseCredit(l.credit_required), 0));
      }
    };
    fetch();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4 text-primary" />
          Credit Leads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Open leads</span>
          <span className="text-sm font-semibold">{openCount}</span>
        </div>
        <div className="text-2xl font-bold text-green-600">
          ₹{new Intl.NumberFormat("en-IN").format(pipeline)}
        </div>
        <p className="text-xs text-muted-foreground">Open pipeline value</p>
        <button
          onClick={() => window.location.href = "/admin-audit?tab=credit-leads"}
          className="w-full text-sm border rounded-md py-2 hover:bg-accent transition-colors mt-2"
        >
          View Leads →
        </button>
      </CardContent>
    </Card>
  );
}
