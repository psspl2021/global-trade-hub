import { Gift, Users, ArrowRight, Coins, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ReferralPromoSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-12 bg-gradient-to-br from-primary/5 via-background to-warning/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-warning/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-3">
              <Gift className="h-4 w-4" />
              Referral Program
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Refer & <span className="text-primary">Earn Rewards</span>
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Share ProcureSaathi with your network and earn real income plus free bids
            </p>
          </div>

          {/* Rewards Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Earn Income Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                <Coins className="h-5 w-5 text-success" />
              </div>
              <h3 className="font-bold mb-1">Earn Cash Rewards</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Get paid when your referral completes their first transaction.
              </p>
              <div className="text-success font-semibold text-sm">₹ Instant Cash Rewards</div>
            </div>

            {/* Free Bid Card */}
            <div className="bg-card border border-border rounded-xl p-5 hover:border-warning/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                <Ticket className="h-5 w-5 text-warning" />
              </div>
              <h3 className="font-bold mb-1">Free Premium Bid</h3>
              <p className="text-muted-foreground text-sm mb-2">
                Earn 1 free bid credit for each successful signup.
              </p>
              <div className="text-warning font-semibold text-sm">1 Bid Per Referral</div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-card/50 border border-border rounded-xl p-5 mb-5">
            <h3 className="text-sm font-semibold mb-3 text-center">How It Works</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold text-sm">1</span>
                </div>
                <p className="text-xs text-muted-foreground">Tell your contacts about ProcureSaathi</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold text-sm">2</span>
                </div>
                <p className="text-xs text-muted-foreground">They sign up & mention your name as referrer</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold text-sm">3</span>
                </div>
                <p className="text-xs text-muted-foreground">Earn income + free bids when they transact</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button 
              className="h-10 px-6"
              onClick={() => navigate('/signup')}
            >
              <Users className="h-4 w-4 mr-2" />
              Join & Start Referring
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Already a member? <button onClick={() => navigate('/login')} className="text-primary hover:underline font-medium">Login to your dashboard</button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
