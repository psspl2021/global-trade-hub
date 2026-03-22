import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote } from "lucide-react";

interface CreditLead {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  turnover_range: string | null;
  credit_required: string | null;
  tenure: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
}

export function CreditLeadsCard() {
  const [leads, setLeads] = useState<CreditLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from("credit_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        const sorted = (data as CreditLead[]).sort((a, b) => {
          const parseCredit = (v: string | null) => Number((v || "0").replace(/[^0-9]/g, "")) || 0;
          return parseCredit(b.credit_required) - parseCredit(a.credit_required);
        });
        setLeads(sorted);
      }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4 text-primary" />
          Credit Leads ({leads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credit leads yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto">
            {leads.map((lead) => (
              <div key={lead.id} className="border border-border rounded-md p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground">{lead.company_name}</span>
                  <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>{lead.contact_name} · {lead.phone}</div>
                  <div>Turnover: {lead.turnover_range} · Credit: ₹{lead.credit_required}</div>
                  <div>{lead.tenure} days · {lead.city}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
