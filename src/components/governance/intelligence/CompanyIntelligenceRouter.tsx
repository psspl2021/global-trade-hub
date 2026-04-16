/**
 * ============================================================
 * CompanyIntelligenceRouter
 * ============================================================
 *
 * Strict role-based render. Backend (`get_company_intelligence`)
 * is the single authority on scope. The frontend NEVER:
 *   - Falls back to another view
 *   - Simulates missing data
 *   - Denies access (backend enforces scope, not the UI)
 *
 * It only:
 *   - Reads the requested view from the dropdown
 *   - Calls the universal RPC
 *   - Routes to the role-specific projection
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalBuyerContext } from '@/hooks/useGlobalBuyerContext';
import {
  useCompanyIntelligence,
  type CompanyIntelligenceView,
} from '@/hooks/useCompanyIntelligence';
import { CEOIntelligenceView } from './CEOIntelligenceView';
import { ManagerIntelligenceView } from './ManagerIntelligenceView';
import { HRIntelligenceView } from './HRIntelligenceView';
import { PurchaserIntelligenceView } from './PurchaserIntelligenceView';

const STORAGE_KEY = 'ps_intelligence_view';

export function CompanyIntelligenceRouter() {
  const { user } = useAuth();
  const { companyId, isLoading: ctxLoading } = useGlobalBuyerContext();

  const initialView = useMemo<CompanyIntelligenceView>(() => {
    const saved = (typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null) as CompanyIntelligenceView | null;
    return saved && ['CEO', 'MANAGER', 'HR'].includes(saved) ? saved : 'CEO';
  }, []);

  const [view, setView] = useState<CompanyIntelligenceView>(initialView);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, view);
  }, [view]);

  const { data, loading, error } = useCompanyIntelligence({
    companyId,
    userId: user?.id,
    view,
  });

  const isLoading = ctxLoading || loading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">View as</span>
          <Select value={view} onValueChange={(v) => setView(v as CompanyIntelligenceView)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CEO">CEO View</SelectItem>
              <SelectItem value="MANAGER">Manager View</SelectItem>
              <SelectItem value="HR">HR View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {data?.role ? (
          <Badge variant="secondary" className="uppercase tracking-wide">
            Resolved role: {String(data.role)}
          </Badge>
        ) : null}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading intelligence…
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No data available for this scope.
          </CardContent>
        </Card>
      ) : (
        renderByRole(data)
      )}
    </div>
  );
}

function renderByRole(data: NonNullable<ReturnType<typeof useCompanyIntelligence>['data']>) {
  const role = String(data.role || '').toUpperCase();
  switch (role) {
    case 'CEO':
    case 'CFO':
      return <CEOIntelligenceView data={data} />;
    case 'MANAGER':
      return <ManagerIntelligenceView data={data} />;
    case 'HR':
      return <HRIntelligenceView data={data} />;
    case 'PURCHASER':
      return <PurchaserIntelligenceView data={data} />;
    default:
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No projection registered for role: {role || 'UNKNOWN'}
          </CardContent>
        </Card>
      );
  }
}

export default CompanyIntelligenceRouter;
