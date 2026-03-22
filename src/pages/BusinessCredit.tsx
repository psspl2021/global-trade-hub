import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield, Banknote, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const creditSchema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  contact_name: z.string().trim().min(1, "Contact name is required").max(100),
  phone: z.string().trim().min(10, "Valid phone number required").max(15),
  email: z.string().trim().email("Valid email required").max(255),
  turnover_range: z.string().min(1, "Select turnover range"),
  credit_required: z.string().trim().min(1, "Enter credit amount required").max(50),
  tenure: z.string().min(1, "Select credit period"),
  city: z.string().trim().min(1, "City is required").max(100),
});

const BENEFITS = [
  { icon: Clock, label: "Up to 90 days credit" },
  { icon: CheckCircle2, label: "Fast approval" },
  { icon: Shield, label: "Trusted lenders" },
  { icon: Banknote, label: "No collateral (select cases)" },
];

export default function BusinessCreditPage() {
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    email: "",
    turnover_range: "",
    credit_required: "",
    tenure: "",
    city: "",
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
        title="Business Credit for Raw Material Purchase | ProcureSaathi"
        description="Get up to 90 days credit for raw material procurement. Fast approval through trusted banks & NBFCs. Apply now for secured or unsecured business credit."
        canonical="https://www.procuresaathi.com/business-credit"
      />

      <main className="min-h-screen bg-background pt-20 pb-16">
        <section className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Get Business Credit for Raw Material Purchase
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              Procure raw materials with up to 90 days credit. Credit is sanctioned through
              trusted banks &amp; NBFCs based on your financials — secured or unsecured.
            </p>
            <p className="text-sm font-medium text-orange-600 mt-3">
              🔥 200+ businesses already applied for procurement credit this month
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {BENEFITS.map((b) => (
              <Card key={b.label} className="border-border/50">
                <CardContent className="flex items-center gap-2 p-4">
                  <b.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{b.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Form */}
          {!success ? (
            <Card className="max-w-lg mx-auto">
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
                  <Label>Company Turnover</Label>
                  <Select value={form.turnover_range} onValueChange={(v) => updateField("turnover_range", v)}>
                    <SelectTrigger><SelectValue placeholder="Select turnover range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1cr">₹0 – 1 Cr</SelectItem>
                      <SelectItem value="1-10cr">₹1 – 10 Cr</SelectItem>
                      <SelectItem value="10-50cr">₹10 – 50 Cr</SelectItem>
                      <SelectItem value="50cr+">₹50 Cr+</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.turnover_range && <p className="text-xs text-destructive">{errors.turnover_range}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="credit_required">Credit Required (₹)</Label>
                  <Input
                    id="credit_required"
                    placeholder="e.g. 25,00,000"
                    value={form.credit_required}
                    onChange={(e) => updateField("credit_required", e.target.value)}
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
                  {loading ? "Submitting..." : "Apply for Credit"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h2 className="text-xl font-semibold text-foreground">Application Submitted</h2>
                <p className="text-muted-foreground">Our team will contact you within 24 hours.</p>
                <Link to="/post-rfq" className="inline-flex items-center gap-1 text-primary underline text-sm hover:no-underline">
                  Post Your Requirement <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          )}

          {/* SEO content block */}
          <section className="mt-16 max-w-2xl mx-auto text-sm text-muted-foreground space-y-4">
            <h2 className="text-lg font-semibold text-foreground">How Business Credit Works on ProcureSaathi</h2>
            <p>
              ProcureSaathi partners with leading banks and NBFCs to provide working capital credit for raw material
              procurement. Whether you're buying steel, chemicals, polymers, or textiles, get credit lines of up to
              ₹5 Cr with flexible repayment tenures of 30, 60, or 90 days.
            </p>
            <p>
              Our credit program is designed for MSMEs, manufacturers, and traders who need short-term financing
              to fulfil bulk orders without straining cash flow. Apply in under 2 minutes and receive approval
              within 48 hours.
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
