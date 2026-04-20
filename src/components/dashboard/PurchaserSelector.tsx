/**
 * ============================================================
 * PURCHASER SELECTOR DROPDOWN ("View as" / Impersonation)
 * ============================================================
 *
 * Selecting a purchaser switches the *operational scope* of the
 * dashboard (RFQs, auctions, POs are filtered to that purchaser
 * via scoped RPCs). It does NOT change the logged-in identity
 * and does NOT expose any credentials.
 *
 * Visible to: All buyer roles
 * Editable by: Anyone in the company (scope is enforced server-side)
 */

import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Package, UserPlus, Eye } from 'lucide-react';
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

  const selectedPurchaser = useMemo(
    () => purchasers.find((p) => p.user_id === selectedPurchaserId),
    [purchasers, selectedPurchaserId]
  );

  if (purchasers.length === 0) return null;

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
        <label className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Acting Purchaser (View as)
        </label>
        <div className="flex items-center gap-2 min-w-0">
          <Select
            value={selectedPurchaserId || undefined}
            onValueChange={onSelect}
            disabled={disabled}
          >
            <SelectTrigger className="w-[280px] bg-background border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Select Acting Purchaser">
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
                  <div className="flex items-center gap-2 py-1 w-full">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
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

          {canAddPurchasers && (
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => setShowAddModal(true)}
              title="Add Company User"
              aria-label="Add Company User"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AddPurchaserModal open={showAddModal} onOpenChange={setShowAddModal} />
    </>
  );
}

export default PurchaserSelector;
