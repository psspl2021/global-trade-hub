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
import { UserPlus, Mail, User, Briefcase, X, Copy, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';
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
  { value: 'purchase_head', label: 'Head of Procurement' },
  { value: 'vp', label: 'VP' },
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
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== category));
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('buyer_purchaser');
    setSelectedCategories([]);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // Closing modal — clear sensitive temp password from memory
      setCreatedEmail(null);
      setTempPassword(null);
      setCopied(false);
      resetForm();
    }
    onOpenChange(next);
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast({ title: 'Password copied', description: 'Share it securely with the user.' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: 'Copy failed', description: 'Please copy manually.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter the user\'s email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim() || undefined,
          role,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.alreadyMember && !data?.tempPassword) {
        toast({
          title: 'Already a Member',
          description: `${email} is already part of your team.`,
        });
        resetForm();
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      if (data?.tempPassword) {
        // Show in-modal credentials card (one-time reveal)
        setCreatedEmail(email.trim().toLowerCase());
        setTempPassword(data.tempPassword);
        toast({
          title: 'User Created',
          description: 'Copy the temporary password — it will not be shown again.',
        });
        onSuccess?.();
        return;
      }

      // Existing user added without new password
      toast({
        title: 'Member Added',
        description: `${email} has been added to your team.`,
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Add team member error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add team member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {tempPassword ? 'User Created — Share Credentials' : 'Add Company User'}
          </DialogTitle>
          <DialogDescription>
            {tempPassword
              ? 'Account created successfully. Copy the temporary password below — it will NOT be shown again.'
              : 'Add a user to your company workspace. An account will be created instantly with a temporary password.'}
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                <p className="font-mono text-sm break-all">{createdEmail}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Temporary Password
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 rounded-md bg-background border font-mono text-sm break-all select-all">
                    {tempPassword}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant={copied ? 'secondary' : 'default'}
                    onClick={handleCopyPassword}
                  >
                    {copied ? (
                      <><CheckCircle2 className="h-4 w-4 mr-1" /> Copied</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">One-time reveal</p>
                <p className="text-muted-foreground text-xs">
                  This password is shown only once and is not stored. Share it securely (e.g. via your team's password manager or a private channel). The user can change it after first login.
                </p>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {tempPassword ? (
            <Button onClick={() => handleClose(false)} className="w-full sm:w-auto sm:ml-auto">
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} className="sm:mr-auto">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <UserPlus className="h-4 w-4 mr-1" />
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddPurchaserModal;
