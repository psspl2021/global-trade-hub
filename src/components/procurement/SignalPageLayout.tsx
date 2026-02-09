import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, CheckCircle2, ArrowRight, 
  Lock, Building2, Clock, FileCheck,
  TrendingUp, EyeOff, Globe, Flame,
  Package, MapPin, BarChart3, ExternalLink,
  Sparkles, Brain, Eye
} from 'lucide-react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { CountryEnrichedSignalPageConfig } from '@/data/signalPages';
import { supportedCountries } from '@/data/supportedCountries';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { saveCountryContext } from '@/data/countryTaxConfig';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { toast } from 'sonner';

interface SignalPageLayoutProps {
  config: CountryEnrichedSignalPageConfig;
  countryCode: string;
}

// Managed procurement quote form
function ManagedProcurementForm({ slug, category, subcategory }: { slug: string; category: string; subcategory: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    quantity_specs: '',
    delivery_location: '',
    timeline: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.email) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      // Log as a demand signal / lead
      const { error } = await supabase
        .from('ai_sales_leads' as any)
        .insert({
          buyer_name: form.contact_person,
          company_name: form.company_name,
          email: form.email,
          phone: form.phone || null,
          category: category,
          subcategory: subcategory,
          country: form.delivery_location || 'India',
          lead_source: 'slug_page',
          acquisition_source: slug,
          status: 'new',
          confidence_score: 8,
          notes: `Qty/Specs: ${form.quantity_specs}\nTimeline: ${form.timeline}\nDelivery: ${form.delivery_location}\nNotes: ${form.notes}`,
        });

      if (error) throw error;

      // Also increment intent on the signal page
      await supabase.rpc('promote_signal_on_visit' as any, {
        p_slug: slug,
        p_country: form.delivery_location?.toLowerCase().includes('india') ? 'india' : 'export',
      });

      setSubmitted(true);
      toast.success('Your procurement request has been submitted!');
    } catch (err) {
      console.error('Form submit error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
        <h3 className="text-xl font-bold mb-2">Request Received</h3>
        <p className="text-muted-foreground">
          Our procurement team will contact you within 24 hours with a managed quote.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Request Managed Procurement Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" required value={form.company_name} onChange={e => handleChange('company_name', e.target.value)} placeholder="Your company name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input id="contact_person" required value={form.contact_person} onChange={e => handleChange('contact_person', e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="quantity_specs">Quantity / Specifications</Label>
              <Input id="quantity_specs" value={form.quantity_specs} onChange={e => handleChange('quantity_specs', e.target.value)} placeholder="e.g. 500 MT, IS 2062 Grade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_location">Delivery Location</Label>
              <Input id="delivery_location" value={form.delivery_location} onChange={e => handleChange('delivery_location', e.target.value)} placeholder="City, State or Country" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input id="timeline" value={form.timeline} onChange={e => handleChange('timeline', e.target.value)} placeholder="e.g. Within 30 days" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Any specific requirements..." rows={3} />
            </div>
          </div>
          {/* Hidden fields encoded in submit */}
          <Button type="submit" className="w-full gap-2 text-lg py-6" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Procurement Request'}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Your information is secure. ProcureSaathi acts as your sole procurement counterparty.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// Admin-only analytics panel
function AdminDemandPanel({ slug, category }: { slug: string; category: string }) {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('admin_signal_pages')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (data) setStats(data);
    };
    fetchStats();
  }, [slug]);

  if (!stats) return null;

  return (
    <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <BarChart3 className="h-5 w-5" />
          Admin Demand Analytics
          <Badge className="bg-amber-600 text-white text-xs">ADMIN ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-background border">
            <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.views?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{stats.intent_score || 0}</p>
            <p className="text-xs text-muted-foreground">Intent Score</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border">
            <FileCheck className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.rfqs_submitted || 0}</p>
            <p className="text-xs text-muted-foreground">RFQs Submitted</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-background border">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{stats.conversion_rate ? `${(stats.conversion_rate * 100).toFixed(1)}%` : '—'}</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Category: <strong>{stats.category}</strong> • Country: <strong>{stats.target_country}</strong>
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate('/control-tower')} className="gap-1">
            <ExternalLink className="h-3 w-3" />
            Open in Control Tower
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SignalPageLayout({ config, countryCode }: SignalPageLayoutProps) {
  const navigate = useNavigate();
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [signalPageId, setSignalPageId] = useState<string | undefined>();
  const { primaryRole, isLoading: roleLoading } = useGovernanceAccess();

  const isAdmin = !roleLoading && ['admin', 'ps_admin'].includes(primaryRole);

  const { countryInfo, logisticsLine, countryMetaTitle, countryMetaDescription } = config;
  const isIndia = countryInfo.code === 'india';

  const dbSlug = isIndia ? config.slug : `${countryCode}/${config.slug}`;

  const category = config.signalMapping.category;
  const subcategory = config.signalMapping.subcategory;
  const industry = config.signalMapping.industry;
  const h1 = config.h1;
  const subheading = config.subheading;

  // Save country context
  useEffect(() => {
    if (countryCode && countryCode !== 'india') {
      saveCountryContext(countryCode);
    }
  }, [countryCode]);

  // Track page view
  useEffect(() => {
    let cancelled = false;

    const trackAndGetSignalPage = async () => {
      try {
        const { data: existingPage, error: fetchError } = await supabase
          .from('admin_signal_pages')
          .select('id')
          .eq('slug', dbSlug)
          .maybeSingle();

        if (fetchError) console.error('Error fetching signal page:', fetchError);

        let pageExists = false;

        if (existingPage) {
          if (!cancelled) setSignalPageId(existingPage.id);
          pageExists = true;
        } else {
          const { data: newPage, error: insertError } = await supabase
            .from('admin_signal_pages')
            .insert({
              slug: dbSlug,
              category, subcategory,
              headline: h1, subheadline: subheading,
              target_country: countryCode,
              target_industries: [industry],
              primary_cta: 'Request Managed Procurement Quote',
              secondary_cta: 'Talk to Expert',
              views: 0, intent_score: 0, is_active: true
            })
            .select('id')
            .single();

          if (insertError) {
            const { data: retryPage } = await supabase
              .from('admin_signal_pages').select('id').eq('slug', dbSlug).maybeSingle();
            if (retryPage) { if (!cancelled) setSignalPageId(retryPage.id); pageExists = true; }
          }
          if (newPage) { if (!cancelled) setSignalPageId(newPage.id); pageExists = true; }
        }

        if (pageExists) {
          await supabase.rpc('promote_signal_on_visit', { p_slug: dbSlug, p_country: countryCode || 'india' });
        }
      } catch (error) {
        console.error('Error tracking signal page:', error);
      }
    };

    trackAndGetSignalPage();
    return () => { cancelled = true; };
  }, [dbSlug, category, subcategory, industry, h1, subheading, countryCode]);

  const handleOpenRFQModal = useCallback(() => {
    setShowRFQModal(true);
  }, []);

  // SEO meta tags & structured data
  useEffect(() => {
    document.title = `Managed Procurement for ${subcategory} | ProcureSaathi`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `AI-managed sourcing, pricing, quality & delivery for ${subcategory}. ProcureSaathi acts as your single procurement counterparty.`);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = `https://www.procuresaathi.com/procurement/${config.slug}`;

    const existingHreflangs = document.querySelectorAll('link[data-signal-hreflang]');
    existingHreflangs.forEach(el => el.remove());

    supportedCountries.forEach(country => {
      const hreflangLink = document.createElement('link');
      hreflangLink.rel = 'alternate';
      hreflangLink.setAttribute('hreflang', country.hreflangCode);
      hreflangLink.setAttribute('data-signal-hreflang', 'true');
      hreflangLink.href = country.code === 'india'
        ? `https://www.procuresaathi.com/procurement/${config.slug}`
        : `https://www.procuresaathi.com/${country.code}/procurement/${config.slug}`;
      document.head.appendChild(hreflangLink);
    });

    const xDefaultLink = document.createElement('link');
    xDefaultLink.rel = 'alternate';
    xDefaultLink.setAttribute('hreflang', 'x-default');
    xDefaultLink.setAttribute('data-signal-hreflang', 'true');
    xDefaultLink.href = `https://www.procuresaathi.com/procurement/${config.slug}`;
    document.head.appendChild(xDefaultLink);

    const existingScript = document.querySelector('script[data-signal-page]');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-signal-page', 'true');
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": `Managed Procurement for ${subcategory}`,
      "description": `AI-managed sourcing, pricing, quality & delivery for ${subcategory} — handled end-to-end by ProcureSaathi.`,
      "provider": { "@type": "Organization", "name": "ProcureSaathi", "url": "https://procuresaathi.lovable.app" },
      "areaServed": countryInfo.name,
      "serviceType": "B2B Managed Procurement",
      "offers": { "@type": "Offer", "description": "Managed procurement with single contract fulfilment", "priceCurrency": countryInfo.currency }
    });
    document.head.appendChild(script);

    return () => {
      const s = document.querySelector('script[data-signal-page]');
      if (s) s.remove();
      document.querySelectorAll('link[data-signal-hreflang]').forEach(el => el.remove());
    };
  }, [subcategory, config.slug, countryInfo]);

  // Derive demand status from config
  const demandLevel = (config as any).intentScore >= 7 ? 'High' : (config as any).intentScore >= 4 ? 'Medium' : 'Emerging';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-14 md:h-16 cursor-pointer" onClick={() => navigate('/')} />
          <Button onClick={handleOpenRFQModal} className="gap-2">
            Request Managed Quote
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 1️⃣ HERO SECTION */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 gap-1">
                <Shield className="h-3.5 w-3.5" />
                Managed Procurement – Single Counterparty
              </Badge>
              <Badge className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 gap-1">
                <Brain className="h-3.5 w-3.5" />
                AI-Detected Buyer Demand
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Managed Procurement for {subcategory}
            </h1>

            <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
              AI-managed sourcing, pricing, quality & delivery — handled end-to-end by ProcureSaathi.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-sm font-medium mb-8">
              <Globe className="h-4 w-4" />
              {logisticsLine}
            </div>

            <div className="flex justify-center">
              <Button size="lg" onClick={handleOpenRFQModal} className="gap-2 text-lg px-10 py-6">
                Request Managed Procurement Quote
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ WHAT THIS PAGE MEANS */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="p-6 md:p-8 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                <h2 className="text-xl font-bold">What This Page Represents</h2>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  This page represents <strong>active and emerging buyer demand</strong> detected by ProcureSaathi's AI 
                  from RFQs, searches, and industry signals.
                </p>
                <p>
                  ProcureSaathi acts as the <strong>single procurement counterparty</strong>. 
                  Buyers do not interact with suppliers. 
                  Suppliers operate as verified fulfilment partners under our control.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3️⃣ LIVE DEMAND SIGNALS */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Live Demand Signals
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <Flame className="h-5 w-5 mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-muted-foreground mb-1">Demand Status</p>
                <Badge className={
                  demandLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                  demandLevel === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                }>{demandLevel}</Badge>
              </Card>
              <Card className="p-4 text-center">
                <Package className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Order Size</p>
                <p className="font-semibold text-sm">
                  ₹{((config.typicalDealRange?.min || 500000) / 100000).toFixed(0)}L – ₹{((config.typicalDealRange?.max || 50000000) / 10000000).toFixed(0)}Cr
                </p>
              </Card>
              <Card className="p-4 text-center">
                <MapPin className="h-5 w-5 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-muted-foreground mb-1">Delivery</p>
                <p className="font-semibold text-sm">{isIndia ? 'Pan-India' : `India + ${countryInfo.name}`}</p>
              </Card>
              <Card className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground mb-1">Fulfilment</p>
                <p className="font-semibold text-sm">{config.deliveryTimeline || '10–30 days'}</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 6️⃣ ADMIN-ONLY ANALYTICS */}
      {isAdmin && (
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <AdminDemandPanel slug={dbSlug} category={category} />
            </div>
          </div>
        </section>
      )}

      {/* 4️⃣ PRIMARY CTA FORM */}
      <section className="py-12 bg-muted/30" id="quote-form">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ManagedProcurementForm slug={dbSlug} category={category} subcategory={subcategory} />
          </div>
        </div>
      </section>

      {/* 5️⃣ WHY MANAGED PROCUREMENT */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Managed Procurement</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Verified Supply Network</h3>
              <p className="text-sm text-muted-foreground">Pre-qualified and audited fulfilment partners</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Brain className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">AI-Controlled Pricing</h3>
              <p className="text-sm text-muted-foreground">Sealed bidding ensures competitive, fair pricing</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Quality & Compliance</h3>
              <p className="text-sm text-muted-foreground">End-to-end quality control and documentation</p>
            </Card>
            <Card className="text-center p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <Building2 className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-1">Logistics Guaranteed</h3>
              <p className="text-sm text-muted-foreground">Managed delivery with tracking & insurance</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Body Text - Model Explanation */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
            {config.bodyText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-lg text-muted-foreground mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Use Cases</h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {config.useCases.map((useCase, index) => (
              <Badge key={index} variant="secondary" className="text-base px-6 py-3">{useCase}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* What Buyer Gets */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">What You Get</h2>
            <ul className="space-y-3">
              {config.whatBuyerGets.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Specifications */}
      {config.specifications && config.specifications.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Specifications Covered
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {config.specifications.map((spec, index) => (
                  <Badge key={index} variant="outline" className="px-4 py-2 text-sm">{spec}</Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA — Buyer-focused ONLY */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Source {subcategory}?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Get a managed procurement quote. One price, one contract, full delivery guarantee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg" variant="secondary"
              onClick={handleOpenRFQModal}
              className="gap-2 text-lg px-10 py-6"
            >
              Request Managed Quote
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg" variant="outline"
              onClick={() => { const el = document.getElementById('quote-form'); el?.scrollIntoView({ behavior: 'smooth' }); }}
              className="gap-2 text-lg px-10 py-6 bg-white/10 text-primary-foreground border-primary-foreground/30 hover:bg-white/20"
            >
              Fill Detailed Form
              <FileCheck className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Related Resources</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">AI B2B Procurement Guide</a>
            <span className="text-muted-foreground">•</span>
            <a href={`/${countryCode === 'india' ? 'usa' : countryCode}/ai-b2b-procurement`} className="text-primary hover:underline">
              {countryCode === 'india' ? 'AI Procurement for USA Buyers' : `AI Procurement for ${countryInfo.name}`}
            </a>
            <span className="text-muted-foreground">•</span>
            <a href="/categories" className="text-primary hover:underline">Browse All Categories</a>
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
        open={showRFQModal} onOpenChange={setShowRFQModal}
        signalPageId={signalPageId}
        signalPageCategory={category}
        signalPageSubcategory={subcategory}
        signalPageIndustry={industry}
        signalPageCountry={countryInfo.name}
      />
    </div>
  );
}
