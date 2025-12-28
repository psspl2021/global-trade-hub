import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Star, Check, Loader2, CreditCard, MessageCircle, Mail } from 'lucide-react';

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface PremiumPackPurchaseProps {
  userId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
  userType: 'supplier' | 'logistics_partner';
  hasPremiumBalance: boolean;
}

export function PremiumPackPurchase({ 
  userId, 
  userEmail, 
  userPhone, 
  userName, 
  userType,
  hasPremiumBalance 
}: PremiumPackPurchaseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const { toast } = useToast();

  const itemLabel = userType === 'logistics_partner' ? 'quotes' : 'bids';
  const itemLabelSingular = userType === 'logistics_partner' ? 'quote' : 'bid';

  // Load Cashfree SDK
  useEffect(() => {
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
        console.log('Cashfree SDK loaded for Premium Pack');
      };
      script.onerror = () => {
        console.error('Failed to load Cashfree SDK');
      };
      document.body.appendChild(script);
    };

    loadCashfreeSDK();

    // Check URL for payment status
    const urlParams = new URLSearchParams(window.location.search);
    const premiumPayment = urlParams.get('premium_payment');
    
    if (premiumPayment === 'success') {
      toast({
        title: "Premium Pack Activated! 🎉",
        description: `Your 50 premium ${itemLabel} have been credited to your account.`,
      });
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (premiumPayment === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, itemLabel]);

  const handlePurchase = async () => {
    if (!cashfreeLoaded) {
      toast({
        title: "Please wait",
        description: "Payment system is loading...",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('cashfree-create-premium-order', {
        body: {
          user_id: userId,
          customer_email: userEmail,
          customer_phone: userPhone,
          customer_name: userName,
          user_type: userType,
        },
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Failed to create order');
      }

      console.log('Premium order created:', data);

      // Initialize Cashfree checkout
      const cashfree = window.Cashfree({
        mode: 'production', // Use 'sandbox' for testing
      });

      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      });
    } catch (error: any) {
      console.error('Premium purchase error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (hasPremiumBalance) {
    // Already has premium balance - show buy more option
    // Calculate total with GST and transaction fee
    const basePrice = 300;
    const gstAmount = Math.round(basePrice * 0.18);
    const subtotalWithGst = basePrice + gstAmount;
    const transactionFee = Math.round(subtotalWithGst * 0.0195);
    const totalAmount = subtotalWithGst + transactionFee;
    
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-center mb-2">Buy More Premium {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}:</p>
        <Button
          onClick={handlePurchase}
          disabled={isLoading || !cashfreeLoaded}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Buy 50 More {itemLabel} - ₹{totalAmount.toLocaleString('en-IN')}
        </Button>
        <p className="text-xs text-center text-muted-foreground">(Incl. GST 18% + 1.95% fees)</p>
        <p className="text-xs text-center text-muted-foreground">Or contact us:</p>
        <div className="flex gap-2">
          <a 
            href={`https://wa.me/918368127357?text=Hi, I would like to purchase more premium ${itemLabel}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            WhatsApp
          </a>
          <a 
            href={`mailto:sales@procuresaathi.com?subject=Buy More Premium ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-primary text-primary hover:bg-primary/10 text-sm font-medium transition-colors"
          >
            <Mail className="h-3 w-3" />
            Email
          </a>
        </div>
      </div>
    );
  }

  // Calculate total with GST and transaction fee
  const basePrice = 300;
  const gstAmount = Math.round(basePrice * 0.18);
  const subtotalWithGst = basePrice + gstAmount;
  const transactionFee = Math.round(subtotalWithGst * 0.0195);
  const totalAmount = subtotalWithGst + transactionFee;

  // Show full premium pack purchase UI
  return (
    <div className="p-4 rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-5 w-5 text-amber-500" />
        <span className="font-bold text-foreground">Buy Premium Pack</span>
      </div>
      <div className="text-2xl font-bold text-primary mb-1">₹{basePrice.toLocaleString('en-IN')}</div>
      <p className="text-sm text-muted-foreground mb-1">50 lifetime {itemLabel} (₹499/{itemLabelSingular})</p>
      <p className="text-xs text-muted-foreground mb-3">
        + GST 18% (₹{gstAmount.toLocaleString('en-IN')}) + Platform fee 1.95% (₹{transactionFee.toLocaleString('en-IN')})
        <br />
        <span className="font-semibold">Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
      </p>
      <ul className="text-sm space-y-1 mb-4">
        <li className="flex items-center gap-2 text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" /> Never expires - use anytime
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" /> Priority listing in search
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <Check className="h-4 w-4 text-green-500" /> Dedicated support
        </li>
      </ul>
      
      <div className="space-y-2">
        <Button
          onClick={handlePurchase}
          disabled={isLoading || !cashfreeLoaded}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Processing...' : `Buy Now - ₹${totalAmount.toLocaleString('en-IN')}`}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground mt-3">Or contact to purchase:</p>
        <a 
          href={`https://wa.me/918368127357?text=Hi, I would like to purchase the ${userType === 'logistics_partner' ? 'Logistics ' : ''}Premium Pack (₹300 for 50 lifetime ${itemLabel}).`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp: +91 8368127357
        </a>
        <a 
          href={`mailto:sales@procuresaathi.com?subject=${userType === 'logistics_partner' ? 'Logistics ' : ''}Premium Pack Purchase Request&body=Hi, I would like to purchase the Premium Pack (₹300 for 50 lifetime ${itemLabel}).`}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary hover:bg-primary/10 font-medium transition-colors"
        >
          <Mail className="h-4 w-4" />
          sales@procuresaathi.com
        </a>
      </div>
    </div>
  );
}
