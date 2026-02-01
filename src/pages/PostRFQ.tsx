import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, Loader2, ArrowRight, CheckCircle2, Users, Shield, Zap,
  ArrowLeft, FileText, Clock, Building2
} from 'lucide-react';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';
import { useAuth } from '@/hooks/useAuth';

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
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRFQ, setGeneratedRFQ] = useState<GeneratedRFQ | null>(null);

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
    if (!user) {
      // Store RFQ in sessionStorage and redirect to signup
      sessionStorage.setItem('pendingRFQ', JSON.stringify(generatedRFQ));
      toast.info('Please sign up or login to post your RFQ');
      navigate('/signup?role=buyer&redirect=dashboard');
    } else {
      // Store RFQ and redirect to dashboard
      sessionStorage.setItem('pendingRFQ', JSON.stringify(generatedRFQ));
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
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Post Your RFQ. Get Multiple Quotes.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with verified Indian suppliers in minutes. Free, fast, and secure.
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
            <Textarea
              placeholder="Describe your sourcing requirement in detail. Include product name, quantity, specifications, and delivery requirements for best results.

Example: I need 5000 kg of food-grade stainless steel containers for a dairy plant in Maharashtra. Looking for BIS certified products with 2mm thickness, 50L capacity each."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none text-base"
            />

            <div className="flex justify-end">
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
              Include details like product name, quantity, specifications, and delivery requirements for best results.
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
