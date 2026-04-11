import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getAvailableActions,
  mapUserRoleToExecRole,
  PO_STATUS_LABELS,
  type POExecutionStatus,
} from '@/lib/po-execution-engine';

interface PurchaseOrderActionsProps {
  poId: string;
  currentStatus: POExecutionStatus;
  userId: string;
  userRole: string | null;
  onStatusChange: () => void;
}

export function PurchaseOrderActions({ poId, currentStatus, userId, userRole, onStatusChange }: PurchaseOrderActionsProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const execRole = mapUserRoleToExecRole(userRole);
  const actions = getAvailableActions(currentStatus, execRole);

  if (actions.length === 0) return null;

  const handleTransition = async (targetStatus: POExecutionStatus) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('transition_po_status', {
        p_po_id: poId,
        p_new_status: targetStatus,
        p_user_id: userId,
        p_user_role: userRole || '',
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Transition failed');
      }

      toast({
        title: 'Status Updated',
        description: `Order moved to "${PO_STATUS_LABELS[targetStatus]}"`,
      });
      setNotes('');
      onStatusChange();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <AlertDialog key={action.targetStatus}>
          <AlertDialogTrigger asChild>
            <Button variant={action.variant} size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {action.label}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{action.label}</AlertDialogTitle>
              <AlertDialogDescription>{action.confirmMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={2}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleTransition(action.targetStatus)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
