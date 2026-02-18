import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, LogOut, Settings, AlertTriangle, Home } from 'lucide-react';
import { ReferralSection } from '@/components/ReferralSection';
import { ProfileSettings } from '@/components/ProfileSettings';
import { ReferrerKYCUpload } from '@/components/affiliate/ReferrerKYCUpload';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

const AffiliatePortal = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useSEO({
    title: 'Affiliate Dashboard | Track Referral Earnings | ProcureSaathi',
    description: 'Track your referral earnings, 0.1% commissions, and payouts on ProcureSaathi affiliate portal.',
    canonical: 'https://procuresaathi.com/affiliate'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/affiliate');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Redirect non-affiliates to their dashboard
    if (!roleLoading && role && role !== 'affiliate') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== 'affiliate') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-14 sm:h-20 w-auto object-contain cursor-pointer"
              width={80}
              height={80}
              loading="eager"
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden" onClick={() => navigate('/')}>
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setShowProfileSettings(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden" onClick={async () => {
              await signOut();
              navigate('/');
            }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">
            Affiliate Portal
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {user?.user_metadata?.company_name || user?.user_metadata?.contact_person || 'Welcome'} • Track your referral earnings
          </p>
        </div>

        {/* Important Terms Alert */}
        <Alert className="mb-6 border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning font-semibold">Important Terms</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Affiliate commission is <span className="font-semibold text-foreground">not applicable</span> on your own orders, family members' orders, or orders from related businesses (same GSTIN, phone, bank account). Self-referrals will result in permanent forfeiture of all commissions and possible account termination. All commissions have a 30-day cooling period before payout eligibility.
          </AlertDescription>
        </Alert>

        {/* KYC Documents Section */}
        {user && <ReferrerKYCUpload userId={user.id} />}

        {/* Referral Section */}
        <div className="mt-6">
          {user && <ReferralSection userId={user.id} role="affiliate" />}
        </div>
      </main>

      {/* Profile Settings Modal */}
      {user && (
        <ProfileSettings 
          open={showProfileSettings} 
          onOpenChange={setShowProfileSettings} 
          userId={user.id}
        />
      )}
    </div>
  );
};

export default AffiliatePortal;
