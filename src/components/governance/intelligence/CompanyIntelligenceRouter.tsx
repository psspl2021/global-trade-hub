/**
 * ============================================================
 * CompanyIntelligenceRouter
 * ============================================================
 *
 * Backend (`get_company_intelligence_v2`) is the single authority
 * on role + scope. The frontend is a pure renderer.
 *
 *   - No view dropdown.
 *   - No role override.
 *   - No simulated data.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyIntelligence } from '@/hooks/useCompanyIntelligence';
import { CEOIntelligenceView } from './CEOIntelligenceView';
import { ManagerIntelligenceView } from './ManagerIntelligenceView';
import { HRIntelligenceView } from './HRIntelligenceView';
import { PurchaserIntelligenceView } from './PurchaserIntelligenceView';

export function CompanyIntelligenceRouter(_props: {
  forcedView?: string;
  hideViewSelector?: boolean;
}) {
  const { user } = useAuth();
  const { data, loading, error } = useCompanyIntelligence({ userId: user?.id });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading intelligence…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.role) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No role assigned for your account. Please contact your administrator.
        </CardContent>
      </Card>
    );
  }

  const poCount = (data.summary as any)?.po_count ?? 0;
  const role = String(data.role).toLowerCase();
  // HR is non-financial; show empty-state only when there's truly nothing to count.
  if (poCount === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No procurement activity yet
        </CardContent>
      </Card>
    );
  }

  switch (role) {
    case 'ceo':
    case 'cfo':
      return <CEOIntelligenceView data={data} />;
    case 'manager':
      return <ManagerIntelligenceView data={data} />;
    case 'hr':
      return <HRIntelligenceView data={data} />;
    case 'purchaser':
      return <PurchaserIntelligenceView data={data} />;
    default:
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projection registered for role: {String(data.role)}
          </CardContent>
        </Card>
      );
  }
}

export default CompanyIntelligenceRouter;
