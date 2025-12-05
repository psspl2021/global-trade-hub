import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Copy, Download, Shield, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TOTPSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TOTPSetup({ onComplete, onCancel }: TOTPSetupProps) {
  const [step, setStep] = useState<"generate" | "verify" | "backup">("generate");
  const [secret, setSecret] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const generateSecret = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-totp-secret", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      setSecret(data.secret);
      setOtpauthUri(data.otpauthUri);
      
      // Generate QR code URL using Google Charts API (no external lib needed)
      const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(data.otpauthUri)}`;
      setQrCodeUrl(qrUrl);
      
      setStep("verify");
    } catch (error: any) {
      console.error("Error generating secret:", error);
      toast.error(error.message || "Failed to generate secret");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 8) {
      toast.error("Please enter a valid 8-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in first");
        return;
      }

      // First verify the code
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-totp", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { code: verificationCode, secret },
      });

      if (verifyError) throw verifyError;

      if (!verifyData.valid) {
        toast.error("Invalid code. Please try again.");
        setVerificationCode("");
        return;
      }

      // Code is valid, enable TOTP
      const { data: enableData, error: enableError } = await supabase.functions.invoke("enable-totp", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { secret },
      });

      if (enableError) throw enableError;

      setBackupCodes(enableData.backupCodes);
      setStep("backup");
      toast.success("TOTP verification successful!");
    } catch (error: any) {
      console.error("Error verifying TOTP:", error);
      toast.error(error.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const content = `ProcureSaathi TOTP Backup Codes\n${"=".repeat(35)}\n\nSave these codes in a safe place.\nEach code can only be used once.\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "procuresaathi-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Set Up Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          {step === "generate" && "Add an extra layer of security to your account"}
          {step === "verify" && "Scan the QR code with your authenticator app"}
          {step === "backup" && "Save your backup codes"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "generate" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use an authenticator app like Google Authenticator, Microsoft Authenticator, or Authy to generate 8-digit codes.
            </p>
            <div className="flex gap-2">
              <Button onClick={generateSecret} disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Secret Key
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="TOTP QR Code" className="rounded-lg border" />
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Can't scan? Enter this secret manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs break-all">{secret}</code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Enter the 8-digit code from your app:</p>
              <div className="flex justify-center">
                <InputOTP maxLength={8} value={verificationCode} onChange={setVerificationCode}>
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
            </div>

            <div className="flex gap-2">
              <Button onClick={verifyAndEnable} disabled={loading || verificationCode.length !== 8} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Enable
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is now enabled!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Save these backup codes:</p>
              <p className="text-xs text-muted-foreground">
                Each code can only be used once. Store them safely.
              </p>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono">{code}</code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <Button onClick={onComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
