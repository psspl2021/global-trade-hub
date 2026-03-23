import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const creditSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100),
  phone: z.string().trim().min(10, "Valid phone number required").max(15),
  email: z.string().trim().email("Valid email required").max(255),
  turnover: z.string().trim().min(1, "Turnover is required").max(50).refine((val) => Number(val) > 0, "Enter valid turnover"),
  credit_required: z.string().trim().min(1, "Enter credit amount required").max(50),
  tenure: z.string().min(1, "Select credit period"),
  city: z.string().trim().min(1, "City is required").max(100),
  gst: z.string().trim().min(1, "GST is required").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter valid 15-character GST number"),
});

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Who can apply for procurement credit?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MSMEs, traders, manufacturers, and distributors across India."
      }
    },
    {
      "@type": "Question",
      "name": "Is collateral required?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Depends on financials — both secured and unsecured credit options are available."
      }
    },
    {
      "@type": "Question",
      "name": "What is the credit period?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Typically 30, 60, or 90 days depending on approval."
      }
    },
    {
      "@type": "Question",
      "name": "How fast is approval?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Initial approval within 24–48 hours after document verification."
      }
    }
  ]
};

export default function BusinessCreditPage() {
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    turnover: "",
    credit_required: "",
    tenure: "",
    city: "",
    gst: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = creditSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.from("credit_leads").insert([result.data]);
    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      setSuccess(true);
      toast.success("Application submitted successfully!");
    }
    setLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <>
      <SEOHead
        title="MSME Business Credit for Raw Material Purchase | ProcureSaathi"
        description="Get up to 90 days working capital credit for steel, chemicals, polymers & industrial raw materials. Fast approval through RBI-approved banks & NBFCs. Apply now."
        canonical="https://www.procuresaathi.com/business-credit"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      <main className="min-h-screen bg-background pb-16">
        {/* ===== HERO (MSME + TRUST + BRAND) ===== */}
        <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border relative">
          <div className="absolute right-8 top-8 hidden md:block opacity-90">
            <img
              src="/procuresaathi-logo.png"
              alt="ProcureSaathi"
              className="h-20 w-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="max-w-5xl mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight text-foreground">
              MSME Business Credit for{" "}
              <span className="text-primary">Raw Material Purchase</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
              Get up to <strong>90 days working capital credit</strong> for steel, chemicals,
              polymers, and industrial raw materials.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Credit lines from ₹5 Lakhs to ₹5 Crores available
            </p>
            <p className="text-sm text-destructive font-medium mb-6">
              🔥 200+ MSMEs applied for procurement credit this month
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm mb-4">
              <span className="border border-border rounded-full px-4 py-1 bg-card">✔ Up to 90 Days Credit</span>
              <span className="border border-border rounded-full px-4 py-1 bg-card">✔ Fast Approval</span>
              <span className="border border-border rounded-full px-4 py-1 bg-card">✔ RBI Approved Lenders</span>
              <span className="border border-border rounded-full px-4 py-1 bg-card">✔ Secured / Unsecured</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              <span>🔒 Secure Application</span>
              <span>🏦 Partnered with Banks &amp; NBFCs</span>
              <span>📊 MSME Focused Lending</span>
              <span>⚡ 24–48h Approval</span>
            </div>
          </div>
        </section>

        {/* ===== TRUST BAR ===== */}
        <section className="bg-muted py-6 text-center text-sm text-muted-foreground">
          Trusted by MSMEs, Traders &amp; Manufacturers across India for procurement financing
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold mb-6 text-center text-foreground">
            How MSME Credit Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="border border-border p-4 rounded-lg">
              <strong>1. Apply Online</strong>
              <p className="text-muted-foreground mt-2">
                Submit your business details and credit requirement in 2 minutes.
              </p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <strong>2. Get Assessed</strong>
              <p className="text-muted-foreground mt-2">
                Banks/NBFCs evaluate turnover, GST &amp; financials.
              </p>
            </div>
            <div className="border border-border p-4 rounded-lg">
              <strong>3. Get Credit Line</strong>
              <p className="text-muted-foreground mt-2">
                Receive approved credit for raw material procurement.
              </p>
            </div>
          </div>
        </section>

        {/* ===== APPLICATION FORM ===== */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          {!success ? (
            <Card className="max-w-lg mx-auto border shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground mb-2">Apply for Credit</h2>

                {[
                  { field: "company_name", label: "Company Name", placeholder: "Your company name" },
                  { field: "contact_name", label: "Contact Person", placeholder: "Full name" },
                  { field: "phone", label: "Phone", placeholder: "10-digit mobile number" },
                  { field: "email", label: "Email", placeholder: "business@company.com" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-1">
                    <Label htmlFor={field}>{label}</Label>
                    <Input
                      id={field}
                      placeholder={placeholder}
                      value={(form as any)[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                    />
                    {errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>}
                  </div>
                ))}

                <div className="space-y-1">
                  <Label htmlFor="turnover">Last Financial Year Turnover (₹) <span className="text-xs text-muted-foreground font-normal">(for loan eligibility)</span></Label>
                  <Input
                    id="turnover"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. ₹2,40,00,000"
                    value={form.turnover ? `₹${new Intl.NumberFormat("en-IN").format(Number(form.turnover))}` : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      updateField("turnover", raw);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter exact turnover based on last financial year (ITR/GST)
                  </p>
                  {errors.turnover && <p className="text-xs text-destructive">{errors.turnover}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="gst">GST Number (Optional)</Label>
                  <Input
                    id="gst"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={form.gst}
                    onChange={(e) => updateField("gst", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used only for credit assessment. Not shared publicly.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="credit_required">Credit Required (₹) <span className="text-xs text-muted-foreground font-normal">(for loan eligibility)</span></Label>
                  <Input
                    id="credit_required"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. ₹25,00,000"
                    value={form.credit_required ? `₹${new Intl.NumberFormat("en-IN").format(Number(form.credit_required))}` : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      updateField("credit_required", raw);
                    }}
                  />
                  {errors.credit_required && <p className="text-xs text-destructive">{errors.credit_required}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Credit Period</Label>
                  <Select value={form.tenure} onValueChange={(v) => updateField("tenure", v)}>
                    <SelectTrigger><SelectValue placeholder="Select credit period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 Days</SelectItem>
                      <SelectItem value="60">60 Days</SelectItem>
                      <SelectItem value="90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tenure && <p className="text-xs text-destructive">{errors.tenure}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>

                <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
                  {loading ? "Processing..." : "Apply for Credit →"}
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  ✔ No impact on CIBIL score · ✔ MSME compliant financing · ✔ 100% secure
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Application Submitted ✅</h2>
                <p className="text-muted-foreground">Our credit team will contact you within 24 hours.</p>
                <p className="text-sm text-muted-foreground">📞 Keep your phone available for faster processing</p>
                <Link to="/post-rfq" className="inline-flex items-center gap-1 text-primary underline text-sm hover:no-underline">
                  Post Your Requirement <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ===== FAQ (SEO BOOST) ===== */}
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-xl font-semibold mb-6 text-foreground">
            FAQs – MSME Business Credit
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Who can apply for procurement credit?</strong>
              <p className="text-muted-foreground">
                MSMEs, traders, manufacturers, and distributors across India.
              </p>
            </div>
            <div>
              <strong>Is collateral required?</strong>
              <p className="text-muted-foreground">
                Depends on financials — both secured and unsecured options available.
              </p>
            </div>
            <div>
              <strong>What is the credit period?</strong>
              <p className="text-muted-foreground">
                Typically 30, 60, or 90 days depending on approval.
              </p>
            </div>
            <div>
              <strong>How fast is approval?</strong>
              <p className="text-muted-foreground">
                Initial approval within 24–48 hours after document verification.
              </p>
            </div>
          </div>
        </section>

        {/* ===== INTERNAL LINKING (SEO BOOST) ===== */}
        <section className="text-center pb-10">
          <Link to="/post-rfq" className="text-primary underline">
            Post your raw material requirement →
          </Link>
        </section>
      </main>
    </>
  );
}
