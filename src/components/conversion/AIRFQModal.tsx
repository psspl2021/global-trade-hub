/**
 * AI RFQ Modal — opens from sticky CTA
 * No login required until final submission.
 * Uses existing generate-rfq edge function.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, FileText, Shield, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackConversionEvent } from '@/lib/conversionTracker';

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

interface AIRFQModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIRFQModal({ open, onOpenChange }: AIRFQModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRFQ, setGeneratedRFQ] = useState<GeneratedRFQ | null>(null);

  const handleGenerate = useCallback(async () => {
    if (description.trim().length < 10) {
      toast.error('Please describe your requirement in more detail');
      return;
    }

    setIsGenerating(true);
    setGeneratedRFQ(null);
    trackConversionEvent('rfq_start', { source: 'ai_modal' });

    try {
      const { data, error } = await supabase.functions.invoke('generate-rfq', {
        body: { description: description.trim() }
      });

      if (error) throw new Error(error.message || 'Failed to generate RFQ');
      if (data?.error) throw new Error(data.error);

      if (data?.rfq) {
        setGeneratedRFQ(data.rfq);
        trackConversionEvent('rfq_generated', { 
          category: data.rfq.category,
          items_count: data.rfq.items?.length 
        });
        toast.success('RFQ generated! Review and submit.');
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (err: any) {
      console.error('RFQ generation error:', err);
      toast.error(err.message || 'Failed to generate RFQ. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [description]);

  const handleSubmit = useCallback(() => {
    if (!generatedRFQ) return;
    
    trackConversionEvent('rfq_submit', { 
      category: generatedRFQ.category,
      trade_type: generatedRFQ.trade_type 
    });

    sessionStorage.setItem('pendingRFQ', JSON.stringify(generatedRFQ));

    if (!user) {
      toast.info('Sign up to receive competitive quotes from verified suppliers');
      navigate('/signup?role=buyer&redirect=dashboard');
    } else {
      navigate('/dashboard');
      toast.success('RFQ submitted! Suppliers will be matched shortly.');
    }

    onOpenChange(false);
  }, [generatedRFQ, user, navigate, onOpenChange]);

  const handleReset = useCallback(() => {
    setGeneratedRFQ(null);
    setDescription('');
  }, []);

  const tradeTypeLabels: Record<string, string> = {
    import: 'Import',
    export: 'Export',
    domestic_india: 'Domestic India'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Post Requirement (AI Assisted)
          </DialogTitle>
          <DialogDescription>
            Describe what you need — AI will structure it into a professional RFQ. No login required.
          </DialogDescription>
        </DialogHeader>

        {!generatedRFQ ? (
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="Example: I need 500 MT of HR Coil IS 2062 Grade E250, delivery to Mumbai port within 30 days. Need mill TC and BIS certification."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] text-sm"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground">
              Include: product, quantity, quality specs, delivery location, timeline
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || description.trim().length < 10}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is structuring your RFQ...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate RFQ with AI
                </>
              )}
            </Button>

            {/* Trust signals */}
            <div className="flex items-center gap-4 justify-center text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Identity Protected</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Free to Post</span>
              <span className="flex items-center gap-1"><Package className="h-3 w-3" /> AI-Matched Suppliers</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Generated RFQ Preview */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{generatedRFQ.title}</h3>
                <Badge variant="secondary">{tradeTypeLabels[generatedRFQ.trade_type] || generatedRFQ.trade_type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{generatedRFQ.description}</p>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{generatedRFQ.category}</Badge>
                <Badge variant="outline" className="text-xs">{generatedRFQ.items?.length || 0} items</Badge>
              </div>

              {/* Items table */}
              {generatedRFQ.items && generatedRFQ.items.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Item</th>
                        <th className="text-right p-2 font-medium">Qty</th>
                        <th className="text-left p-2 font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedRFQ.items.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{item.item_name}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {generatedRFQ.quality_standards && (
                <p className="text-xs"><span className="font-medium">Quality:</span> {generatedRFQ.quality_standards}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Start Over
              </Button>
              <Button onClick={handleSubmit} className="flex-1 gap-2" size="lg">
                <ArrowRight className="h-4 w-4" />
                {user ? 'Submit RFQ' : 'Submit & Get Quotes'}
              </Button>
            </div>

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                You'll be asked to sign up to receive supplier quotes — it's free.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
