/**
 * ============================================================
 * SECURITY SETTINGS MODAL
 * ============================================================
 * Allows management-view users to:
 *  - Change their role PIN (4-6 digits) — requires password re-auth
 *  - Change their account password
 */

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoleSecurity } from '@/hooks/useRoleSecurity';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ManagementViewType } from '@/hooks/useBuyerCompanyContext';

const ROLE_OPTIONS: { value: Exclude<ManagementViewType, null>; label: string }[] = [
  { value: 'cfo', label: 'CFO View' },
  { value: 'ceo', label: 'CEO View' },
  { value: 'vp', label: 'VP View' },
  { value: 'purchase_head', label: 'Head of Procurement View' },
  { value: 'hr', label: 'HR / Management View' },
  { value: 'manager', label: 'Manager View' },
];

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: ManagementViewType;
  roleLabel?: string;
}

export function SecuritySettingsModal({
  isOpen, onClose, role, roleLabel,
}: SecuritySettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { verifyWithPassword, setPinForRole } = useRoleSecurity();

  // Allow choosing role inside modal when none was passed
  const [chosenRole, setChosenRole] = useState<ManagementViewType>(role);
  const activeRole = role ?? chosenRole;
  const activeLabel = roleLabel || ROLE_OPTIONS.find(r => r.value === activeRole)?.label;

  // PIN tab state
  const [pinPassword, setPinPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const reset = () => {
    setPinPassword(''); setNewPin(''); setConfirmPin('');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setChosenRole(role);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleChangePin = async () => {
    if (!activeRole) {
      toast({ title: 'Select a management view first', variant: 'destructive' });
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      toast({ title: 'PIN must be 4–6 digits', variant: 'destructive' });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: 'PINs do not match', variant: 'destructive' });
      return;
    }
    if (!pinPassword) {
      toast({ title: 'Enter your account password to confirm', variant: 'destructive' });
      return;
    }

    setPinSubmitting(true);
    try {
      const verify = await verifyWithPassword(activeRole, pinPassword);
      if (!verify.success) {
        toast({ title: 'Password incorrect', description: verify.error, variant: 'destructive' });
        return;
      }
      const res = await setPinForRole(activeRole, newPin);
      if (!res.success) {
        toast({ title: 'Failed to update PIN', description: res.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'PIN updated', description: `New PIN set for ${activeLabel || activeRole} view.` });
      handleClose();
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setPwSubmitting(true);
    try {
      // Re-authenticate
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPassword,
      });
      if (signInError) {
        toast({ title: 'Current password is incorrect', variant: 'destructive' });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        toast({ title: 'Failed to update password', description: updateError.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated successfully' });
      handleClose();
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security Settings
          </DialogTitle>
          <DialogDescription>
            Update your management-view PIN or account password.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pin"><KeyRound className="h-3.5 w-3.5 mr-1.5" /> Change PIN</TabsTrigger>
            <TabsTrigger value="password"><Lock className="h-3.5 w-3.5 mr-1.5" /> Change Password</TabsTrigger>
          </TabsList>

          {/* CHANGE PIN */}
          <TabsContent value="pin" className="space-y-3 pt-3">
            {!role ? (
              <p className="text-sm text-muted-foreground">
                Select a Management View first to change its PIN.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Updating PIN for <span className="font-semibold text-foreground">{roleLabel || role}</span> view.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="pin-pw">Account password</Label>
                  <Input id="pin-pw" type="password" value={pinPassword}
                    onChange={(e) => setPinPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pin">New PIN (4–6 digits)</Label>
                  <Input id="new-pin" type="password" inputMode="numeric" maxLength={6}
                    value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pin">Confirm new PIN</Label>
                  <Input id="confirm-pin" type="password" inputMode="numeric" maxLength={6}
                    value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••" />
                </div>
                <Button onClick={handleChangePin} disabled={pinSubmitting} className="w-full">
                  {pinSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update PIN
                </Button>
              </>
            )}
          </TabsContent>

          {/* CHANGE PASSWORD */}
          <TabsContent value="password" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">New password (min 8 chars)</Label>
              <Input id="new-pw" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input id="confirm-pw" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleChangePassword} disabled={pwSubmitting} className="w-full">
              {pwSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default SecuritySettingsModal;
