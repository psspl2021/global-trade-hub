import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GovernanceRule {
  id: string;
  buyer_id: string | null;
  category: string | null;
  max_credit_days: number | null;
  min_vendor_count: number;
  margin_cap: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useGovernanceRules() {
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    const { data, error } = await (supabase.from('governance_rules') as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (!error && data) setRules(data);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const addRule = async (rule: Partial<GovernanceRule>) => {
    const { error } = await (supabase.from('governance_rules') as any).insert(rule);
    if (!error) await fetchRules();
    return { error };
  };

  const updateRule = async (id: string, updates: Partial<GovernanceRule>) => {
    const { error } = await (supabase.from('governance_rules') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchRules();
    return { error };
  };

  const deleteRule = async (id: string) => {
    const { error } = await (supabase.from('governance_rules') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await fetchRules();
    return { error };
  };

  return { rules, loading, addRule, updateRule, deleteRule, refetch: fetchRules };
}
