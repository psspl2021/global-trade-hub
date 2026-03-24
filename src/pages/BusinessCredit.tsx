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

      <main className="min-h-screen bg-background">
        {/* ===== NAVBAR ===== */}
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/procuresaathi-logo.png"
                alt="ProcureSaathi"
                className="h-14 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-xl font-bold tracking-tight text-foreground">ProcureSaathi</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">🔒 256-bit Encrypted</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">🏦 RBI Regulated Partners</span>
            </div>
          </div>
        </nav>

        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
                🔥 200+ MSMEs applied this month
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground tracking-tight">
                MSME Business Credit for{" "}
                <span className="text-primary">Raw Material Purchase</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Get up to <strong className="text-foreground">90 days working capital credit</strong> for steel, chemicals,
                polymers, and industrial raw materials. Powered by trusted banks &amp; NBFCs.
              </p>
              <p className="text-base font-semibold text-foreground">
                Credit lines from <span className="text-primary">₹5 Lakhs</span> to <span className="text-primary">₹5 Crores</span>
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["Up to 90 Days Credit", "24–48h Approval", "RBI Approved Lenders", "Secured & Unsecured"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 bg-card border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground">
              <span>🔒 Secure Application</span>
              <span>🏦 Partnered with Banks &amp; NBFCs</span>
              <span>📊 MSME Focused Lending</span>
            </div>
          </div>
        </section>

        {/* ===== IDEAL FOR + TRUST BAR ===== */}
        <section className="border-y border-border bg-muted/50">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Ideal for:</span>
            <span>🏭 Manufacturers buying raw materials</span>
            <span>📦 Traders handling bulk orders</span>
            <span>💼 MSMEs facing working capital gaps</span>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
            How MSME Credit Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Apply Online", desc: "Submit your business details and credit requirement in 2 minutes.", icon: "📋" },
              { step: "02", title: "Get Assessed", desc: "Banks/NBFCs evaluate turnover, GST & financials.", icon: "🔍" },
              { step: "03", title: "Get Credit Line", desc: "Receive approved credit for raw material procurement.", icon: "💳" },
            ].map((item) => (
              <div key={item.step} className="relative bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-xs font-bold text-primary tracking-widest mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== APPLICATION FORM ===== */}
        <section className="max-w-4xl mx-auto px-4 py-10" id="apply">
          {!success ? (
            <Card className="max-w-lg mx-auto border-2 border-primary/20 shadow-xl bg-card">
              <CardContent className="pt-8 pb-6 space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-foreground">Apply for Credit</h2>
                  <p className="text-sm text-muted-foreground mt-1">Takes less than 2 minutes</p>
                </div>

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
                  <Label htmlFor="gst">GST Number *</Label>
                  <Input
                    id="gst"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={form.gst}
                    onChange={(e) => updateField("gst", e.target.value.toUpperCase())}
                    maxLength={15}
                    className="min-h-[44px] uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for faster approval &amp; lender verification
                  </p>
                  {errors.gst && <p className="text-xs text-destructive">{errors.gst}</p>}
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
        {/* ===== FAQ ===== */}
        <section className="bg-muted/30 border-t border-border">
          <div className="max-w-4xl mx-auto px-4 py-14">
            <h2 className="text-2xl font-bold mb-8 text-foreground">
              FAQs – MSME Business Credit
            </h2>
            <div className="space-y-6">
              {FAQ_SCHEMA.mainEntity.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-5">
                  <strong className="text-foreground">{faq.name}</strong>
                  <p className="text-muted-foreground text-sm mt-2">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA FOOTER ===== */}
        <section className="border-t border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 py-10 text-center space-y-4">
            <p className="text-lg font-semibold text-foreground">Not looking for credit?</p>
            <Link to="/post-rfq" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              Post your raw material requirement <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              © {new Date().getFullYear()} ProcureSaathi · Trusted by MSMEs across India
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
