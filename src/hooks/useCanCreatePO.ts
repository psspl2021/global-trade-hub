import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface POBlockResult {
  allowed: boolean;
  blocking_po_id?: string;
  blocking_po_title?: string;
  message?: string;
}

export function useCanCreatePO(buyerId: string | null) {
  const [result, setResult] = useState<POBlockResult>({ allowed: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buyerId) { setLoading(false); return; }

    const check = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('check_can_create_po', { p_buyer_id: buyerId });
        if (error) throw error;
        setResult(data as any as POBlockResult);
      } catch {
        setResult({ allowed: true }); // fail-open
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [buyerId]);

  return { ...result, loading };
}
