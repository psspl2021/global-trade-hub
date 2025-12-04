import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Loader2 } from 'lucide-react';
import { CreateRequirementForm } from '@/components/CreateRequirementForm';
import { BuyerRequirementsList } from '@/components/BuyerRequirementsList';
import { SupplierCatalog } from '@/components/SupplierCatalog';
import { StockManagement } from '@/components/StockManagement';
import { BrowseRequirements } from '@/components/BrowseRequirements';
import { SupplierCRM } from '@/components/crm/SupplierCRM';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showCRM, setShowCRM] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=dashboard');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.contact_person || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {user?.user_metadata?.company_name} • {role?.toUpperCase()}
          </p>
        </div>

        {role === 'buyer' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Post Requirement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new procurement requirement and get competitive bids
                  </p>
                  <Button className="w-full" onClick={() => setShowRequirementForm(true)}>
                    Create Requirement
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Requirements List with Bid Details */}
            {user && <BuyerRequirementsList key={refreshKey} userId={user.id} />}
          </div>
        )}

        {role === 'supplier' && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add or update your product catalog
                  </p>
                  <Button className="w-full" onClick={() => setShowCatalog(true)}>Manage Catalog</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update inventory and import from Tally/Busy
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowStock(true)}>Update Stock</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browse Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Find active requirements and submit bids
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowRequirements(true)}>View Requirements</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoices & PO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create proforma, tax invoices & purchase orders
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setShowCRM(true)}>Open CRM</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">Free Plan</div>
                  <div className="text-2xl font-bold text-primary mb-2">0/5</div>
                  <p className="text-sm text-muted-foreground mb-4">Bids used this month</p>
                  <Button variant="outline" className="w-full">Upgrade to Premium</Button>
                </CardContent>
              </Card>
            </div>

            {user && (
              <>
                <SupplierCatalog open={showCatalog} onOpenChange={setShowCatalog} userId={user.id} />
                <StockManagement open={showStock} onOpenChange={setShowStock} userId={user.id} />
                <BrowseRequirements open={showRequirements} onOpenChange={setShowRequirements} userId={user.id} />
                <SupplierCRM open={showCRM} onOpenChange={setShowCRM} userId={user.id} />
              </>
            )}
          </>
        )}

        {/* Create Requirement Form */}
        {user && (
          <CreateRequirementForm
            open={showRequirementForm}
            onOpenChange={setShowRequirementForm}
            userId={user.id}
            onSuccess={() => setRefreshKey(k => k + 1)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
