/**
 * CEO / CFO View — full company financial aggregates (FX-normalized).
 */
import { Wallet, AlertTriangle, CalendarClock, FileText } from 'lucide-react';
import { IntelligenceMetricCard, formatBaseAmount } from './IntelligenceMetricCard';
import { CEOInsightsPanel } from './CEOInsightsPanel';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function CEOIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  const base = data.base_currency || 'INR';
  const s = data.summary || {};
  const insights = (data as any).insights ?? null;
  return (
    <div className="space-y-4">
      <CEOInsightsPanel insights={insights} baseCurrency={base} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <IntelligenceMetricCard
        title="Total Payable"
        value={formatBaseAmount(s.total_payable ?? 0, base)}
        icon={Wallet}
        hint="Company-wide, FX-normalized"
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
      <IntelligenceMetricCard
        title="Total POs"
        value={(s as any).po_count ?? 0}
        icon={FileText}
        hint="All purchase orders"
      />
    </div>
  );
}

export default CEOIntelligenceView;
