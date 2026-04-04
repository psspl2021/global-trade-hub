/**
 * Industry RFQ Templates Selector
 * Quick-start auction with pre-built category templates
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useRfqTemplates, RfqTemplate } from '@/hooks/useRfqTemplates';

interface RfqTemplateSelectorProps {
  category?: string;
  onApplyTemplate: (template: RfqTemplate) => void;
}

export function RfqTemplateSelector({ category, onApplyTemplate }: RfqTemplateSelectorProps) {
  const { templates, isLoading } = useRfqTemplates();
  const [expanded, setExpanded] = useState(false);

  const filtered = category 
    ? templates.filter(t => t.category === category)
    : templates;

  if (isLoading || filtered.length === 0) return null;

  const shown = expanded ? filtered : filtered.slice(0, 3);

  return (
    <Card className="border-violet-200/60 bg-violet-50/30 dark:bg-violet-950/10 dark:border-violet-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-600" />
          Industry Templates
          <Badge variant="outline" className="text-xs border-violet-300 text-violet-700">
            {filtered.length} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shown.map(template => (
          <div key={template.id} className="flex items-center justify-between p-2.5 rounded-md bg-background border text-sm hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{template.template_name}</p>
              <p className="text-xs text-muted-foreground">
                {template.default_items.length} items • {template.category}
                {template.quality_standards && ` • ${template.quality_standards}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              onClick={() => onApplyTemplate(template)}
            >
              <Zap className="w-3 h-3" />
              Use
            </Button>
          </div>
        ))}
        {filtered.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline flex items-center gap-1 w-full justify-center py-1"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show {filtered.length - 3} more</>}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
