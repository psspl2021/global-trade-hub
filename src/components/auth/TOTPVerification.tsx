import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TOTPVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TOTPVerification({ onSuccess, onCancel }: TOTPVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBackupCode, setIsBackupCode] = useState(false);

  const verifyCode = async () => {
    if (code.length !== 8) {
      toast.error("Please enter a valid 8-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        onCancel();
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-totp", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { code, isBackupCode },
      });

      if (error) throw error;

      if (data.valid) {
        if (data.isBackupCode) {
          toast.success("Backup code accepted");
        } else {
          toast.success("Verification successful");
        }
        onSuccess();
      } else {
        toast.error(data.error || "Invalid code. Please try again.");
        setCode("");
      }
    } catch (error: any) {
      console.error("Error verifying TOTP:", error);
      if (error.message?.includes("Too many attempts")) {
        toast.error("Too many attempts. Please wait a minute.");
      } else {
        toast.error(error.message || "Verification failed");
      }
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 8-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <InputOTP maxLength={8} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
              <InputOTPSlot index={6} />
              <InputOTPSlot index={7} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <Switch
            id="backup-mode"
            checked={isBackupCode}
            onCheckedChange={setIsBackupCode}
          />
          <Label htmlFor="backup-mode" className="flex items-center gap-2 cursor-pointer">
            <KeyRound className="h-4 w-4" />
            Use backup code
          </Label>
        </div>

        <div className="space-y-2">
          <Button
            onClick={verifyCode}
            disabled={loading || code.length !== 8}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        </div>

        {isBackupCode && (
          <p className="text-xs text-muted-foreground text-center">
            Backup codes are single-use. Once used, it cannot be used again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
