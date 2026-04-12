/**
 * useERPSync — Hook for triggering ERP sync on purchase orders
 * Includes retry queue status visibility
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ErpType = 'webhook' | 'tally' | 'sap' | 'odoo' | 'busy' | 'manual';

interface ErpSyncResult {
  success: boolean;
  sync_status: string;
  erp_reference_id: string | null;
  erp_payload: Record<string, any>;
  queued_for_retry?: boolean;
}

export function useERPSync() {
  const [syncing, setSyncing] = useState(false);

  const syncToERP = async (
    poId: string,
    erpType: ErpType = 'webhook',
    erpEndpoint?: string
  ): Promise<ErpSyncResult | null> => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-sync', {
        body: { po_id: poId, erp_type: erpType, erp_endpoint: erpEndpoint },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`ERP sync ${data.sync_status === 'pending' ? 'payload ready' : 'completed'}`);
      } else if (data?.queued_for_retry) {
        toast.warning('ERP sync failed — queued for automatic retry');
      } else {
        toast.error('ERP sync failed — check audit logs');
      }

      return data as ErpSyncResult;
    } catch (err: any) {
      toast.error(err.message || 'ERP sync failed');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  const getERPStatus = async (poId: string) => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('erp_sync_status, erp_reference_id, erp_response')
      .eq('id', poId)
      .single();
    return data;
  };

  return { syncToERP, getERPStatus, syncing };
}
