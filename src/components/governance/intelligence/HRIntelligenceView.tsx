/**
 * HR View — non-financial metrics ONLY (enforced by backend RPC).
 */
import { FileText, UserCheck } from 'lucide-react';
import { IntelligenceMetricCard } from './IntelligenceMetricCard';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function HRIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  const s = data.summary || {};
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <IntelligenceMetricCard
        title="Total POs"
        value={(s as any).po_count ?? 0}
        icon={FileText}
        hint="Procurement activity volume"
      />
      <IntelligenceMetricCard
        title="Active Purchasers"
        value={data.active_purchasers ?? (Array.isArray(data.scope_users) ? data.scope_users.length : 0)}
        icon={UserCheck}
        hint="Procurement headcount"
      />
    </div>
  );
}

export default HRIntelligenceView;
