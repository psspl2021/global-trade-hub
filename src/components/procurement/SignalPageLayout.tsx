import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, CheckCircle2, Users, Package, ArrowRight, 
  Lock, Building2, Globe, Clock, FileCheck, Phone,
  TrendingUp, Zap, Eye, EyeOff
} from 'lucide-react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { SignalPageConfig } from '@/data/signalPages';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { supabase } from '@/integrations/supabase/client';

interface SignalPageLayoutProps {
  config: SignalPageConfig;
}

export function SignalPageLayout({ config }: SignalPageLayoutProps) {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [signalPageId, setSignalPageId] = useState<string | undefined>();

  // Track page view and get/create signal page record
  useEffect(() => {
    const trackAndGetSignalPage = async () => {
      try {
        // Check if signal page exists in DB
        const { data: existingPage } = await supabase
          .from('admin_signal_pages')
          .select('id, views')
          .eq('slug', config.slug)
          .single();

        if (existingPage) {
          setSignalPageId(existingPage.id);
          // Increment view count
          await supabase
            .from('admin_signal_pages')
            .update({ views: (existingPage.views || 0) + 1 })
            .eq('id', existingPage.id);
        } else {
          // Create new signal page record
          const { data: newPage } = await supabase
            .from('admin_signal_pages')
            .insert({
              slug: config.slug,
              category: config.category,
              subcategory: config.subcategory,
              headline: config.headline,
              subheadline: config.subheadline,
              target_country: 'India',
              target_industries: config.industries,
              primary_cta: 'Submit Requirement',
              secondary_cta: 'Talk to Expert',
              views: 1,
              is_active: true
            })
            .select('id')
            .single();

          if (newPage) {
            setSignalPageId(newPage.id);
          }
        }
      } catch (error) {
        console.error('Error tracking signal page:', error);
      }
    };

    trackAndGetSignalPage();
  }, [config.slug, config.category, config.subcategory, config.headline, config.subheadline, config.industries]);

  // SEO - set document title and meta tags
  useEffect(() => {
    document.title = config.metaTitle;
    
    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', config.metaDescription);
    }
  }, [config.metaTitle, config.metaDescription]);

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi" 
              className="h-10 cursor-pointer" 
              onClick={() => navigate('/')}
            />
            <Button onClick={() => setShowRFQModal(true)} className="gap-2">
              Submit Requirement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Managed Procurement • No Supplier Interaction
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                {config.headline}
              </h1>

              <p className="text-xl text-muted-foreground mb-8">
                {config.subheadline}
              </p>

              {/* Key Stats */}
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{config.verifiedSuppliersCount}+ Verified Suppliers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">{config.successfulDealsCount}+ Successful Deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">{config.deliveryTimeline}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setShowRFQModal(true)}
                  className="gap-2 text-lg px-8 py-6"
                >
                  Submit Your Requirement
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/contact')}
                  className="gap-2 text-lg px-8 py-6"
                >
                  <Phone className="h-5 w-5" />
                  Talk to Procurement Expert
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Key Messaging - No Supplier Interaction */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <Lock className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-1">Single Price, Single Contract</h3>
                <p className="text-sm text-muted-foreground">No negotiation chaos</p>
              </Card>
              <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <EyeOff className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-1">No Supplier Interaction</h3>
                <p className="text-sm text-muted-foreground">We handle everything</p>
              </Card>
              <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-1">Verified Fulfilment Pool</h3>
                <p className="text-sm text-muted-foreground">Pre-qualified suppliers only</p>
              </Card>
              <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <Building2 className="h-8 w-8 mx-auto mb-3 text-green-600" />
                <h3 className="font-semibold mb-1">Managed by ProcureSaathi</h3>
                <p className="text-sm text-muted-foreground">End-to-end execution</p>
              </Card>
            </div>
          </div>
        </section>

        {/* Target Buyers */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Who This Is For</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {config.targetBuyers.map((buyer, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-base px-6 py-3"
                >
                  {buyer}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Features & Specifications */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Features */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  What You Get
                </h2>
                <ul className="space-y-4">
                  {config.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specifications */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Available Specifications
                </h2>
                <div className="flex flex-wrap gap-2">
                  {config.specifications.map((spec, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1.5">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Certifications Available
                </h3>
                <div className="flex flex-wrap gap-2">
                  {config.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deal Range Indicator */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="p-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-bold mb-2">Typical Deal Range</h2>
                  <p className="text-3xl font-bold text-primary mb-2">
                    ₹{(config.estimatedDealRange.min / 100000).toFixed(0)}L - ₹{(config.estimatedDealRange.max / 10000000).toFixed(0)}Cr
                  </p>
                  <p className="text-muted-foreground">
                    Based on {config.successfulDealsCount}+ successful transactions
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Source {config.subcategory}?
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Submit your requirement. Get a single competitive quote from our verified fulfilment pool.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowRFQModal(true)}
              className="gap-2 text-lg px-10 py-6"
            >
              Submit Your Requirement Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Footer Note */}
        <section className="py-8 bg-muted/50 border-t">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p className="max-w-3xl mx-auto">
              <strong>Important:</strong> ProcureSaathi manages sourcing & fulfilment end-to-end. 
              You receive a single price and single contract. No supplier list. No contact reveal. 
              Verified fulfilment from our pre-qualified partner network.
            </p>
          </div>
        </section>

        {/* RFQ Modal */}
        <PostRFQModal 
          open={showRFQModal} 
          onOpenChange={setShowRFQModal}
          signalPageId={signalPageId}
          signalPageCategory={config.category}
          signalPageCountry="India"
        />
    </div>
  );
}
