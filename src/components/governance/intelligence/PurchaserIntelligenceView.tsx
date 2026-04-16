/**
 * Purchaser View — strictly self-scoped (backend-enforced).
 */
import { Wallet, AlertTriangle, FileText } from 'lucide-react';
import { IntelligenceMetricCard, formatBaseAmount } from './IntelligenceMetricCard';
import type { CompanyIntelligenceData } from '@/hooks/useCompanyIntelligence';

export function PurchaserIntelligenceView({ data }: { data: CompanyIntelligenceData }) {
  const base = data.base_currency || 'INR';
  const s = data.summary || {};
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <IntelligenceMetricCard
        title="My Payable"
        value={formatBaseAmount(s.total_payable ?? 0, base)}
        icon={Wallet}
        hint="POs created by you"
      />
      <IntelligenceMetricCard
        title="My Overdue"
        value={formatBaseAmount(s.overdue ?? 0, base)}
        icon={AlertTriangle}
        tone={(s.overdue ?? 0) > 0 ? 'danger' : 'default'}
      />
      <IntelligenceMetricCard
        title="My POs"
        value={(s as any).po_count ?? 0}
        icon={FileText}
        hint="Total purchase orders"
      />
    </div>
  );
}

export default PurchaserIntelligenceView;
