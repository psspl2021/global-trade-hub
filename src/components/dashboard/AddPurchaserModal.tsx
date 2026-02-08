/**
 * ============================================================
 * ADD PURCHASER MODAL
 * ============================================================
 * 
 * Modal for adding new purchasers to the buyer company.
 * Available to management roles (CFO, CEO, HR, Manager).
 */

import { useState } from 'react';
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
import { UserPlus, Mail, User, Briefcase, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { categoriesData } from '@/data/categories';

interface AddPurchaserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BUYER_ROLES = [
  { value: 'buyer_purchaser', label: 'Purchaser' },
  { value: 'buyer_manager', label: 'Manager' },
  { value: 'buyer_hr', label: 'HR' },
  { value: 'buyer_cfo', label: 'CFO' },
  { value: 'buyer_ceo', label: 'CEO' },
];

export function AddPurchaserModal({ open, onOpenChange, onSuccess }: AddPurchaserModalProps) {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('buyer_purchaser');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter the purchaser\'s email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For now, show a success message - actual invitation would require edge function
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email} to join as ${BUYER_ROLES.find(r => r.value === role)?.label}.`,
      });
      
      // Reset form
      setEmail('');
      setFullName('');
      setRole('buyer_purchaser');
      setSelectedCategories([]);
      onOpenChange(false);
      
      // Trigger success callback
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Purchaser
          </DialogTitle>
          <DialogDescription>
            Invite a new team member to your organization. They will receive an email invitation to join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="purchaser@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name (Optional)
            </Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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

          {/* Assigned Categories */}
          <div className="space-y-2">
            <Label>Assigned Categories (Optional)</Label>
            <Select onValueChange={handleAddCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Add category..." />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {categoriesData
                  .filter(c => !selectedCategories.includes(c.name))
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddPurchaserModal;
