/**
 * HR View — team metrics ONLY. No financial exposure (enforced by backend).
 */
import { Users, UserCheck, Briefcase } from 'lucide-react';
import { IntelligenceMetricCard } from './IntelligenceMetricCard';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function HRIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <IntelligenceMetricCard
        title="Total Team Size"
        value={data.team_size ?? 0}
        icon={Users}
        hint="All active members"
      />
      <IntelligenceMetricCard
        title="Active Purchasers"
        value={data.active_purchasers ?? 0}
        icon={UserCheck}
        hint="Procurement headcount"
      />
      <IntelligenceMetricCard
        title="Active Managers"
        value={data.active_managers ?? 0}
        icon={Briefcase}
        hint="Approver headcount"
      />
    </div>
  );
}

export default HRIntelligenceView;
