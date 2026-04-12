import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReconciliationLog {
  id: string;
  po_id: string;
  erp_reference_id: string | null;
  status_in_erp: string | null;
  status_in_platform: string | null;
  is_mismatched: boolean;
  mismatch_details: Record<string, any> | null;
  checked_at: string;
}

export function useERPReconciliation() {
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (poId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_reconciliation_logs')
        .select('*')
        .eq('po_id', poId)
        .order('checked_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs((data as any[]) || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const triggerReconciliation = async (poId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-reconciliation', {
        body: { po_id: poId },
      });
      if (error) throw error;
      if (data?.is_mismatched) {
        toast.warning('ERP mismatch detected — review reconciliation logs');
      } else {
        toast.success('ERP status matches platform');
      }
      await fetchLogs(poId);
      return data;
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation check failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getMismatches = async () => {
    const { data } = await supabase
      .from('erp_reconciliation_logs')
      .select('*')
      .eq('is_mismatched', true)
      .is('resolved_at', null)
      .order('checked_at', { ascending: false });
    return (data as any[]) || [];
  };

  return { logs, loading, fetchLogs, triggerReconciliation, getMismatches };
}
