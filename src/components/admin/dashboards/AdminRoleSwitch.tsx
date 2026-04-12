/**
 * Admin Role Switch — allows admins to preview other role dashboards
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdminDashboardRole } from '@/hooks/useAdminRole';

interface AdminRoleSwitchProps {
  currentView: AdminDashboardRole;
  onSwitch: (role: AdminDashboardRole) => void;
}

export function AdminRoleSwitch({ currentView, onSwitch }: AdminRoleSwitchProps) {
  return (
    <Select value={currentView || 'admin'} onValueChange={(val) => onSwitch(val as AdminDashboardRole)}>
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue placeholder="View as..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Full Admin</SelectItem>
        <SelectItem value="ceo">CEO View</SelectItem>
        <SelectItem value="ops_manager">Ops Manager View</SelectItem>
        <SelectItem value="sales_manager">Sales Manager View</SelectItem>
      </SelectContent>
    </Select>
  );
}
