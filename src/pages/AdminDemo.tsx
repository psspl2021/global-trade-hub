import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useDemoMode } from '@/hooks/useDemoMode';
import { DemoGuidedFlow } from '@/components/demo/DemoGuidedFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Play } from 'lucide-react';

export default function AdminDemoPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate('/login'); return; }
      setUserId(data.user.id);
      setLoading(false);
    });
  }, [navigate]);

  const { isAdmin } = useUserRole(userId);
  const { demoEnabled, toggleDemo, resetDemo, canAccessDemo } = useDemoMode(userId);

  // Show loading while checking auth — never flash "Access Denied"
  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading demo...</div>
      </div>
    );
  }

  if (!canAccessDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <Shield className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground">Admin access required to view the demo.</p>
            <Button variant="outline" onClick={() => navigate('/admin')}>Back to Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!demoEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Demo Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Launch a fully simulated procurement flow — live auction bidding, PO lifecycle, transport tracking, and payment confirmation. No real data is affected.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>1 Buyer, 3 Suppliers, 1 Transporter</li>
              <li>Live reverse auction with auto-decreasing bids</li>
              <li>Full PO lifecycle: Sent → Accepted → In Transit → Delivered → Paid → Closed</li>
              <li>Auto-play or step-through mode</li>
            </ul>
            <Button onClick={toggleDemo} className="w-full gap-2">
              <Play className="w-4 h-4" />
              Start Demo Scenario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DemoGuidedFlow
      onReset={resetDemo}
      onExit={toggleDemo}
    />
  );
}
