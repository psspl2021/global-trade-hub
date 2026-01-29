import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, CheckCircle2, Users, ArrowRight, 
  Lock, Building2, Clock, FileCheck,
  TrendingUp, EyeOff, Globe
} from 'lucide-react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { CountryEnrichedSignalPageConfig } from '@/data/signalPages';
import { supportedCountries } from '@/data/supportedCountries';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { supabase } from '@/integrations/supabase/client';
import { saveCountryContext } from '@/data/countryTaxConfig';

interface SignalPageLayoutProps {
  config: CountryEnrichedSignalPageConfig;
  countryCode: string; // Geo-specific demand intelligence
}

export function SignalPageLayout({ config, countryCode }: SignalPageLayoutProps) {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [signalPageId, setSignalPageId] = useState<string | undefined>();

  // Use country info from enriched config
  const { countryInfo, logisticsLine, countryMetaTitle, countryMetaDescription } = config;
  const isIndia = countryInfo.code === 'india';

  // Generate country-aware slug for DB tracking
  const dbSlug = isIndia 
    ? config.slug 
    : `${countryCode}/${config.slug}`;

  // Extract stable primitives for dependency array
  const category = config.signalMapping.category;
  const subcategory = config.signalMapping.subcategory;
  const industry = config.signalMapping.industry;
  const h1 = config.h1;
  const subheading = config.subheading;

  // CRITICAL: Save country context to localStorage ON PAGE LOAD for signup flow
  useEffect(() => {
    if (countryCode && countryCode !== 'india') {
      saveCountryContext(countryCode);
    }
  }, [countryCode]);

  // Track page view and get/create signal page record
  // SINGLE SOURCE OF TRUTH: Only RPC handles view/intent counting
  useEffect(() => {
    let cancelled = false;

    const trackAndGetSignalPage = async () => {
      try {
        // FIX RISK #1: Use maybeSingle() to avoid throwing when row not found
        const { data: existingPage, error: fetchError } = await supabase
          .from('admin_signal_pages')
          .select('id')
          .eq('slug', dbSlug)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching signal page:', fetchError);
        }

        let pageExists = false;

        if (existingPage) {
          if (!cancelled) setSignalPageId(existingPage.id);
          pageExists = true;
        } else {
          // views/intent start at 0 (RPC increments), use countryCode not name
          const { data: newPage, error: insertError } = await supabase
            .from('admin_signal_pages')
            .insert({
              slug: dbSlug,
              category: category,
              subcategory: subcategory,
              headline: h1,
              subheadline: subheading,
              target_country: countryCode,
              target_industries: [industry],
              primary_cta: 'Request Managed Procurement Quote',
              secondary_cta: 'Talk to Expert',
              views: 0,
              intent_score: 0,
              is_active: true
            })
            .select('id')
            .single();

          if (insertError) {
            console.warn('Insert failed (likely race condition), refetching existing signal page...');
            
            const { data: retryPage } = await supabase
              .from('admin_signal_pages')
              .select('id')
              .eq('slug', dbSlug)
              .maybeSingle();

            if (retryPage) {
              if (!cancelled) setSignalPageId(retryPage.id);
              pageExists = true;
            }
          }

          if (newPage) {
            if (!cancelled) setSignalPageId(newPage.id);
            pageExists = true;
          }
        }

        // FIX RISK #2: Only call RPC if page exists (either found or created)
        if (pageExists) {
          await supabase.rpc('promote_signal_on_visit', {
            p_slug: dbSlug,
            p_country: countryCode || 'india',
          });
        }

      } catch (error) {
        console.error('Error tracking signal page:', error);
      }
    };

    trackAndGetSignalPage();

    return () => {
      cancelled = true;
    };
  }, [dbSlug, category, subcategory, industry, h1, subheading, countryCode]);

  // Track RFQ modal opened (throttled - no extra call needed, tracked on submit)
  const handleOpenRFQModal = useCallback(() => {
    // Country context already saved on page load - no need to save again
    setShowRFQModal(true);
    // Note: Intent tracking now happens via safe_promote_signal on RFQ submit
  }, []);

  // SEO - Country-aware meta tags and structured data
  useEffect(() => {
    document.title = countryMetaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', countryMetaDescription);
    }

    // Add canonical link (always points to base India URL)
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = `https://www.procuresaathi.com/procurement/${config.slug}`;

    // Add hreflang links for all supported countries
    const existingHreflangs = document.querySelectorAll('link[data-signal-hreflang]');
    existingHreflangs.forEach(el => el.remove());

    supportedCountries.forEach(country => {
      const hreflangLink = document.createElement('link');
      hreflangLink.rel = 'alternate';
      hreflangLink.setAttribute('hreflang', country.hreflangCode);
      hreflangLink.setAttribute('data-signal-hreflang', 'true');
      
      if (country.code === 'india') {
        hreflangLink.href = `https://www.procuresaathi.com/procurement/${config.slug}`;
      } else {
        hreflangLink.href = `https://www.procuresaathi.com/${country.code}/procurement/${config.slug}`;
      }
      document.head.appendChild(hreflangLink);
    });

    // Add x-default hreflang
    const xDefaultLink = document.createElement('link');
    xDefaultLink.rel = 'alternate';
    xDefaultLink.setAttribute('hreflang', 'x-default');
    xDefaultLink.setAttribute('data-signal-hreflang', 'true');
    xDefaultLink.href = `https://www.procuresaathi.com/procurement/${config.slug}`;
    document.head.appendChild(xDefaultLink);

    // Add structured data (Service + Organization, NOT Product/Seller)
    const existingScript = document.querySelector('script[data-signal-page]');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-signal-page', 'true');
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": config.h1,
      "description": countryMetaDescription,
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://procuresaathi.lovable.app"
      },
      "areaServed": countryInfo.name,
      "serviceType": "B2B Managed Procurement",
      "offers": {
        "@type": "Offer",
        "description": "Managed procurement with single contract fulfilment",
        "priceCurrency": countryInfo.currency
      }
    });
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-signal-page]');
      if (scriptToRemove) scriptToRemove.remove();
      const hreflangsToRemove = document.querySelectorAll('link[data-signal-hreflang]');
      hreflangsToRemove.forEach(el => el.remove());
    };
  }, [countryMetaTitle, countryMetaDescription, config.h1, config.slug, countryInfo]);

  const CTA_TEXT = 'Request Managed Procurement Quote';

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
          <Button onClick={handleOpenRFQModal} className="gap-2">
            {CTA_TEXT}
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
              Managed Procurement • Single Counterparty
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              {config.h1}
            </h1>

            <p className="text-sm text-muted-foreground bg-primary/10 px-4 py-2 rounded-lg inline-block mb-4">
              This page reflects live and emerging buyer demand detected by AI from search behavior and RFQs.
            </p>

            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              {config.subheading}
            </p>

            {/* Country-specific logistics line */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-sm font-medium mb-8">
              <Globe className="h-4 w-4" />
              {logisticsLine}
            </div>

            {/* Key Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{config.verifiedSuppliersCount}+ Verified Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{config.successfulDealsCount}+ Successful Deliveries</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">{config.deliveryTimeline}</span>
              </div>
            </div>

            {/* Primary CTA */}
            <Button 
              size="lg" 
              onClick={handleOpenRFQModal}
              className="gap-2 text-lg px-10 py-6"
            >
              {CTA_TEXT}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Body Text - Explain Model */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {config.bodyText.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-lg text-muted-foreground mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Messaging - Single Counterparty Model */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Lock className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Single Price</h3>
              <p className="text-sm text-muted-foreground">No negotiation required</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <EyeOff className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">No Supplier Interaction</h3>
              <p className="text-sm text-muted-foreground">We handle everything</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Verified Fulfilment</h3>
              <p className="text-sm text-muted-foreground">Pre-qualified partners only</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Building2 className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Single Contract</h3>
              <p className="text-sm text-muted-foreground">With ProcureSaathi Pvt Ltd</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Use Cases</h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {config.useCases.map((useCase, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-base px-6 py-3"
              >
                {useCase}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* What Buyer Gets */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What You Get</h2>
            <ul className="space-y-4">
              {config.whatBuyerGets.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {config.specifications && config.specifications.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <FileCheck className="h-6 w-6 text-primary" />
                Specifications Covered
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {config.specifications.map((spec, index) => (
                  <Badge key={index} variant="outline" className="px-4 py-2 text-sm">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Deal Range */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">Typical Deal Range</h2>
                <p className="text-3xl font-bold text-primary mb-2">
                  ₹{(config.typicalDealRange.min / 100000).toFixed(0)}L - ₹{(config.typicalDealRange.max / 10000000).toFixed(0)}Cr
                </p>
                <p className="text-muted-foreground">
                  Based on {config.successfulDealsCount}+ managed procurements
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
            Ready to Procure?
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Submit your requirement. Receive a single consolidated quote from ProcureSaathi.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleOpenRFQModal}
            className="gap-2 text-lg px-10 py-6"
          >
            {CTA_TEXT}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Internal Links for AI Discoverability */}
      <section className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Related Resources</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
              AI B2B Procurement Guide
            </a>
            <span className="text-muted-foreground">•</span>
            <a href={`/${countryCode === 'india' ? 'usa' : countryCode}/ai-b2b-procurement`} className="text-primary hover:underline">
              {countryCode === 'india' ? 'AI Procurement for USA Buyers' : `AI Procurement for ${countryInfo.name}`}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="/categories" className="text-primary hover:underline">
              Browse All Categories
            </a>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 bg-muted/50 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="max-w-3xl mx-auto mb-2">
            <strong>Important:</strong> ProcureSaathi manages sourcing & fulfilment end-to-end. 
            You receive a single price and single contract. No supplier list. No contact reveal. 
            Verified fulfilment from our pre-qualified partner network.
          </p>
          <p className="text-xs text-muted-foreground/70">
            ProcureSaathi does not sell leads. AI matches verified buyers and suppliers based on real demand signals.
          </p>
        </div>
      </section>

      {/* RFQ Modal */}
      <PostRFQModal 
        open={showRFQModal} 
        onOpenChange={setShowRFQModal}
        signalPageId={signalPageId}
        signalPageCategory={config.signalMapping.category}
        signalPageSubcategory={config.signalMapping.subcategory}
        signalPageIndustry={config.signalMapping.industry}
        signalPageCountry={countryInfo.name}
      />
    </div>
  );
}
