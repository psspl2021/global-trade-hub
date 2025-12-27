import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Mail, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailNotificationConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  role: 'supplier' | 'logistics_partner';
}

export const EmailNotificationConsent = ({
  checked,
  onChange,
  error,
  role
}: EmailNotificationConsentProps) => {
  const description = role === 'supplier'
    ? "I agree to receive email notifications when new buyer requirements matching my selected categories are posted. (Free: 2 emails/day, Premium: 500 emails/month for ₹300/month)"
    : "I agree to receive email notifications for new logistics and shipment requirements matching my service routes.";

  return (
    <div className={cn(
      "p-4 border rounded-lg space-y-2 transition-colors",
      checked ? "border-primary bg-primary/5" : "border-border",
      error && "border-destructive"
    )}>
      <div className="flex items-start space-x-3">
        <Checkbox
          id="email-notification-consent"
          checked={checked}
          onCheckedChange={(checked) => onChange(!!checked)}
          className="mt-0.5"
        />
        <div className="space-y-1 flex-1">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-primary" />
            <Label 
              htmlFor="email-notification-consent" 
              className="text-sm font-medium cursor-pointer"
            >
              Receive Email Notifications for New Requirements *
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive ml-6">{error}</p>
      )}
      
      {role === 'supplier' && (
        <div className="mt-3 ml-6 p-2 bg-muted/50 rounded text-xs space-y-1">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Bell className="h-3 w-3" />
            <span>Free Plan: 2 email notifications per day</span>
          </div>
          <div className="flex items-center space-x-2 text-primary">
            <Bell className="h-3 w-3" />
            <span>Premium Plan: 500 emails/month for ₹300/month</span>
          </div>
        </div>
      )}
    </div>
  );
};
