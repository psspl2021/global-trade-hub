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
import { User, UserPlus, Eye, Pencil } from 'lucide-react';
import { CompanyPurchaser } from '@/hooks/useBuyerCompanyContext';
import { AddPurchaserModal } from './AddPurchaserModal';
import { EditPurchaserModal } from './EditPurchaserModal';

// Sentinel value used by the Select component to represent
// "no specific purchaser selected" (i.e. company-wide view).
// shadcn's Select can't accept "" as a value, so we use a marker.
const ALL_PURCHASERS_VALUE = '__ALL_PURCHASERS__';

interface PurchaserSelectorProps {
  purchasers: CompanyPurchaser[];
  selectedPurchaserId: string | null;
  /** Receives a real user_id, or `null` when "All Purchasers" is chosen. */
  onSelect: (purchaserId: string | null) => void;
  disabled?: boolean;
  className?: string;
  /** Show the "All Purchasers (Company-wide)" option. Only true for management users. */
  showAllOption?: boolean;
  canAddPurchasers?: boolean;
}

export function PurchaserSelector({
  purchasers,
  selectedPurchaserId,
  onSelect,
  disabled = false,
  className = '',
  canAddPurchasers = true,
  showAllOption = false,
}: PurchaserSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPurchaser, setEditingPurchaser] = useState<CompanyPurchaser | null>(null);

  const handleValueChange = (value: string) => {
    if (value === ALL_PURCHASERS_VALUE) {
      onSelect(null);
    } else {
      onSelect(value);
    }
  };

  const formatNameWithCategories = (p: CompanyPurchaser) => {
    const cats = p.assigned_categories || [];
    if (cats.length === 0) return p.display_name;
    const shown = cats.slice(0, 2).join(', ');
    const suffix = cats.length > 2 ? `, +${cats.length - 2}` : '';
    return `${p.display_name} (${shown}${suffix})`;
  };

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
            value={selectedPurchaserId || (showAllOption ? ALL_PURCHASERS_VALUE : undefined)}
            onValueChange={handleValueChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[280px] bg-background border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="h-4 w-4 text-primary" />
                <SelectValue placeholder="Select Acting Purchaser">
                  {selectedPurchaser ? (
                    <span className="truncate flex items-center gap-1">
                      <span className="truncate">
                        {formatNameWithCategories(selectedPurchaser)}
                        {selectedPurchaser.is_current_user && ' (You)'}
                      </span>
                      {selectedPurchaser.email && (
                        <span className="text-xs text-muted-foreground truncate">
                          · {selectedPurchaser.email}
                        </span>
                      )}
                    </span>
                  ) : showAllOption && selectedPurchaserId === null ? (
                    <span className="truncate font-medium">All Purchasers (Company-wide)</span>
                  ) : null}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {showAllOption && (
                <SelectItem
                  value={ALL_PURCHASERS_VALUE}
                  className="cursor-pointer pr-10 border-b border-border/50 mb-1"
                >
                  <div className="flex items-center gap-2 py-1">
                    <Eye className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold">All Purchasers</span>
                      <span className="text-[11px] text-muted-foreground">Company-wide view</span>
                    </div>
                  </div>
                </SelectItem>
              )}
              {purchasers.map((purchaser) => (
                <SelectItem
                  key={purchaser.user_id}
                  value={purchaser.user_id}
                  className="cursor-pointer pr-10"
                >
                  <div className="flex items-center gap-2 py-1 w-full">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate leading-tight">
                        {formatNameWithCategories(purchaser)}
                        {purchaser.is_current_user && (
                          <span className="text-primary ml-1">(You)</span>
                        )}
                      </span>
                      {purchaser.email && (
                        <span className="text-[11px] text-muted-foreground truncate leading-tight">
                          {purchaser.email}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingPurchaser(purchaser);
                      }}
                      className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="Edit user"
                      aria-label="Edit user"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
      <EditPurchaserModal
        open={!!editingPurchaser}
        onOpenChange={(o) => !o && setEditingPurchaser(null)}
        purchaser={editingPurchaser}
        onSuccess={() => {
          setEditingPurchaser(null);
          // Trigger context refetch via custom event
          window.dispatchEvent(new Event('ps-purchaser-change'));
        }}
      />
    </>
  );
}

export default PurchaserSelector;
