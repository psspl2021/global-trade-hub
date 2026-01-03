import { Gift, Users, ArrowRight, Coins, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ReferralPromoSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 via-background to-warning/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-warning/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Gift className="h-4 w-4" />
              Referral Program
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Refer & <span className="text-primary">Earn Rewards</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Share ProcureSaathi with your network and earn real income plus free bids for every successful referral
            </p>
          </div>

          {/* Rewards Cards */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {/* Earn Income Card */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:border-primary/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coins className="h-7 w-7 text-success" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Earn Cash Rewards</h3>
              <p className="text-muted-foreground mb-4">
                Get paid when your referral signs up with your name and completes their first transaction. More referrals = more earnings!
              </p>
              <div className="flex items-center gap-2 text-success font-semibold">
                <span className="text-lg">₹ Instant Cash Rewards</span>
              </div>
            </div>

            {/* Free Bid Card */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:border-warning/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket className="h-7 w-7 text-warning" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Free Premium Bid</h3>
              <p className="text-muted-foreground mb-4">
                Earn 1 free bid credit for each successful signup. Use it to bid on high-value procurement requirements!
              </p>
              <div className="flex items-center gap-2 text-warning font-semibold">
                <span className="text-lg">1 Bid Per Referral</span>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-card/50 border border-border rounded-2xl p-6 sm:p-8 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <p className="text-sm text-muted-foreground">Tell your contacts about ProcureSaathi</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <p className="text-sm text-muted-foreground">They sign up & mention your name as referrer</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <p className="text-sm text-muted-foreground">Earn ₹44 × dispatch qty commission + free bids</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              size="lg" 
              className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg"
              onClick={() => navigate('/signup')}
            >
              <Users className="h-5 w-5 mr-2" />
              Join & Start Referring
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Already a member? <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">Login to your dashboard</button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
