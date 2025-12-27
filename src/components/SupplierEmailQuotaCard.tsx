import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Crown, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EmailQuotaStatus {
  daily_sent: number;
  monthly_sent: number;
  daily_limit: number;
  monthly_limit: number;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
}

export const SupplierEmailQuotaCard = () => {
  const [quotaStatus, setQuotaStatus] = useState<EmailQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchQuotaStatus();
  }, []);

  const fetchQuotaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_email_quota_status', { p_supplier_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        setQuotaStatus(data[0]);
      } else {
        // Default values for new users
        setQuotaStatus({
          daily_sent: 0,
          monthly_sent: 0,
          daily_limit: 2,
          monthly_limit: 2,
          is_subscribed: false,
          subscription_expires_at: null
        });
      }
    } catch (error) {
      console.error('Error fetching quota status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to upgrade');
        return;
      }

      // For now, show a message about upgrading
      // In production, this would integrate with a payment gateway
      toast.info(
        'To upgrade to Premium (₹300/month for 500 emails), please contact us at support@procuresaathi.com',
        { duration: 10000 }
      );
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Failed to process upgrade request');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quotaStatus) return null;

  const dailyProgress = quotaStatus.is_subscribed 
    ? (quotaStatus.monthly_sent / quotaStatus.monthly_limit) * 100
    : (quotaStatus.daily_sent / quotaStatus.daily_limit) * 100;

  const remainingEmails = quotaStatus.is_subscribed
    ? quotaStatus.monthly_limit - quotaStatus.monthly_sent
    : quotaStatus.daily_limit - quotaStatus.daily_sent;

  const isQuotaExhausted = remainingEmails <= 0;

  return (
    <Card className={isQuotaExhausted && !quotaStatus.is_subscribed ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Email Notifications</CardTitle>
          </div>
          {quotaStatus.is_subscribed ? (
            <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          ) : (
            <Badge variant="secondary">Free Plan</Badge>
          )}
        </div>
        <CardDescription>
          {quotaStatus.is_subscribed 
            ? 'You have access to 500 requirement notification emails per month'
            : 'You get 2 free requirement notification emails per day'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {quotaStatus.is_subscribed ? 'Monthly Usage' : 'Daily Usage'}
            </span>
            <span className="font-medium">
              {quotaStatus.is_subscribed 
                ? `${quotaStatus.monthly_sent} / ${quotaStatus.monthly_limit}`
                : `${quotaStatus.daily_sent} / ${quotaStatus.daily_limit}`
              }
            </span>
          </div>
          <Progress value={Math.min(dailyProgress, 100)} className="h-2" />
        </div>

        {/* Remaining Emails */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          isQuotaExhausted ? 'bg-destructive/10' : 'bg-muted/50'
        }`}>
          <span className="text-sm">Remaining Emails</span>
          <span className={`text-lg font-bold ${
            isQuotaExhausted ? 'text-destructive' : 'text-primary'
          }`}>
            {Math.max(0, remainingEmails)}
          </span>
        </div>

        {/* Warning or Subscription Info */}
        {isQuotaExhausted && !quotaStatus.is_subscribed && (
          <div className="flex items-start space-x-2 p-3 bg-destructive/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Daily Quota Exhausted</p>
              <p className="text-muted-foreground">
                Upgrade to Premium to receive up to 500 emails per month for just ₹300/month
              </p>
            </div>
          </div>
        )}

        {quotaStatus.is_subscribed && quotaStatus.subscription_expires_at && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subscription expires:</span>
            <span>{format(new Date(quotaStatus.subscription_expires_at), 'dd MMM yyyy')}</span>
          </div>
        )}

        {/* Upgrade Button for Free Users */}
        {!quotaStatus.is_subscribed && (
          <div className="pt-2">
            <Button 
              onClick={handleUpgrade} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              disabled={upgrading}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium - ₹300/month
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Get 500 requirement notification emails per month
            </p>
          </div>
        )}

        {/* Feature Comparison */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">Plan Features</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium">Free Plan</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  2 emails/day
                </li>
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Category-based matching
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-amber-600">Premium Plan</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-amber-500" />
                  500 emails/month
                </li>
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-amber-500" />
                  Priority notifications
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
