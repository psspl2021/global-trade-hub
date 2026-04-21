import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Loader2 } from "lucide-react";

const INR_BENEFICIARY = {
  name: "PROCURESAATHI SOLUTIONS PRIVATE LIMITED",
  account: "085705002565",
  ifsc: "ICIC0000857",
  bank: "ICICI Bank",
};

const USD_SWIFT = {
  beneficiary: "PROCURESAATHI SOLUTIONS PRIVATE LIMITED",
  beneficiaryAccount: "085705002565",
  beneficiaryBank: "ICICI Bank Ltd, India",
  swift: "ICICINBBCTS",
  intermediary: "Citibank N.A., New York",
  intermediarySwift: "CITIUS33XXX",
  intermediaryAba: "021000089",
  intermediaryAccount: "36329377",
};

export function WirePaymentForm({ defaultCurrency = "INR" }: { defaultCurrency?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: defaultCurrency === "INR" ? "700000" : "8400",
    currency: defaultCurrency,
    reference_number: "",
    proof_url: "",
    notes: "",
    buyer_company: "",
  });

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("wire-payment-submit", {
        body: {
          amount: Number(form.amount),
          currency: form.currency,
          reference_number: form.reference_number,
          proof_url: form.proof_url,
          notes: form.notes,
          buyer_company: form.buyer_company,
        },
      });
      if (error || !data?.success) throw new Error(error?.message || "Submission failed");
      toast.success("Wire claim submitted. Our team will reconcile within 1 business day.");
      setForm({ ...form, reference_number: "", proof_url: "", notes: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit wire claim");
    } finally {
      setSubmitting(false);
    }
  };

  const isInr = form.currency === "INR";
  const beneficiary = isInr ? INR_BENEFICIARY : null;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <h4 className="font-semibold text-sm mb-3">
          {isInr ? "Domestic Wire (NEFT/RTGS)" : "International Wire (SWIFT)"}
        </h4>
        {isInr && beneficiary ? (
          <div className="space-y-2 text-sm">
            <DetailRow label="Beneficiary" value={beneficiary.name} onCopy={(v) => copy("name", v)} copied={copied === "name"} />
            <DetailRow label="Bank" value={beneficiary.bank} />
            <DetailRow label="A/c Number" value={beneficiary.account} onCopy={(v) => copy("acc", v)} copied={copied === "acc"} />
            <DetailRow label="IFSC" value={beneficiary.ifsc} onCopy={(v) => copy("ifsc", v)} copied={copied === "ifsc"} />
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <DetailRow label="Beneficiary" value={USD_SWIFT.beneficiary} />
            <DetailRow label="Beneficiary A/c" value={USD_SWIFT.beneficiaryAccount} onCopy={(v) => copy("ba", v)} copied={copied === "ba"} />
            <DetailRow label="Beneficiary Bank" value={USD_SWIFT.beneficiaryBank} />
            <DetailRow label="Beneficiary SWIFT" value={USD_SWIFT.swift} onCopy={(v) => copy("bs", v)} copied={copied === "bs"} />
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-xs text-muted-foreground mb-1">Intermediary (USD)</p>
              <DetailRow label="Bank" value={USD_SWIFT.intermediary} />
              <DetailRow label="SWIFT" value={USD_SWIFT.intermediarySwift} onCopy={(v) => copy("is", v)} copied={copied === "is"} />
              <DetailRow label="FED ABA" value={USD_SWIFT.intermediaryAba} onCopy={(v) => copy("aba", v)} copied={copied === "aba"} />
              <DetailRow label="A/c" value={USD_SWIFT.intermediaryAccount} onCopy={(v) => copy("ia", v)} copied={copied === "ia"} />
            </div>
          </div>
        )}
      </Card>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="amount">Amount Paid</Label>
            <Input id="amount" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="ref">Bank Reference / UTR / SWIFT MT103</Label>
          <Input id="ref" required value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" required value={form.buyer_company} onChange={(e) => setForm({ ...form, buyer_company: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="proof">Proof URL (optional)</Label>
          <Input id="proof" placeholder="Link to remittance receipt" value={form.proof_url} onChange={(e) => setForm({ ...form, proof_url: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Notify Finance Team
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Plan activates after our finance team confirms receipt (usually within 1 business day).
        </p>
      </form>
    </div>
  );
}

function DetailRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: (v: string) => void; copied?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-foreground break-all">{value}</span>
        {onCopy && (
          <button type="button" onClick={() => onCopy(value)} className="text-muted-foreground hover:text-foreground">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
