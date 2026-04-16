/**
 * Manager View — scoped to assigned team + categories (backend-enforced).
 */
import { Wallet, AlertTriangle, Users, Tags } from 'lucide-react';
import { IntelligenceMetricCard, formatBaseAmount } from './IntelligenceMetricCard';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function ManagerIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  const base = data.base_currency || 'INR';
  const s = data.summary || {};
  const scope = data.access_scope || {};
  const categoryCount = Array.isArray(scope.categories) ? scope.categories.length : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IntelligenceMetricCard
          title="Team Payable"
          value={formatBaseAmount(s.total_payable ?? 0, base)}
          icon={Wallet}
          hint="Scoped to your team & categories"
        />
        <IntelligenceMetricCard
          title="Overdue"
          value={formatBaseAmount(s.overdue ?? 0, base)}
          icon={AlertTriangle}
          tone={(s.overdue ?? 0) > 0 ? 'danger' : 'default'}
        />
        <IntelligenceMetricCard
          title="Team Size"
          value={scope.team_size ?? 0}
          icon={Users}
          hint="Direct purchasers"
        />
        <IntelligenceMetricCard
          title="Categories"
          value={categoryCount}
          icon={Tags}
          hint="Assigned scope"
        />
      </div>
    </div>
  );
}

export default ManagerIntelligenceView;
