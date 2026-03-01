import { ShieldCheck, Factory, Users } from "lucide-react";

export default function TrustStrip() {
  return (
    <section className="mt-10 rounded-xl bg-muted p-6">
      <div className="grid gap-4 text-center md:grid-cols-3">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">BIS Certified Suppliers</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Factory className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Mill Direct Pricing</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Verified EPC Network</span>
        </div>
      </div>
    </section>
  );
}
