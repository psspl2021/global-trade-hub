import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContractSummary {
  id: string;
  signal_id: string | null;
  buyer_id: string | null;
  supplier_id: string | null;
  finance_partner: string | null;
  credit_days: number | null;
  base_price: number | null;
  platform_margin: number | null;
  total_value: number | null;
  created_at: string;
}

export function useContractSummaries(signalId?: string) {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let query = (supabase.from('contract_summaries') as any).select('*').order('created_at', { ascending: false });
      if (signalId) query = query.eq('signal_id', signalId);
      const { data, error } = await query;
      if (!error && data) setContracts(data);
      setLoading(false);
    };
    fetch();
  }, [signalId]);

  return { contracts, loading };
}
