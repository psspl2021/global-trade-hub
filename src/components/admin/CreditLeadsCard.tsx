import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Banknote, Phone, MessageCircle, Eye, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";

interface CreditLead {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  turnover: string | null;
  turnover_range: string | null;
  credit_required: string | null;
  tenure: string | null;
  city: string | null;
  gst: string | null;
  status: string | null;
  assigned_to: string | null;
  created_at: string | null;
}

const parseCredit = (v: string | null) => Number((v || "0").replace(/[^0-9]/g, "")) || 0;

const statusStyles: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  qualified: "bg-purple-100 text-purple-700 border-purple-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const timeAgo = (date: string | null) => {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hrs ago`;
  return `${Math.floor(diff / 1440)} days ago`;
};

const EDITABLE_FIELDS: { key: keyof CreditLead; label: string }[] = [
  { key: "company_name", label: "Company Name" },
  { key: "contact_name", label: "Contact Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "gst", label: "GST Number" },
  { key: "turnover", label: "Turnover (₹)" },
  { key: "turnover_range", label: "Turnover Range" },
  { key: "credit_required", label: "Credit Required (₹)" },
  { key: "tenure", label: "Tenure" },
  { key: "status", label: "Status" },
  { key: "assigned_to", label: "Assigned To" },
];

export function CreditLeadsCard() {
  const [leads, setLeads] = useState<CreditLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<CreditLead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CreditLead>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await supabase.from("credit_leads").update({ status: newStatus }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
  };

  const handleAssignChange = async (leadId: string, assignee: string) => {
    await supabase.from("credit_leads").update({ assigned_to: assignee }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, assigned_to: assignee } : l)));
  };

  const openDetail = (lead: CreditLead) => {
    setSelectedLead(lead);
    setIsEditing(false);
    setEditData({});
  };

  const startEditing = () => {
    if (!selectedLead) return;
    setEditData({ ...selectedLead });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    setSaving(true);
    const { id, created_at, ...updateFields } = editData as CreditLead;
    const { error } = await supabase.from("credit_leads").update(updateFields).eq("id", selectedLead.id);
    if (error) {
      toast.error("Failed to update lead");
    } else {
      toast.success("Lead updated successfully");
      const updated = { ...selectedLead, ...updateFields };
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updated : l)));
      setIsEditing(false);
    }
    setSaving(false);
  };

  const pipeline = leads.reduce((sum, l) => sum + parseCredit(l.credit_required), 0);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4 text-primary" />
            Credit Leads ({leads.length})
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">High intent MSME credit leads</p>
            {leads.length > 0 && (
              <span className="text-lg font-semibold text-green-600">
                ₹{new Intl.NumberFormat("en-IN").format(pipeline)} pipeline
              </span>
            )}
          </div>
          {leads.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Avg deal size: ₹{new Intl.NumberFormat("en-IN").format(Math.floor(pipeline / leads.length))}
            </p>
          )}
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
                      isHighValue ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isHighValue && (
                          <span className="text-xs font-semibold text-green-700 whitespace-nowrap">🔥 HOT</span>
                        )}
                        <span className="font-medium text-sm text-foreground truncate">{lead.company_name}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {timeAgo(lead.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(lead)} title="View Details">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`text-xs border rounded px-2 py-0.5 ${statusStyles[status] || ""}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="approved">Approved</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <select
                          value={lead.assigned_to || ""}
                          onChange={(e) => handleAssignChange(lead.id, e.target.value)}
                          className="text-xs border rounded px-2 py-0.5"
                        >
                          <option value="">Assign</option>
                          <option value="sales1">Sales 1</option>
                          <option value="sales2">Sales 2</option>
                        </select>
                      </div>
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
                                <MessageCircle className="h-3 w-3" /> WhatsApp
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                              >
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      <div>Turnover: {lead.turnover_range || lead.turnover} · Credit: ₹{lead.credit_required}</div>
                      <div>{lead.tenure} · {lead.email}</div>
                      {lead.gst && <div>GST: {lead.gst}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail / Edit Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) { setSelectedLead(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{isEditing ? "Edit Lead" : "Lead Details"}</span>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={startEditing} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && !isEditing && (
            <div className="space-y-3">
              {EDITABLE_FIELDS.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="text-foreground">{(selectedLead as any)[key] || "—"}</span>
                </div>
              ))}
              <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Submitted</span>
                <span className="text-foreground">
                  {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString("en-IN") : "—"}
                </span>
              </div>
            </div>
          )}

          {selectedLead && isEditing && (
            <div className="space-y-3">
              {EDITABLE_FIELDS.map(({ key, label }) => {
                if (key === "status") {
                  return (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <select
                        value={(editData as any)[key] || "new"}
                        onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="approved">Approved</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  );
                }
                if (key === "assigned_to") {
                  return (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">{label}</Label>
                      <select
                        value={(editData as any)[key] || ""}
                        onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        <option value="sales1">Sales 1</option>
                        <option value="sales2">Sales 2</option>
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={(editData as any)[key] || ""}
                      onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                    />
                  </div>
                );
              })}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-1">
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-1">
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
