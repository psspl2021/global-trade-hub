/**
 * ============================================================
 * MANAGEMENT VIEW SELECTOR DROPDOWN
 * ============================================================
 * 
 * Allows management roles to switch between analytics views.
 * When a management view is selected, the dashboard switches
 * to read-only analytics mode.
 * 
 * Visible to: buyer_cfo, buyer_ceo, buyer_hr, buyer_manager
 * Hidden from: buyer_purchaser, purchaser, buyer
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, TrendingUp, Users, Briefcase, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManagementViewType } from '@/hooks/useBuyerCompanyContext';

interface ManagementViewSelectorProps {
  selectedView: ManagementViewType;
  onSelect: (view: ManagementViewType) => void;
  className?: string;
}

const MANAGEMENT_VIEWS = [
  {
    value: 'cfo' as ManagementViewType,
    label: 'CFO View',
    description: 'Financial analytics, ROI & savings',
    icon: TrendingUp,
  },
  {
    value: 'ceo' as ManagementViewType,
    label: 'CEO View',
    description: 'Executive summary & KPIs',
    icon: Briefcase,
  },
  {
    value: 'hr' as ManagementViewType,
    label: 'HR / Management View',
    description: 'Team performance & incentives',
    icon: Users,
  },
  {
    value: 'manager' as ManagementViewType,
    label: 'Manager View',
    description: 'Operational oversight',
    icon: BarChart3,
  },
];

export function ManagementViewSelector({
  selectedView,
  onSelect,
  className = '',
}: ManagementViewSelectorProps) {
  const selectedOption = MANAGEMENT_VIEWS.find(v => v.value === selectedView);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Management View
      </label>
      <div className="flex items-center gap-2">
        <Select
          value={selectedView || 'none'}
          onValueChange={(value) => onSelect(value === 'none' ? null : value as ManagementViewType)}
        >
          <SelectTrigger className="w-full sm:w-[240px] bg-background border-border">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" />
              <SelectValue placeholder="Switch to Analytics">
                {selectedOption ? (
                  <span className="truncate">{selectedOption.label}</span>
                ) : (
                  <span className="text-muted-foreground">Execution Mode</span>
                )}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="none" className="cursor-pointer">
              <div className="flex items-center gap-2 py-1">
                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">Execution Mode</span>
                  <span className="text-xs text-muted-foreground">
                    Normal dashboard with actions
                  </span>
                </div>
              </div>
            </SelectItem>
            {MANAGEMENT_VIEWS.map((view) => {
              const Icon = view.icon;
              return (
                <SelectItem 
                  key={view.value} 
                  value={view.value}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 py-1">
                    <Icon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{view.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {view.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* Quick exit button when in management mode */}
        {selectedView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(null)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <X className="h-4 w-4 mr-1" />
            Exit
          </Button>
        )}
      </div>
    </div>
  );
}

export default ManagementViewSelector;
