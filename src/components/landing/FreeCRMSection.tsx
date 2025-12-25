import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { 
  Receipt, 
  FileText, 
  ClipboardCheck, 
  CheckCircle, 
  BadgeCheck 
} from "lucide-react";
import { getCRMFAQSchema } from "@/hooks/useCRMSEO";
import { injectStructuredData } from "@/hooks/useSEO";

interface FreeCRMSectionProps {
  role?: 'buyer' | 'supplier';
}

export const FreeCRMSection = ({ role = 'supplier' }: FreeCRMSectionProps) => {
  const navigate = useNavigate();

  // Inject CRM-specific SEO schemas
  useEffect(() => {
    // Inject FAQ schema for CRM
    injectStructuredData(getCRMFAQSchema(), 'crm-faq-schema');

    // Inject Product schema for Free CRM
    injectStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Free CRM & GST Tax Invoice Generator',
      description: 'Free CRM software with GST-compliant tax invoice generator, proforma invoice maker, and purchase order management for Indian B2B businesses.',
      brand: {
        '@type': 'Brand',
        name: 'ProcureSaathi'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: 'ProcureSaathi'
        }
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '320',
        bestRating: '5'
      },
      category: 'Business Software'
    }, 'crm-product-schema');

    return () => {
      // Cleanup
      const faqScript = document.getElementById('crm-faq-schema');
      const productScript = document.getElementById('crm-product-schema');
      if (faqScript) faqScript.remove();
      if (productScript) productScript.remove();
    };
  }, []);

  const features = [
    'Multiple GST rates (0%, 5%, 12%, 18%, 28%)',
    'HSN Code support',
    'Professional PDF format',
    'Bank details & terms',
    'Discount management',
    'Document history'
  ];

  return (
    <section 
      className="py-16 bg-muted/20"
      aria-labelledby="free-crm-heading"
      itemScope
      itemType="https://schema.org/SoftwareApplication"
    >
      <meta itemProp="applicationCategory" content="BusinessApplication" />
      <meta itemProp="operatingSystem" content="Web Browser" />
      
      <div className="container mx-auto px-4">
        <Card className="bg-gradient-to-br from-success/10 via-success/5 to-background border-success/30 overflow-hidden max-w-5xl mx-auto">
          <CardContent className="p-8">
            <header className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                <span>100% FREE for All Users</span>
              </div>
              <h2 
                id="free-crm-heading" 
                className="text-2xl md:text-3xl font-bold mb-3"
                itemProp="name"
              >
                Free CRM & Tax Invoice Generator
              </h2>
              <p 
                className="text-muted-foreground max-w-2xl mx-auto"
                itemProp="description"
              >
                Generate professional GST-compliant Tax Invoices, Proforma Invoices, and Purchase Orders — completely FREE for all registered users!
              </p>
            </header>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8" role="list" aria-label="CRM Features">
              <article className="bg-card/50 border border-success/20 hover:border-success/40 transition-colors rounded-lg" role="listitem">
                <div className="p-5 text-center">
                  <Receipt className="h-10 w-10 text-success mx-auto mb-3" aria-hidden="true" />
                  <h3 className="font-semibold mb-1">GST Tax Invoice</h3>
                  <p className="text-sm text-muted-foreground">GST-compliant invoices with GSTIN</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded" aria-label="Free feature">FREE ✓</span>
                </div>
              </article>
              <article className="bg-card/50 border border-success/20 hover:border-success/40 transition-colors rounded-lg" role="listitem">
                <div className="p-5 text-center">
                  <FileText className="h-10 w-10 text-success mx-auto mb-3" aria-hidden="true" />
                  <h3 className="font-semibold mb-1">Proforma Invoice</h3>
                  <p className="text-sm text-muted-foreground">Professional quotations & estimates</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded" aria-label="Free feature">FREE ✓</span>
                </div>
              </article>
              <article className="bg-card/50 border border-success/20 hover:border-success/40 transition-colors rounded-lg" role="listitem">
                <div className="p-5 text-center">
                  <ClipboardCheck className="h-10 w-10 text-success mx-auto mb-3" aria-hidden="true" />
                  <h3 className="font-semibold mb-1">Purchase Orders</h3>
                  <p className="text-sm text-muted-foreground">Manage vendor orders efficiently</p>
                  <span className="inline-block mt-2 text-xs bg-success/20 text-success px-2 py-1 rounded" aria-label="Free feature">FREE ✓</span>
                </div>
              </article>
            </div>

            {/* Features List */}
            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto" itemProp="featureList">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <footer className="text-center">
              <Button 
                size="lg" 
                className="bg-success text-success-foreground hover:bg-success/90 h-12 px-8"
                onClick={() => navigate(`/signup?role=${role}`)}
                aria-label="Sign up for free CRM and tax invoice generator"
              >
                <Receipt className="h-5 w-5 mr-2" aria-hidden="true" />
                Sign Up Now — It's FREE!
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                No credit card required • Instant access after signup
              </p>
            </footer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
