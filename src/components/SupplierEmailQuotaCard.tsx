import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mail, Crown, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmailQuotaStatus {
  daily_sent: number;
  monthly_sent: number;
  daily_limit: number;
  monthly_limit: number;
  is_subscribed: boolean;
  subscription_expires_at: string | null;
}

// Declare Cashfree type for the SDK
declare global {
  interface Window {
    Cashfree: any;
  }
}

export const SupplierEmailQuotaCard = () => {
  const [quotaStatus, setQuotaStatus] = useState<EmailQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchQuotaStatus();
    loadCashfreeSDK();
    
    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your premium subscription is now active.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchQuotaStatus();
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadCashfreeSDK = () => {
    if (window.Cashfree) {
      setCashfreeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      setCashfreeLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Cashfree SDK');
    };
    document.body.appendChild(script);
  };

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

      // Get user profile for customer details
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, phone, contact_person')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast.error('Please complete your profile first');
        return;
      }

      // Create Cashfree order
      const { data, error } = await supabase.functions.invoke('cashfree-create-order', {
        body: {
          supplier_id: user.id,
          customer_email: profile.email || user.email,
          customer_phone: profile.phone || '9999999999',
          customer_name: profile.contact_person || 'Customer',
        },
      });

      if (error) {
        console.error('Error creating order:', error);
        toast.error('Failed to create payment order. Please try again.');
        return;
      }

      if (!data?.success || !data?.payment_session_id) {
        console.error('Invalid order response:', data);
        toast.error(data?.error || 'Failed to create payment order');
        return;
      }

      // Initialize Cashfree checkout
      if (!window.Cashfree) {
        toast.error('Payment system is loading. Please try again in a moment.');
        return;
      }

      const cashfree = window.Cashfree({
        mode: 'production', // Change to 'sandbox' for testing
      });

      cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quotaStatus) return null;

  const remainingEmails = quotaStatus.is_subscribed
    ? quotaStatus.monthly_limit - quotaStatus.monthly_sent
    : quotaStatus.daily_limit - quotaStatus.daily_sent;

  const dailyProgress = quotaStatus.is_subscribed 
    ? (quotaStatus.monthly_sent / quotaStatus.monthly_limit) * 100
    : (quotaStatus.daily_sent / quotaStatus.daily_limit) * 100;

  const isQuotaExhausted = remainingEmails <= 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {quotaStatus.is_subscribed 
              ? `${remainingEmails} emails remaining this month`
              : `${remainingEmails} free emails remaining today`
            }
          </p>
          <Button variant="outline" className="w-full" onClick={() => setShowDetails(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-primary" />
                <DialogTitle>Email Notifications</DialogTitle>
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
            <DialogDescription>
              {quotaStatus.is_subscribed 
                ? 'You have access to 500 requirement notification emails per month'
                : 'You get 2 free requirement notification emails per day'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                  disabled={upgrading || !cashfreeLoaded}
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium - ₹300/month
                    </>
                  )}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
