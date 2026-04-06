import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

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
  delivery_location?: string;
}

interface AIRFQGeneratorProps {
  onRFQGenerated: (rfq: GeneratedRFQ) => void;
}

export function AIRFQGenerator({ onRFQGenerated }: AIRFQGeneratorProps) {
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

  const handleProceed = () => {
    if (generatedRFQ) {
      onRFQGenerated(generatedRFQ);
    }
  };

  const tradeTypeLabels = {
    import: 'Import',
    export: 'Export',
    domestic_india: 'Domestic India'
  };

  return (
    <div className="space-y-3">
      {/* Compact AI Input */}
      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="Describe your sourcing requirement in detail. E.g: I need 5000 kg of food-grade stainless steel containers for a dairy plant in Maharashtra..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Include product name, quantity, specs & delivery details
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || description.trim().length < 10}
              className="gap-1.5"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate RFQ
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated RFQ Preview — Compact */}
      {generatedRFQ && (
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <h4 className="font-semibold text-sm">{generatedRFQ.title}</h4>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {tradeTypeLabels[generatedRFQ.trade_type]}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">{generatedRFQ.description}</p>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px]">{generatedRFQ.category}</Badge>
              {generatedRFQ.quality_standards && (
                <Badge variant="outline" className="text-[10px]">{generatedRFQ.quality_standards}</Badge>
              )}
            </div>

            {/* Items table — compact */}
            <div className="border rounded-md overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-1.5 font-medium">Item</th>
                    <th className="text-left p-1.5 font-medium hidden sm:table-cell">Specs</th>
                    <th className="text-right p-1.5 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedRFQ.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-1.5 font-medium">{item.item_name}</td>
                      <td className="p-1.5 text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">{item.description}</td>
                      <td className="p-1.5 text-right whitespace-nowrap">{item.quantity} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setGeneratedRFQ(null)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1 text-xs"
                onClick={handleProceed}
              >
                Proceed to Post
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
