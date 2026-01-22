import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, Users, Shield, Zap, Lock, Eye, EyeOff } from 'lucide-react';
import { trackIntentScore, incrementRFQCount, createDemandSignal } from '@/lib/signalPageTracking';

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

interface PostRFQModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalPageId?: string;
  signalPageCategory?: string;
  signalPageSubcategory?: string;
  signalPageIndustry?: string;
  signalPageCountry?: string;
}

export function PostRFQModal({ 
  open, 
  onOpenChange, 
  signalPageId,
  signalPageCategory,
  signalPageSubcategory,
  signalPageIndustry,
  signalPageCountry 
}: PostRFQModalProps) {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRFQ, setGeneratedRFQ] = useState<GeneratedRFQ | null>(null);

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

  const handleProceed = async () => {
    // Store generated RFQ in session storage for use after signup
    if (generatedRFQ) {
      const rfqWithAttribution = {
        ...generatedRFQ,
        signalPageId,
        signalPageCategory,
        signalPageSubcategory,
        signalPageIndustry,
        signalPageCountry,
        source: signalPageId ? 'signal_page' : 'direct'
      };
      sessionStorage.setItem('pendingRFQ', JSON.stringify(rfqWithAttribution));

      // CRITICAL: Auto-create demand signal on RFQ submit
      if (signalPageId && signalPageCategory) {
        // Track RFQ submitted intent (+5)
        await trackIntentScore(signalPageId, 'rfq_submitted');
        
        // Increment RFQ count on signal page
        await incrementRFQCount(signalPageId);

        // Create demand intelligence signal with country
        await createDemandSignal({
          signalPageId,
          signalPageCategory,
          subcategory: signalPageSubcategory || generatedRFQ.category,
          industry: signalPageIndustry,
          productDescription: generatedRFQ.title,
          deliveryLocation: signalPageCountry || 'India',
          country: signalPageCountry || 'India', // Geo-specific demand tracking
        });
      }
    }
    onOpenChange(false);
    navigate('/signup?role=buyer');
  };

  const tradeTypeLabels = {
    import: 'Import',
    export: 'Export',
    domestic_india: 'Domestic India'
  };

  const handleClose = () => {
    setDescription('');
    setGeneratedRFQ(null);
    onOpenChange(false);
  };

  // Determine if this is from a signal page (anonymized flow)
  const isSignalPageFlow = Boolean(signalPageId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {isSignalPageFlow 
              ? `Get Quotes from Verified ${signalPageCategory || ''} Suppliers`
              : 'Post Your RFQ. Get Multiple Quotes.'}
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            {isSignalPageFlow 
              ? 'Your details stay private until you choose to connect.'
              : 'Connect with verified Indian suppliers in minutes. Free, fast, and secure.'}
          </p>
        </DialogHeader>

        {/* Signal Page Privacy Badge */}
        {isSignalPageFlow && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <Lock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Your identity is protected • Suppliers see only your requirement
            </span>
          </div>
        )}

        <div className="space-y-6 mt-4">
          {/* AI Generator Section */}
          <div className="border border-primary/20 rounded-lg p-6 bg-primary/5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 text-primary font-semibold">
                <Sparkles className="h-5 w-5" />
                AI-powered RFQ generator
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your needs — our AI will generate a complete RFQ.
              </p>
            </div>

            <Textarea
              placeholder="Describe your sourcing requirement in detail. Include product name, quantity, specifications, and delivery requirements for best results.

Example: I need 5000 kg of food-grade stainless steel containers for a dairy plant in Maharashtra. Looking for BIS certified products with 2mm thickness, 50L capacity each."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none mb-4"
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate My RFQ
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated RFQ Preview */}
          {generatedRFQ && (
            <div className="border border-green-500/30 rounded-lg p-6 bg-green-50/50 dark:bg-green-950/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  Generated RFQ Preview
                </div>
                <Badge variant="secondary">{tradeTypeLabels[generatedRFQ.trade_type]}</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{generatedRFQ.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{generatedRFQ.description}</p>
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
                        <th className="text-left p-2 font-medium">Item</th>
                        <th className="text-left p-2 font-medium">Specifications</th>
                        <th className="text-right p-2 font-medium">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedRFQ.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-medium">{item.item_name}</td>
                          <td className="p-2 text-muted-foreground">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity} {item.unit}</td>
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

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setGeneratedRFQ(null)}
                  >
                    Edit Description
                  </Button>
                  <Button 
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    onClick={handleProceed}
                  >
                    Get Quotes (Free)
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Trust Badges - Different for Signal Page */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground py-4 border-t">
            {isSignalPageFlow ? (
              <>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4 text-green-600" />
                  <span>Fully Managed by ProcureSaathi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Verified Fulfillment Partners</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>End-to-End Commercial Protection</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>20,000+ Verified SMEs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Trusted by Procurement Teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>AI-Assisted Sourcing</span>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
