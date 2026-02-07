/**
 * ============================================================
 * PURCHASER EXECUTION DASHBOARD (/dashboard)
 * ============================================================
 * 
 * ROLE: purchaser
 * THEME: BLUE / OPERATIONAL
 * 
 * SHOWS ONLY:
 * - RFQ creation (AI + Manual)
 * - My Requirements
 * - AI Selection Result (anonymous)
 * - My Savings (READ-ONLY)
 * - My Incentive Card (READ-ONLY)
 * 
 * HIDES COMPLETELY:
 * - Org-level savings
 * - Billing
 * - Control Tower
 * - Other purchasers data
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { usePurchaserIncentives } from '@/hooks/usePurchaserIncentives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  TrendingUp, 
  Gift, 
  LogOut, 
  Loader2,
  Shield,
  Eye,
  ClipboardList,
  Bot
} from 'lucide-react';
import { AccessDenied } from '@/components/purchaser';
import { GovernanceLegalArmor } from '@/components/governance';
import { SavingsTracker } from '@/components/purchaser/SavingsTracker';
import { PurchaserIncentiveCard } from '@/components/purchaser/PurchaserIncentiveCard';
import { NotificationBell } from '@/components/NotificationBell';
import { AIRFQGenerator } from '@/components/AIRFQGenerator';
import { CreateRequirementForm } from '@/components/CreateRequirementForm';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import procureSaathiLogo from '@/assets/procuresaathi-logo.png';

export default function PurchaserExecutionDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();
  const { summary, isLoading: incentiveLoading } = usePurchaserIncentives(user?.id);
  const [activeTab, setActiveTab] = useState('requirements');
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [aiGeneratedRFQ, setAIGeneratedRFQ] = useState<any>(null);

  // Role-based redirects
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (!accessLoading && primaryRole) {
      // Management roles → /management
      if (['cfo', 'ceo', 'manager'].includes(primaryRole)) {
        navigate('/management');
        return;
      }
      // ps_admin → /admin
      if (primaryRole === 'ps_admin' || primaryRole === 'admin') {
        navigate('/admin');
        return;
      }
    }
  }, [authLoading, accessLoading, user, primaryRole, navigate]);

  // HARD 404 for supplier/external_guest
  if (!accessLoading && isAccessDenied) {
    return <AccessDenied variant="404" />;
  }

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  // Only allow purchaser and buyer roles
  if (!['purchaser', 'buyer'].includes(primaryRole)) {
    return <AccessDenied variant="404" />;
  }

  const handleRFQGenerated = (rfqData: any) => {
    setAIGeneratedRFQ(rfqData);
    setShowRequirementForm(true);
  };

  const handleRequirementCreated = () => {
    setShowRequirementForm(false);
    setAIGeneratedRFQ(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 to-background">
      {/* Header - Blue Operational Theme */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi" 
              className="h-12 sm:h-14 w-auto"
            />
          </Link>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
              <ClipboardList className="w-3 h-3 mr-1" />
              Execution Dashboard
            </Badge>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Governance Banner */}
      <div className="bg-sky-600 text-white py-2 px-4">
        <div className="container mx-auto">
          <p className="text-sm text-center font-medium">
            <Shield className="w-4 h-4 inline mr-2" />
            This is an execution dashboard. Savings are tracked by AI. Incentives are declared by management.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.user_metadata?.contact_person || 'Purchaser'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.user_metadata?.company_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowRequirementForm(true)}
              className="bg-sky-600 hover:bg-sky-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create RFQ
            </Button>
          </div>
        </div>

        {/* AI RFQ Generator */}
        <Card className="border-sky-200 bg-sky-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-sky-900">
              <Bot className="w-5 h-5 text-sky-600" />
              AI-Powered RFQ Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIRFQGenerator onRFQGenerated={handleRFQGenerated} />
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-sky-100/50 border border-sky-200">
            <TabsTrigger value="requirements" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              My Requirements
            </TabsTrigger>
            <TabsTrigger value="savings" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              My Savings
            </TabsTrigger>
            <TabsTrigger value="incentives" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              My Incentives
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-4">
            <BuyerRequirementsList userId={user?.id || ''} />
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <Card className="border-dashed border-sky-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-600" />
                    My Savings (AI-Verified)
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    READ-ONLY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <SavingsTracker rewardsEnabled />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incentives" className="space-y-4">
            <Card className="border-dashed border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-600" />
                    My Incentive Card
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    READ-ONLY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <GovernanceLegalArmor variant="incentive" className="mb-4" />
                <PurchaserIncentiveCard summary={summary} isLoading={incentiveLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* RFQ Form Dialog */}
        <CreateRequirementForm 
          open={showRequirementForm}
          onOpenChange={(open) => {
            setShowRequirementForm(open);
            if (!open) setAIGeneratedRFQ(null);
          }}
          userId={user?.id || ''} 
          onSuccess={handleRequirementCreated}
          prefillData={aiGeneratedRFQ}
        />

        {/* Legal Footer */}
        <GovernanceLegalArmor variant="footer" />
      </main>
    </div>
  );
}
