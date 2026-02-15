/**
 * Enterprise Control Center Page
 * Admin-only access to all enterprise intelligence layers.
 */
import { useAuth } from '@/hooks/useAuth';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EnterpriseControlCenter } from '@/components/enterprise/EnterpriseControlCenter';

export default function EnterpriseControlCenterPage() {
  const { loading: authLoading } = useAuth();
  const { isLoading: accessLoading, isAccessDenied, primaryRole } = useGovernanceAccess();

  if (authLoading || accessLoading) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading...
          </CardContent></Card>
        </div>
      </main>
    );
  }

  if (isAccessDenied || !['ps_admin', 'admin'].includes(primaryRole)) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
        <EnterpriseControlCenter />
      </div>
    </div>
  );
}
