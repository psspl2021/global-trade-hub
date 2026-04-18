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
import { UserPlus, Mail, User, Briefcase, X, Copy, KeyRound, Check } from 'lucide-react';
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
  const [isCreating, setIsCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
      // Fetch inviter context + company ID
      const { data: { user } } = await supabase.auth.getUser();
      let inviterName = '';
      let companyName = '';
      let companyId = '';

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('contact_person, company_name')
          .eq('id', user.id)
          .single();
        inviterName = profile?.contact_person || user.email || '';
        companyName = profile?.company_name || '';

        const { data: membership } = await supabase
          .from('buyer_company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();
        companyId = membership?.company_id || '';
      }

      const { data, error } = await supabase.functions.invoke('send-team-invite', {
        body: {
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          role,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          inviterName,
          companyName,
          companyId,
        },
      });

      if (error) throw error;

      // Smart toast based on response
      if (data?.alreadyMember) {
        toast({
          title: 'Already a Member',
          description: `${email} is already part of your team.`,
        });
      } else if (data?.autoAdded) {
        toast({
          title: 'Member Added',
          description: `${email} has been added to your team and notified. No signup needed.`,
        });
      } else {
        toast({
          title: 'Invitation Sent',
          description: `A signup invitation has been sent to ${email}.`,
        });
      }
      
      // Reset form
      setEmail('');
      setFullName('');
      setRole('buyer_purchaser');
      setSelectedCategories([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Invitation error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('buyer_purchaser');
    setSelectedCategories([]);
  };

  const handleCreateAccount = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter the team member\'s email address.',
        variant: 'destructive',
      });
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: {
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          role,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.tempPassword) {
        // Show credentials dialog
        setCreatedCreds({ email: email.trim(), password: data.tempPassword });
        resetForm();
        onSuccess?.();
      } else {
        // Existing user — just added to company
        toast({
          title: data?.alreadyMember ? 'Already a Member' : 'Member Added',
          description: data?.alreadyMember
            ? `${email} was already part of your team.`
            : `${email} has been added to your team. They can sign in with their existing password.`,
        });
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Create account error:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdCreds) return;
    const text = `Email: ${createdCreds.email}\nTemporary Password: ${createdCreds.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Invite a teammate — purchaser, category head, manager, CFO or CEO. They'll get an email invitation to join your company workspace.
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:mr-auto">
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleCreateAccount}
            disabled={isCreating || isSubmitting}
          >
            <KeyRound className="h-4 w-4 mr-1" />
            {isCreating ? 'Creating...' : 'Add Account'}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isCreating}>
            <Mail className="h-4 w-4 mr-1" />
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Credentials display dialog */}
      <Dialog open={!!createdCreds} onOpenChange={(o) => !o && setCreatedCreds(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Account Created
            </DialogTitle>
            <DialogDescription>
              Share these credentials securely with the team member. The password is shown only once — copy it now.
            </DialogDescription>
          </DialogHeader>
          {createdCreds && (
            <div className="space-y-3 py-2">
              <div className="rounded-md border bg-muted/40 p-3 space-y-2 font-mono text-sm">
                <div>
                  <div className="text-xs text-muted-foreground font-sans">Email</div>
                  <div className="break-all">{createdCreds.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-sans">Temporary Password</div>
                  <div className="break-all">{createdCreds.password}</div>
                </div>
              </div>
              <Button onClick={copyCredentials} variant="outline" className="w-full">
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setCreatedCreds(null); onOpenChange(false); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export default AddPurchaserModal;
