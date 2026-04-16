/**
 * CEO View — full company financial aggregates (FX-normalized).
 * Renders backend-scoped data only. No simulation, no fallback.
 */
import { Wallet, AlertTriangle, CalendarClock } from 'lucide-react';
import { IntelligenceMetricCard, formatBaseAmount } from './IntelligenceMetricCard';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function CEOIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  const base = data.base_currency || 'INR';
  const s = data.summary || {};
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <IntelligenceMetricCard
        title="Total Payable (Company-wide)"
        value={formatBaseAmount(s.total_payable ?? 0, base)}
        icon={Wallet}
        hint="All open POs, FX-normalized"
      />
      <IntelligenceMetricCard
        title="Overdue"
        value={formatBaseAmount(s.overdue ?? 0, base)}
        icon={AlertTriangle}
        tone={(s.overdue ?? 0) > 0 ? 'danger' : 'default'}
        hint="Past payment due date"
      />
      <IntelligenceMetricCard
        title="Due in 7 Days"
        value={formatBaseAmount(s.payable_7d ?? 0, base)}
        icon={CalendarClock}
        tone={(s.payable_7d ?? 0) > 0 ? 'warning' : 'default'}
        hint="Upcoming cash outflow"
      />
    </div>
  );
}

export default CEOIntelligenceView;
