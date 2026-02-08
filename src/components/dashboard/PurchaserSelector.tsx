/**
 * ============================================================
 * PURCHASER SELECTOR DROPDOWN
 * ============================================================
 * 
 * Allows selection of a purchaser within the same buyer company.
 * Shows purchaser name and assigned categories.
 * 
 * Visible to: All buyer roles
 * Editable by: Management (can switch between purchasers)
 * Default: Current logged-in purchaser for buyer_purchaser role
 */

import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Package, UserPlus } from 'lucide-react';
import { CompanyPurchaser } from '@/hooks/useBuyerCompanyContext';
import { AddPurchaserModal } from './AddPurchaserModal';

interface PurchaserSelectorProps {
  purchasers: CompanyPurchaser[];
  selectedPurchaserId: string | null;
  onSelect: (purchaserId: string) => void;
  disabled?: boolean;
  className?: string;
  canAddPurchasers?: boolean;
}

export function PurchaserSelector({
  purchasers,
  selectedPurchaserId,
  onSelect,
  disabled = false,
  className = '',
  canAddPurchasers = true,
}: PurchaserSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  // Format purchaser display with category badges
  const formatPurchaserLabel = (purchaser: CompanyPurchaser) => {
    const categories = purchaser.assigned_categories || [];
    const categoryText = categories.length > 0 
      ? `(${categories.slice(0, 2).join(', ')}${categories.length > 2 ? '...' : ''})`
      : '';
    return `${purchaser.display_name} ${categoryText}`.trim();
  };

  // Selected purchaser for display
  const selectedPurchaser = useMemo(() => 
    purchasers.find(p => p.user_id === selectedPurchaserId),
    [purchasers, selectedPurchaserId]
  );

  if (purchasers.length === 0) {
    return null;
  }

  // Always show dropdown even for single purchaser (enterprise UX requirement)
  // This ensures visibility and consistent UI across all buyer configurations

  return (
    <>
      <div className={`flex flex-col gap-1 ${className}`}>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Select Purchaser
        </label>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPurchaserId || undefined}
            onValueChange={onSelect}
            disabled={disabled}
          >
            <SelectTrigger className="w-full sm:w-[240px] bg-background border-border">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Select Purchaser">
                  {selectedPurchaser && (
                    <span className="truncate">
                      {selectedPurchaser.display_name}
                      {selectedPurchaser.is_current_user && ' (You)'}
                    </span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {purchasers.map((purchaser) => (
                <SelectItem 
                  key={purchaser.user_id} 
                  value={purchaser.user_id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 py-1">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {purchaser.display_name}
                        {purchaser.is_current_user && (
                          <span className="text-primary ml-1">(You)</span>
                        )}
                      </span>
                      {purchaser.assigned_categories?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          {purchaser.assigned_categories.slice(0, 3).join(', ')}
                          {purchaser.assigned_categories.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Add Purchaser Button */}
          {canAddPurchasers && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => setShowAddModal(true)}
              title="Add Purchaser"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Add Purchaser Modal */}
      <AddPurchaserModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
}

export default PurchaserSelector;
