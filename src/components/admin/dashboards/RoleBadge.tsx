/**
 * Role Badge — shows current admin role with color coding
 */
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Rocket, Crown } from 'lucide-react';
import type { AdminDashboardRole } from '@/hooks/useAdminRole';

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; className: string }> = {
  admin: { label: 'ADMIN', icon: Shield, className: 'bg-emerald-600 text-white border-0' },
  ceo: { label: 'CEO', icon: Crown, className: 'bg-slate-800 text-white border-0' },
  ops_manager: { label: 'OPS', icon: Eye, className: 'bg-blue-600 text-white border-0' },
  sales_manager: { label: 'SALES', icon: Rocket, className: 'bg-amber-600 text-white border-0' },
};

interface RoleBadgeProps {
  role: AdminDashboardRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  if (!role) return null;
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
