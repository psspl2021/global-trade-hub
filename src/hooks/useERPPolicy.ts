import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ERPPolicy = 'mandatory' | 'optional' | 'disabled';

export function useERPPolicy(companyId: string | null) {
  const [policy, setPolicy] = useState<ERPPolicy>('optional');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_company_erp_policy', { p_company_id: companyId });
        if (error) throw error;
        setPolicy((data as string as ERPPolicy) || 'optional');
      } catch {
        setPolicy('optional');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [companyId]);

  const resolveErpSync = (buyerChoice: boolean): boolean => {
    if (policy === 'mandatory') return true;
    if (policy === 'disabled') return false;
    return buyerChoice;
  };

  return { policy, loading, resolveErpSync };
}
