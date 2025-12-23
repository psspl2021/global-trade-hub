import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Receipt, 
  FileText, 
  ClipboardCheck, 
  CheckCircle, 
  BadgeCheck 
} from "lucide-react";

interface FreeCRMSectionProps {
  role?: 'buyer' | 'supplier';
}

export const FreeCRMSection = ({ role = 'supplier' }: FreeCRMSectionProps) => {
  const navigate = useNavigate();

  const features = [
    'Multiple GST rates (0%, 5%, 12%, 18%, 28%)',
    'HSN Code support',
    'Professional PDF format',
    'Bank details & terms',
    'Discount management',
    'Document history'
  ];

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <Card className="bg-gradient-to-br from-success/10 via-success/5 to-background border-success/30 overflow-hidden max-w-5xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BadgeCheck className="h-4 w-4" />
                100% FREE for All Users
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Free CRM & Tax Invoice Generator
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Generate professional GST-compliant Tax Invoices, Proforma Invoices, and Purchase Orders — completely FREE for all registered users!
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-card/50 border-success/20 hover:border-success/40 transition-colors">
                <CardContent className="p-5 text-center">
                  <Receipt className="h-10 w-10 text-success mx-auto mb-3" />
                  <h4 className="font-semibold mb-1">Tax Invoice</h4>
                  <p className="text-sm text-muted-foreground">GST-compliant invoices</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded">FREE ✓</span>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-success/20 hover:border-success/40 transition-colors">
                <CardContent className="p-5 text-center">
                  <FileText className="h-10 w-10 text-success mx-auto mb-3" />
                  <h4 className="font-semibold mb-1">Proforma Invoice</h4>
                  <p className="text-sm text-muted-foreground">Professional quotations</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded">FREE ✓</span>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-success/20 hover:border-success/40 transition-colors">
                <CardContent className="p-5 text-center">
                  <ClipboardCheck className="h-10 w-10 text-success mx-auto mb-3" />
                  <h4 className="font-semibold mb-1">Purchase Orders</h4>
                  <p className="text-sm text-muted-foreground">Manage vendor orders</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded">FREE ✓</span>
                </CardContent>
              </Card>
            </div>

            {/* Features List */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-success text-success-foreground hover:bg-success/90 h-12 px-8"
                onClick={() => navigate(`/signup?role=${role}`)}
              >
                <Receipt className="h-5 w-5 mr-2" />
                Sign Up Now — It's FREE!
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                No credit card required • Instant access after signup
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
