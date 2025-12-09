import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Sparkles, Package, Truck, Star, Zap } from 'lucide-react';

export const EarlyAdopterBanner = () => {
  const navigate = useNavigate();
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['supplier', 'logistics_partner']);

      if (error) throw error;
      
      const remaining = Math.max(0, 100 - (count || 0));
      setRemainingSlots(remaining);
    } catch (error) {
      console.error('Error fetching early adopter count:', error);
      setRemainingSlots(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Subscribe to realtime updates for new signups
    const channel = supabase
      .channel('early-adopter-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_roles',
        },
        (payload) => {
          // Only update if new role is supplier or logistics_partner
          if (payload.new.role === 'supplier' || payload.new.role === 'logistics_partner') {
            fetchCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Don't show banner if all spots are filled
  if (!isLoading && remainingSlots === 0) {
    return null;
  }

  const filledSpots = remainingSlots !== null ? 100 - remainingSlots : 0;
  const progressPercentage = (filledSpots / 100) * 100;

  return (
    <section className="relative py-8 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-warning/20 via-primary/20 to-warning/20 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card/95 backdrop-blur-sm border-2 border-warning/50 rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Header with badge */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-warning/30 rounded-full blur-md animate-pulse" />
                  <div className="relative bg-gradient-to-br from-warning to-warning/80 p-3 rounded-full">
                    <Trophy className="h-8 w-8 text-warning-foreground" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-warning/20 text-warning text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                      Limited Offer
                    </span>
                    <Sparkles className="h-4 w-4 text-warning animate-pulse" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                    First 100 Partners Get <span className="text-warning">1 Year FREE</span> Premium!
                  </h2>
                </div>
              </div>
            </div>

            {/* Progress bar and counter */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">Early Adopter Spots Claimed</span>
                <span className="text-sm font-bold text-warning">
                  {isLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${filledSpots}/100 claimed`
                  )}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-warning to-warning/70 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              {remainingSlots !== null && remainingSlots > 0 && (
                <p className="text-center mt-2 text-lg font-semibold text-foreground">
                  🔥 Only <span className="text-warning text-xl">{remainingSlots}</span> spots remaining!
                </p>
              )}
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="flex items-center gap-2 bg-success/10 rounded-lg p-3">
                <Star className="h-5 w-5 text-success shrink-0" />
                <span className="text-sm font-medium text-foreground">1 Year FREE</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                <Zap className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">Unlimited Bids</span>
              </div>
              <div className="flex items-center gap-2 bg-warning/10 rounded-lg p-3">
                <Trophy className="h-5 w-5 text-warning shrink-0" />
                <span className="text-sm font-medium text-foreground">Early Adopter Badge</span>
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Priority Support</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="h-14 text-lg px-8 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/25"
                onClick={() => navigate('/signup?role=supplier')}
              >
                <Package className="h-5 w-5 mr-2" />
                Join as Supplier
              </Button>
              <Button 
                size="lg"
                className="h-14 text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                onClick={() => navigate('/signup?role=logistics_partner')}
              >
                <Truck className="h-5 w-5 mr-2" />
                Join as Logistics Partner
              </Button>
            </div>

            {/* Fine print */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Premium subscription worth ₹24,950 — completely FREE for early adopters. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
