import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, Loader2, ArrowRight, CheckCircle2, Users, Shield, Zap,
  ArrowLeft, FileText, Clock, Building2, MapPin, CreditCard, Phone, MessageCircle
} from 'lucide-react';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { useRFQDraftTracking } from '@/hooks/useRFQDraftTracking';
import { useRfqTemplates, type RfqTemplate } from '@/hooks/useRfqTemplates';
import { useRfqPrefill, getSourceLabel } from '@/hooks/useRfqPrefill';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RFQItem {
  item_name: string;
  description: string;
  quantity: number;
  unit: string;
}

interface GeneratedRFQ {
  title: string;
  description: string;
  category: string;
  items: RFQItem[];
  trade_type: 'import' | 'export' | 'domestic_india';
  quality_standards?: string;
  certifications_required?: string;
  payment_terms?: string;
}

const PostRFQ = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // URL mode rule: /post-rfq?mode=reverse → redirect to reverse bridge
  // Hardened: also honor sessionStorage fallback in case query param is stripped
  // by an external/auth redirect; clear it after use to prevent sticky behaviour.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get('mode');
    let sessionMode: string | null = null;
    if (!queryMode) {
      try { sessionMode = sessionStorage.getItem('rfq_mode'); } catch {}
    }
    const mode = queryMode || sessionMode;
    if (mode === 'reverse') {
      // Track intent resolution path for funnel integrity analytics
      try {
        import('@/lib/analytics').then(({ trackEvent }) => {
          trackEvent('reverse_auction_entry', {
            source: params.get('source') || 'cta_reverse_auction',
            resolved_via: queryMode === 'reverse' ? 'query' : 'session_fallback',
            landing_path: window.location.pathname,
          });
        }).catch(() => {});
      } catch {}
      try { sessionStorage.removeItem('rfq_mode'); } catch {}
      navigate('/setup-reverse-auction', { replace: true });
    } else {
      try { localStorage.setItem('lastMode', 'forward'); } catch {}
    }
  }, [navigate]);

  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRFQ, setGeneratedRFQ] = useState<GeneratedRFQ | null>(null);

  // Prefill (location, payment, company, phone) — visible + editable
  const prefill = useRfqPrefill(user?.id);
  const [location, setLocation] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  useEffect(() => {
    if (!prefill.loading) {
      setLocation(prev => prev || prefill.location.value);
      setPaymentTerms(prev => prev || prefill.paymentTerms.value);
    }
  }, [prefill.loading, prefill.location.value, prefill.paymentTerms.value]);

  // Templates — 1-click prefill of textarea + items
  const { templates } = useRfqTemplates();
  const topTemplates = templates.slice(0, 5);
  const applyTemplate = useCallback((tpl: RfqTemplate) => {
    const itemsText = tpl.default_items
      .map(i => `${i.product_name} — ${i.quantity} ${i.unit}${i.description ? ` (${i.description})` : ''}`)
      .join('\n');
    const text = `${tpl.template_name}\n\n${itemsText}${tpl.quality_standards ? `\n\nQuality: ${tpl.quality_standards}` : ''}${location ? `\n\nDelivery: ${location}` : ''}`;
    setDescription(text);
    if (tpl.payment_terms && !paymentTerms) setPaymentTerms(tpl.payment_terms);
  }, [location, paymentTerms]);

  // RFQ Draft tracking - save draft when user abandons form
  const { markInteraction, markSubmitted } = useRFQDraftTracking({
    userId: user?.id || null,
    categorySlug: generatedRFQ?.category || undefined,
    pageUrl: '/post-rfq',
    formData: {
      description,
      generatedRFQ,
    },
    idleTimeoutMs: 45000, // 45 seconds idle timeout
  });

  // Handler to track form interactions
  const handleFormInteraction = useCallback(() => {
    markInteraction();
  }, [markInteraction]);

  useSEO({
    title: 'AI RFQ Generator - Free Request for Quotation Tool | ProcureSaathi',
    description: 'Create professional RFQs instantly with AI. Post your procurement requirements and get competitive quotes from 20,000+ verified Indian suppliers. Free B2B sourcing platform.',
    keywords: 'AI RFQ generator, Request for Quotation, B2B procurement India, supplier quotation, free RFQ tool, procurement automation, Indian manufacturers, industrial sourcing, bulk buying, wholesale suppliers',
    canonical: 'https://procuresaathi.com/post-rfq',
    ogImage: 'https://procuresaathi.com/procuresaathi-logo.png',
  });

  // Inject structured data for SEO
  useEffect(() => {
    // WebApplication schema for AI RFQ tool
    injectStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'ProcureSaathi AI RFQ Generator',
      description: 'AI-powered Request for Quotation generator for B2B procurement in India',
      url: 'https://procuresaathi.com/post-rfq',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        description: 'Free AI-powered RFQ generation'
      },
      featureList: [
        'AI-powered RFQ generation',
        'Connect with verified suppliers',
        'Receive competitive quotes',
        'Secure sealed bidding'
      ]
    }, 'rfq-webapp-schema');

    // Breadcrumb schema
    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://procuresaathi.com' },
      { name: 'Post RFQ', url: 'https://procuresaathi.com/post-rfq' }
    ]), 'rfq-breadcrumb-schema');

    // HowTo schema for the RFQ process
    injectStructuredData({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Create an AI-Powered RFQ',
      description: 'Step-by-step guide to creating a Request for Quotation using AI on ProcureSaathi',
      totalTime: 'PT5M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Describe Your Needs',
          text: 'Enter your product requirements, quantity, and delivery details in the AI generator'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'AI Generates RFQ',
          text: 'Our AI structures your requirements into a professional procurement document'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Matched to Suppliers',
          text: 'Your RFQ is sent to verified suppliers in your product category'
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Receive Quotes',
          text: 'Get competitive sealed bids from multiple suppliers within hours'
        }
      ]
    }, 'rfq-howto-schema');
  }, []);

  const handleGenerate = async () => {
    if (description.trim().length < 10) {
      toast.error('Please provide a more detailed description');
      return;
    }

    setIsGenerating(true);
    setGeneratedRFQ(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-rfq', {
        body: { description: description.trim() }
      });

      if (error) {
        console.error('RFQ generation error:', error);
        throw new Error(error.message || 'Failed to generate RFQ');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.rfq) {
        setGeneratedRFQ(data.rfq);
        toast.success('RFQ generated successfully!');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error: any) {
      console.error('Error generating RFQ:', error);
      toast.error(error.message || 'Failed to generate RFQ. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProceed = () => {
    // Mark as submitted since user is proceeding to complete the RFQ
    markSubmitted();

    // Merge prefill (location + payment) into the RFQ payload so the
    // downstream submit step doesn't ask the buyer again.
    const payload = generatedRFQ ? {
      ...generatedRFQ,
      delivery_location: location || undefined,
      payment_terms: paymentTerms || generatedRFQ.payment_terms,
    } : generatedRFQ;

    if (!user) {
      sessionStorage.setItem('pendingRFQ', JSON.stringify(payload));
      toast.info('Please sign up or login to post your RFQ');
      navigate('/signup?role=buyer&redirect=dashboard');
    } else {
      sessionStorage.setItem('pendingRFQ', JSON.stringify(payload));
      navigate('/dashboard');
    }
  };

  const tradeTypeLabels = {
    import: 'Import',
    export: 'Export',
    domestic_india: 'Domestic India'
  };

  const howItWorks = [
    { icon: FileText, title: 'Describe Your Needs', description: 'Product, quantity, and delivery details' },
    { icon: Sparkles, title: 'AI Drafts Your RFQ', description: 'Structured into a professional procurement doc' },
    { icon: Users, title: 'Matched to Suppliers', description: 'Sent to verified suppliers in your category' },
    { icon: Clock, title: 'Receive Quotes', description: 'Get competitive sealed bids within hours' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-10 sm:h-14 w-auto object-contain"
            />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {!user && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
              </>
            )}
            {user && (
              <Button size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Persistent Mode Strip */}
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="secondary" className="font-semibold">
              <FileText className="h-3 w-3 mr-1" /> Mode: Forward
            </Badge>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Suppliers will submit structured quotes for your requirement
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={() => navigate('/choose-procurement-mode')}
          >
            Switch mode
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Post Requirement — Receive Supplier Bids
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Suppliers submit structured quotes for comparison. Free, fast, and secure.
          </p>
        </div>

        {/* AI Generator Card */}
        <Card className="border-primary/20 shadow-xl mb-8">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-primary flex items-center justify-center gap-2 text-xl sm:text-2xl">
              <Sparkles className="h-6 w-6" />
              AI-powered RFQ generator
            </CardTitle>
            <CardDescription className="text-base">
              Describe your needs — our AI will generate a complete RFQ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick-start templates — 1-click prefill */}
            {topTemplates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  Start with a template
                </div>
                <div className="flex flex-wrap gap-2">
                  {topTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => { applyTemplate(tpl); handleFormInteraction(); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-colors text-foreground"
                    >
                      {tpl.template_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              placeholder="Describe your sourcing requirement in detail. Include product name, quantity, specifications, and delivery requirements for best results.

Example: I need 5000 kg of food-grade stainless steel containers for a dairy plant in Maharashtra. Looking for BIS certified products with 2mm thickness, 50L capacity each."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                handleFormInteraction();
              }}
              onFocus={handleFormInteraction}
              rows={6}
              className="resize-none text-base"
            />

            {/* Visible + editable prefill row (only shown when logged in) */}
            {user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="space-y-1">
                  <Label htmlFor="rfq-location" className="text-xs flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Shipping location
                    {prefill.location.source !== 'none' && location === prefill.location.value && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        · {getSourceLabel(prefill.location.source)}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="rfq-location"
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); handleFormInteraction(); }}
                    placeholder="e.g. Pune, Maharashtra"
                    className="h-9 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rfq-payment" className="text-xs flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    Payment terms
                    {prefill.paymentTerms.source !== 'none' && paymentTerms === prefill.paymentTerms.value && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        · {getSourceLabel(prefill.paymentTerms.source)}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="rfq-payment"
                    value={paymentTerms}
                    onChange={(e) => { setPaymentTerms(e.target.value); handleFormInteraction(); }}
                    placeholder="e.g. Net 30 days"
                    className="h-9 text-sm bg-background"
                  />
                </div>
                {(prefill.companyName.value || prefill.phone.value) && (
                  <div className="sm:col-span-2 flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                    {prefill.companyName.value && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {prefill.companyName.value}
                      </span>
                    )}
                    {prefill.phone.value && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {prefill.phone.value}
                      </span>
                    )}
                    <span className="text-[10px] opacity-70">· auto-filled from your profile, editable in Settings</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <a
                href="https://wa.me/918368127357?text=Hi%2C%20I%20need%20help%20posting%20an%20RFQ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Need help? WhatsApp us
              </a>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || description.trim().length < 10}
                className="gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate My RFQ
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Quotes from verified suppliers in 2–24 hours · Free · Sealed bidding
            </p>
          </CardContent>
        </Card>

        {/* Generated RFQ Preview */}
        {generatedRFQ && (
          <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Generated RFQ Preview
                </CardTitle>
                <Badge variant="secondary">{tradeTypeLabels[generatedRFQ.trade_type]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-xl">{generatedRFQ.title}</h4>
                <p className="text-muted-foreground mt-2">{generatedRFQ.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{generatedRFQ.category}</Badge>
                {generatedRFQ.quality_standards && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
                    {generatedRFQ.quality_standards}
                  </Badge>
                )}
                {generatedRFQ.certifications_required && (
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">
                    {generatedRFQ.certifications_required}
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-left p-3 font-medium">Specifications</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedRFQ.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3 font-medium">{item.item_name}</td>
                        <td className="p-3 text-muted-foreground">{item.description}</td>
                        <td className="p-3 text-right whitespace-nowrap">{item.quantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {generatedRFQ.payment_terms && (
                <p className="text-sm">
                  <span className="font-medium">Suggested Payment Terms:</span>{' '}
                  <span className="text-muted-foreground">{generatedRFQ.payment_terms}</span>
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setGeneratedRFQ(null)}
                >
                  Edit Description
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  size="lg"
                  onClick={handleProceed}
                >
                  {user ? 'Post RFQ Now' : 'Sign Up & Post RFQ'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground py-6 border-y">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">20,000+ Verified SMEs</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">Trusted by Procurement Teams</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-medium">AI-Assisted Sourcing</span>
          </div>
        </div>

        {/* How It Works */}
        <section className="py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            How AI-Powered RFQ Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What is RFQ Section */}
        <section className="py-12 border-t">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                What is a Request for Quotation (RFQ)?
              </h2>
              <p className="text-muted-foreground mb-6">
                A Request for Quotation (RFQ) is a formal procurement document that allows buyers to obtain price quotes and delivery terms from multiple suppliers. Unlike casual enquiries, RFQs standardise requirements so suppliers compete fairly on the same specifications.
              </p>
              <h3 className="font-semibold text-lg mb-3">Why It Matters:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Compare prices and timelines easily</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Drive competitive bidding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Improve transparency and compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Save procurement time and cost</span>
                </li>
              </ul>
            </div>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-8 w-8 text-primary" />
                <h3 className="font-semibold text-xl">Professional RFQ</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Standardized format</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Clear specifications</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Multiple supplier quotes</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Competitive sealed bidding</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 text-center">
          <Card className="p-8 bg-primary/5 border-primary/20">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Ready to Start Sourcing?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of businesses already using ProcureSaathi for their procurement needs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/signup?role=buyer')}>
                Sign Up as Buyer
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/signup?role=supplier')}>
                Join as Supplier
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ProcureSaathi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PostRFQ;
