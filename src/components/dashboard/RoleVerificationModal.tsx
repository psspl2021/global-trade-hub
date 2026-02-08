/**
 * ============================================================
 * ROLE VERIFICATION MODAL
 * ============================================================
 * 
 * Security modal for verifying access to management roles.
 * Supports PIN verification (preferred) or password re-auth.
 * 
 * Never stores PINs in localStorage.
 * All verification state is in-memory only.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Key, ShieldCheck, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRoleSecurity } from '@/hooks/useRoleSecurity';
import type { ManagementViewType } from '@/hooks/useBuyerCompanyContext';

interface RoleVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: ManagementViewType;
  onVerified: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  cfo: 'CFO View',
  ceo: 'CEO View',
  hr: 'HR / Management View',
  manager: 'Manager View',
};

export function RoleVerificationModal({
  isOpen,
  onClose,
  targetRole,
  onVerified,
}: RoleVerificationModalProps) {
  const {
    hasPinConfigured,
    verifyWithPin,
    verifyWithPassword,
    setPinForRole,
    isVerifying,
  } = useRoleSecurity();

  const [mode, setMode] = useState<'verify' | 'setup'>('verify');
  const [authMethod, setAuthMethod] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPinSetup, setHasPinSetup] = useState<boolean | null>(null);

  // Check if PIN is configured when modal opens
  useEffect(() => {
    if (isOpen && targetRole) {
      hasPinConfigured(targetRole).then((hasPin) => {
        setHasPinSetup(hasPin);
        if (!hasPin) {
          setMode('setup');
        } else {
          setMode('verify');
        }
      });
    }
  }, [isOpen, targetRole, hasPinConfigured]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setPassword('');
      setNewPin('');
      setConfirmPin('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleVerifyWithPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setError(null);
    const result = await verifyWithPin(targetRole, pin);
    
    if (result.success) {
      onVerified();
      onClose();
    } else {
      setError(result.error || 'Invalid PIN');
    }
  };

  const handleVerifyWithPassword = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setError(null);
    const result = await verifyWithPassword(targetRole, password);
    
    if (result.success) {
      onVerified();
      onClose();
    } else {
      setError(result.error || 'Invalid password');
    }
  };

  const handleSetupPin = async () => {
    if (newPin.length < 4 || newPin.length > 8) {
      setError('PIN must be 4-8 digits');
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError('PIN must contain only digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setError(null);
    const result = await setPinForRole(targetRole, newPin);
    
    if (result.success) {
      // Now verify with the new PIN
      const verifyResult = await verifyWithPin(targetRole, newPin);
      if (verifyResult.success) {
        onVerified();
        onClose();
      } else {
        setError('PIN set, but verification failed. Please try again.');
      }
    } else {
      setError(result.error || 'Failed to set PIN');
    }
  };

  const roleLabel = targetRole ? ROLE_LABELS[targetRole] || targetRole : 'Management View';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">
              Security Verification Required
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Access to <span className="font-semibold text-foreground">{roleLabel}</span> requires 
            verification. This protects sensitive analytics and governance data.
          </DialogDescription>
        </DialogHeader>

        {mode === 'setup' ? (
          // PIN Setup Mode
          <div className="space-y-4 pt-2">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <Key className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Set up a 4-8 digit PIN for quick access to {roleLabel}. 
                This PIN is required each session.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-pin">Create PIN (4-8 digits)</Label>
                <Input
                  id="new-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Enter PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSetupPin}
                disabled={isVerifying || !newPin || !confirmPin}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Set PIN & Continue
                  </>
                )}
              </Button>
            </div>

            {/* Option to use password instead */}
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setMode('verify');
                  setAuthMethod('password');
                }}
              >
                Use password instead (one-time)
              </Button>
            </div>
          </div>
        ) : (
          // Verification Mode
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'pin' | 'password')} className="pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin" disabled={!hasPinSetup}>
                <Key className="h-4 w-4 mr-2" />
                PIN
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="verify-pin">Enter your {roleLabel} PIN</Label>
                <Input
                  id="verify-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleVerifyWithPin}
                  disabled={isVerifying || pin.length < 4}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="password" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="verify-password">Enter your account password</Label>
                <div className="relative">
                  <Input
                    id="verify-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleVerifyWithPassword}
                  disabled={isVerifying || !password}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Verify & Continue
                    </>
                  )}
                </Button>
              </div>

              {!hasPinSetup && (
                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setMode('setup')}
                  >
                    Set up a PIN for faster access
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Verification expires after 15 minutes or on logout.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default RoleVerificationModal;
