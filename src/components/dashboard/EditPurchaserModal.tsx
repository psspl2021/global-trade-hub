/**
 * ============================================================
 * EDIT PURCHASER MODAL
 * ============================================================
 *
 * Allows any company member to edit a purchaser's display name,
 * role, and assigned categories.
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, X, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { categoriesData } from '@/data/categories';
import { CompanyPurchaser } from '@/hooks/useBuyerCompanyContext';

interface EditPurchaserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaser: CompanyPurchaser | null;
  onSuccess?: () => void;
}

const BUYER_ROLES = [
  { value: 'buyer_purchaser', label: 'Purchaser' },
  { value: 'buyer_manager', label: 'Manager' },
  { value: 'purchase_head', label: 'Head of Procurement' },
  { value: 'vp', label: 'VP' },
  { value: 'buyer_hr', label: 'HR' },
  { value: 'buyer_cfo', label: 'CFO' },
  { value: 'buyer_ceo', label: 'CEO' },
];

export function EditPurchaserModal({
  open,
  onOpenChange,
  purchaser,
  onSuccess,
}: EditPurchaserModalProps) {
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('buyer_purchaser');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddCustomCategory = () => {
    const value = customCategory.trim();
    if (value && !selectedCategories.includes(value)) {
      setSelectedCategories([...selectedCategories, value]);
      setCustomCategory('');
    }
  };

  useEffect(() => {
    if (purchaser && open) {
      setDisplayName(purchaser.display_name || '');
      setRole(purchaser.role || 'buyer_purchaser');
      setSelectedCategories(purchaser.assigned_categories || []);
    }
  }, [purchaser, open]);

  const handleAddCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category));
  };

  const handleSave = async () => {
    if (!purchaser) return;

    setIsSaving(true);
    try {
      // Update profile display name
      if (displayName.trim() && displayName !== purchaser.display_name) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ contact_person: displayName.trim() })
          .eq('id', purchaser.user_id);
        if (profileErr) throw profileErr;
      }

      // Update membership role + categories
      const { error: memberErr } = await supabase
        .from('buyer_company_members')
        .update({
          role,
          assigned_categories: selectedCategories,
        })
        .eq('id', purchaser.member_id);
      if (memberErr) throw memberErr;

      toast({
        title: 'Updated',
        description: `${displayName || purchaser.display_name} has been updated.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Edit purchaser error:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Company User
          </DialogTitle>
          <DialogDescription>
            Update the user's name, role, and assigned procurement categories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="edit-name"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {BUYER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Assigned Categories / Products</Label>
            <p className="text-xs text-muted-foreground">
              Pick from the list, or type a specific product / sub-category (e.g. "OPC 53 Cement", "TMT Fe550").
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Type custom category or product..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCategory();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCustomCategory}
                disabled={!customCategory.trim()}
              >
                Add
              </Button>
            </div>
            <Select onValueChange={handleAddCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Add category..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {categoriesData
                  .filter((c) => !selectedCategories.includes(c.name))
                  .map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditPurchaserModal;
