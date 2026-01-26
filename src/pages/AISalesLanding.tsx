import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, Shield, Clock, Star, 
  ArrowRight, Building, Globe, Sparkles 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSEO } from '@/hooks/useSEO';
import { PostRFQModal } from '@/components/PostRFQModal';

interface LandingPage {
  id: string;
  category: string;
  country: string;
  slug: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  meta_title: string;
  meta_description: string;
  hero_image_url?: string;
}

export default function AISalesLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [signalPageId, setSignalPageId] = useState<string | undefined>();

  useSEO({
    title: page?.meta_title || 'Get Quotes from Verified Suppliers | ProcureSaathi',
    description: page?.meta_description || 'Connect with verified B2B suppliers from India. Get competitive quotes for your procurement needs.',
  });

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      try {
        const response = await supabase.functions.invoke('ai-sales-landing', {
          body: { action: 'get_page_by_slug', slug },
        });

        if (response.error || !response.data.page) {
          navigate('/');
          return;
        }

        setPage(response.data.page);
      } catch (error) {
        console.error('Failed to fetch page:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, navigate]);

  // CRITICAL: Track page view for demand intelligence heatmap
  useEffect(() => {
    const trackPageView = async () => {
      if (!page || !slug) return;

      try {
        // Check if admin_signal_pages entry exists for this slug
        const { data: existingPage } = await supabase
          .from('admin_signal_pages')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingPage) {
          setSignalPageId(existingPage.id);
        } else {
          // Create entry if it doesn't exist (bridging ai_sales_landing_pages → admin_signal_pages)
          const { data: newPage } = await supabase
            .from('admin_signal_pages')
            .insert({
              slug: slug,
              category: page.category,
              subcategory: page.category, // Use category as subcategory for AI sales pages
              headline: page.headline,
              subheadline: page.subheadline,
              target_country: page.country?.toLowerCase() || 'india',
              target_industries: [],
              primary_cta: page.cta_text,
              views: 0,
              intent_score: 0,
              is_active: true
            })
            .select('id')
            .maybeSingle();

          if (newPage) {
            setSignalPageId(newPage.id);
          }
        }

        // Call RPC to track view and increment intent score (throttled)
        await supabase.rpc('promote_signal_on_visit', {
          p_slug: slug,
          p_country: page.country?.toLowerCase() || 'india',
        });
      } catch (error) {
        console.warn('[AISalesLanding] Signal tracking failed:', error);
      }
    };

    trackPageView();
  }, [page, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Sparkles className="w-12 h-12 mx-auto text-primary animate-bounce" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const features = [
    { icon: Shield, label: 'Verified Suppliers', description: 'All suppliers are quality-checked & verified' },
    { icon: Clock, label: 'Fast Response', description: 'Get quotes within 24 hours' },
    { icon: Star, label: 'Competitive Pricing', description: 'Best rates from top suppliers' },
    { icon: Globe, label: 'Pan-India Network', description: 'Suppliers across all regions' },
  ];

  // Note: Suppliers see only the project details, not buyer info

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            🇮🇳 Source from India
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {page.headline}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {page.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => setShowRFQModal(true)}
            >
              {page.cta_text} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/browse')}
            >
              Browse Verified Stock
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> No Login Required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> Free to Use
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> Instant Quotes
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            Why Source {page.category} from India?
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.label} className="text-center p-6">
                <CardContent className="pt-0">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.label}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Submit Your Requirement', desc: 'Tell us what you need - quantity, specifications, delivery location' },
              { step: '2', title: 'Get Verified Quotes', desc: 'Receive competitive quotes from pre-verified Indian suppliers' },
              { step: '3', title: 'Close the Deal', desc: 'Compare, negotiate, and close with the best supplier' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Trusted by Buyers in {page.country}</h2>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building className="w-6 h-6" />
              <span>500+ Active Suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-6 h-6" />
              <span>50+ Categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6" />
              <span>4.8/5 Buyer Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Source {page.category}?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Connect with verified suppliers and get the best prices today.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-lg px-8"
            onClick={() => setShowRFQModal(true)}
          >
            {page.cta_text} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      <PostRFQModal 
        open={showRFQModal} 
        onOpenChange={setShowRFQModal}
        signalPageId={signalPageId || page.id}
        signalPageCategory={page.category}
        signalPageCountry={page.country}
      />
    </div>
  );
}
