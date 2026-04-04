/**
 * AI RFQ Preview — Shows parsed AI output before applying to form
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Eye, CheckCircle2, XCircle, Package } from 'lucide-react';

interface ParsedItem {
  product: string;
  quantity: string;
  unit: string;
  description?: string;
}

interface AiPreviewProps {
  items: ParsedItem[];
  category?: string;
  title?: string;
  description?: string;
  qualityStandards?: string;
  certifications?: string;
  paymentTerms?: string;
  onApply: () => void;
  onCancel: () => void;
}

export function AiRfqPreview({
  items, category, title, description, qualityStandards, certifications, paymentTerms,
  onApply, onCancel
}: AiPreviewProps) {
  return (
    <Card className="border-primary/30 bg-primary/5 animate-in fade-in-50 slide-in-from-top-2 duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          AI Preview — Review Before Applying
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
            {items.length} items detected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {title && (
          <div>
            <p className="text-xs text-muted-foreground">Title</p>
            <p className="text-sm font-semibold text-foreground">{title}</p>
          </div>
        )}

        {category && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Category:</p>
            <Badge variant="secondary" className="text-xs">{category}</Badge>
          </div>
        )}

        {/* Items table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_60px] gap-0 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
            <span>Product</span>
            <span>Qty</span>
            <span>Unit</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_60px] gap-0 px-3 py-2 border-b last:border-b-0 text-sm">
              <div>
                <p className="font-medium text-foreground">{item.product}</p>
                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
              </div>
              <span>{item.quantity}</span>
              <span className="text-muted-foreground">{item.unit}</span>
            </div>
          ))}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {qualityStandards && (
            <div className="p-2 rounded bg-background border">
              <p className="text-muted-foreground">Quality</p>
              <p className="font-medium">{qualityStandards}</p>
            </div>
          )}
          {certifications && (
            <div className="p-2 rounded bg-background border">
              <p className="text-muted-foreground">Certifications</p>
              <p className="font-medium">{certifications}</p>
            </div>
          )}
          {paymentTerms && (
            <div className="p-2 rounded bg-background border">
              <p className="text-muted-foreground">Payment</p>
              <p className="font-medium">{paymentTerms}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button onClick={onApply} className="flex-1 gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Apply to Form
          </Button>
          <Button variant="outline" onClick={onCancel} className="gap-1.5">
            <XCircle className="w-4 h-4" />
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
