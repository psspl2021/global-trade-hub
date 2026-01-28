/**
 * AI Monitoring Badge
 * 
 * Subtle AI status indicator for dashboard sections.
 */

import { Activity, Brain, Sparkles, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIMonitoringBadgeProps {
  variant: 'insight' | 'recommendation' | 'monitoring' | 'active';
  label?: string;
  className?: string;
}

export function AIMonitoringBadge({ variant, label, className = '' }: AIMonitoringBadgeProps) {
  switch (variant) {
    case 'insight':
      return (
        <Badge 
          variant="outline" 
          className={`text-xs font-normal gap-1 text-blue-600 border-blue-200 bg-blue-50/50 ${className}`}
        >
          <Brain className="h-3 w-3" />
          {label || 'AI Insight'}
        </Badge>
      );
    
    case 'recommendation':
      return (
        <Badge 
          variant="outline" 
          className={`text-xs font-normal gap-1 text-emerald-600 border-emerald-200 bg-emerald-50/50 ${className}`}
        >
          <Sparkles className="h-3 w-3" />
          {label || 'AI Recommendation'}
        </Badge>
      );
    
    case 'monitoring':
      return (
        <Badge 
          variant="outline" 
          className={`text-xs font-normal gap-1 text-muted-foreground ${className}`}
        >
          <Activity className="h-3 w-3" />
          {label || 'AI Monitoring'}
        </Badge>
      );
    
    case 'active':
      return (
        <Badge 
          variant="outline" 
          className={`text-xs font-normal gap-1 text-green-600 border-green-200 bg-green-50/50 ${className}`}
        >
          <Eye className="h-3 w-3" />
          {label || 'AI Active'}
        </Badge>
      );
    
    default:
      return null;
  }
}

export default AIMonitoringBadge;
