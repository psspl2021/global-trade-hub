import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Banknote, Phone, MessageCircle } from "lucide-react";

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

const parseCredit = (v: string | null) => Number((v || "0").replace(/[^0-9]/g, "")) || 0;

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  closed: "bg-green-100 text-green-700 border-green-200",
};

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
  return `${Math.floor(diff / 1440)} days ago`;
};

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
        const sorted = (data as CreditLead[]).sort(
          (a, b) => parseCredit(b.credit_required) - parseCredit(a.credit_required)
        );
        setLeads(sorted);
      }
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await supabase.from("credit_leads").update({ status: newStatus }).eq("id", leadId);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4 text-primary" />
          Credit Leads ({leads.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">High intent MSME credit leads</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credit leads yet.</p>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-auto">
            {leads.map((lead) => {
              const isHighValue = parseCredit(lead.credit_required) > 1000000;
              const status = lead.status || "new";
              const phone = (lead.phone || "").replace(/\D/g, "");
              return (
                <div
                  key={lead.id}
                  className={`border rounded-md p-3 space-y-1.5 ${
                    isHighValue
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isHighValue && (
                        <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                          🔥 HOT
                        </span>
                      )}
                      <span className="font-medium text-sm text-foreground truncate">
                        {lead.company_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(lead.created_at)}
                      </span>
                    </div>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`text-xs border rounded px-2 py-0.5 ${statusStyles[status] || ""}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span>{lead.contact_name} · {lead.city}</span>
                      <div className="flex items-center gap-2">
                        {phone && (
                          <>
                            <a
                              href={`https://wa.me/91${phone}?text=Hi ${encodeURIComponent(lead.contact_name || "")}, regarding your credit request on ProcureSaathi`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                            >
                              <Phone className="h-3 w-3" />
                              Call
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div>Turnover: {lead.turnover_range} · Credit: ₹{lead.credit_required}</div>
                    <div>{lead.tenure} · {lead.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
