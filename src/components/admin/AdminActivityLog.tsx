import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, History, UserMinus, Truck, CheckCircle, XCircle, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  target_details: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  admin_profile?: {
    company_name: string;
    contact_person: string;
  } | null;
}

interface AdminActivityLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  user_deletion: { label: 'User Deleted', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <UserMinus className="h-4 w-4" /> },
  vehicle_approval: { label: 'Vehicle Approved', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle className="h-4 w-4" /> },
  vehicle_rejection: { label: 'Vehicle Rejected', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <XCircle className="h-4 w-4" /> },
  invoice_payment: { label: 'Invoice Paid', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Receipt className="h-4 w-4" /> },
};

export function AdminActivityLog({ open, onOpenChange }: AdminActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch admin profiles
      const adminIds = [...new Set(data?.map(l => l.admin_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person')
        .in('id', adminIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const logsWithProfiles = data?.map(log => ({
        ...log,
        target_details: (typeof log.target_details === 'object' && log.target_details !== null && !Array.isArray(log.target_details)) 
          ? log.target_details as Record<string, any>
          : {},
        metadata: (typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata))
          ? log.metadata as Record<string, any>
          : {},
        admin_profile: profilesMap.get(log.admin_id) || null,
      })) || [];

      setLogs(logsWithProfiles as ActivityLog[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, page, actionFilter]);

  const getActionBadge = (actionType: string) => {
    const action = ACTION_LABELS[actionType] || { label: actionType, color: 'bg-gray-500/10 text-gray-600', icon: <History className="h-4 w-4" /> };
    return (
      <Badge className={`${action.color} flex items-center gap-1`}>
        {action.icon}
        {action.label}
      </Badge>
    );
  };

  const formatTargetDetails = (log: ActivityLog) => {
    const details = log.target_details;
    if (!details) return '-';

    switch (log.action_type) {
      case 'user_deletion':
        return (
          <div className="text-sm">
            <div className="font-medium">{details.company_name}</div>
            <div className="text-muted-foreground">{details.email}</div>
            {details.roles && (
              <div className="text-xs text-muted-foreground">Roles: {details.roles.join(', ')}</div>
            )}
          </div>
        );
      case 'vehicle_approval':
      case 'vehicle_rejection':
        return (
          <div className="text-sm">
            <div className="font-medium font-mono">{details.registration_number}</div>
            <div className="text-muted-foreground">{details.vehicle_type} - {details.partner_company}</div>
          </div>
        );
      case 'invoice_payment':
        return (
          <div className="text-sm">
            <div className="font-medium font-mono">{details.invoice_number}</div>
            <div className="text-muted-foreground">₹{Number(details.amount).toLocaleString()} - {details.company_name}</div>
          </div>
        );
      default:
        return <pre className="text-xs">{JSON.stringify(details, null, 2)}</pre>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Admin Activity Log
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(0); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_deletion">User Deletions</SelectItem>
              <SelectItem value="vehicle_approval">Vehicle Approvals</SelectItem>
              <SelectItem value="vehicle_rejection">Vehicle Rejections</SelectItem>
              <SelectItem value="invoice_payment">Invoice Payments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.admin_profile?.contact_person || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{log.admin_profile?.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell>{formatTargetDetails(log)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}