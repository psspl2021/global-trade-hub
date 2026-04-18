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
import { User, Package, UserPlus, KeyRound, Copy, Check } from 'lucide-react';
import { CompanyPurchaser } from '@/hooks/useBuyerCompanyContext';
import { AddPurchaserModal } from './AddPurchaserModal';
import { useToast } from '@/hooks/use-toast';

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
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyLogin = async (e: React.MouseEvent, p: CompanyPurchaser) => {
    e.stopPropagation();
    e.preventDefault();
    if (!p.temp_credentials) return;
    const text = `Email: ${p.temp_credentials.email}\nTemporary Password: ${p.temp_credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUserId(p.user_id);
      toast({
        title: 'Login copied',
        description: `Share these credentials with ${p.display_name}. They disappear after first sign-in.`,
      });
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy manually.',
        variant: 'destructive',
      });
    }
  };

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
          Select Acting Purchaser
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
                        {purchaser.temp_credentials && !purchaser.is_current_user && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            <KeyRound className="h-2.5 w-2.5 mr-0.5" />
                            Login pending
                          </Badge>
                        )}
                      </span>
                      {purchaser.assigned_categories?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="h-3 w-3" />
                          {purchaser.assigned_categories.slice(0, 3).join(', ')}
                          {purchaser.assigned_categories.length > 3 && '...'}
                        </div>
                      )}
                      {purchaser.temp_credentials && !purchaser.is_current_user && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono truncate">
                          <span className="truncate">{purchaser.temp_credentials.email}</span>
                        </div>
                      )}
                    </div>
                    {purchaser.temp_credentials && !purchaser.is_current_user && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs flex-shrink-0"
                        onClick={(e) => handleCopyLogin(e, purchaser)}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Copy login credentials"
                      >
                        {copiedUserId === purchaser.user_id ? (
                          <><Check className="h-3 w-3 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Copy login</>
                        )}
                      </Button>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Add Company User (purchasers, management, heads) */}
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
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
          1 RFQ → 1 Purchaser → 1 PO
        </p>
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
