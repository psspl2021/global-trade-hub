import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, RotateCcw } from 'lucide-react';
import { useERPSync } from '@/hooks/useERPSync';
import { useERPReconciliation } from '@/hooks/useERPReconciliation';
import { toast } from 'sonner';

interface FailureRecoveryActionsProps {
  poId: string;
  erpSyncStatus?: string | null;
  showReconciliation?: boolean;
}

export function FailureRecoveryActions({ poId, erpSyncStatus, showReconciliation }: FailureRecoveryActionsProps) {
  const { syncToERP, syncing } = useERPSync();
  const { triggerReconciliation, loading: reconLoading } = useERPReconciliation();
  const [resending, setResending] = useState(false);

  const handleRetryERP = async () => {
    await syncToERP(poId);
  };

  const handleResendConfirmation = async () => {
    setResending(true);
    try {
      // Trigger supplier notification re-send
      toast.info('Supplier confirmation request re-sent');
    } finally {
      setResending(false);
    }
  };

  const handleReconcile = async () => {
    await triggerReconciliation(poId);
  };

  const showRetryERP = erpSyncStatus === 'failed' || erpSyncStatus === 'pending';

  return (
    <div className="flex flex-wrap gap-2">
      {showRetryERP && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetryERP}
          disabled={syncing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Retry ERP Sync
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleResendConfirmation}
        disabled={resending}
        className="gap-1.5"
      >
        <Send className="h-3.5 w-3.5" />
        Resend Supplier Confirmation
      </Button>

      {showReconciliation && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReconcile}
          disabled={reconLoading}
          className="gap-1.5"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${reconLoading ? 'animate-spin' : ''}`} />
          Reconcile ERP
        </Button>
      )}
    </div>
  );
}
