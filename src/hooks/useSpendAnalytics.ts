import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SpendData {
  total_spend: number;
  spend_by_category: Array<{ category: string; spend: number }>;
  spend_by_country: Array<{ country: string; spend: number }>;
  avg_credit_days: number;
  active_lanes: number;
  closed_lanes: number;
  period_days: number;
}

interface SupplierData {
  total_volume_supplied: number;
  total_bids: number;
  won_bids: number;
  win_rate: number;
  avg_deal_size: number;
}

interface AdminMetrics {
  total_platform_margin: number;
  margin_by_category: Array<{ category: string; margin: number }>;
  margin_by_country: Array<{ country: string; margin: number }>;
  risk_concentration_top3: Array<{ buyer_id: string; revenue: number; pct: number }>;
  period_days: number;
}

export function useBuyerSpend(buyerId: string | undefined, days = 90) {
  const [data, setData] = useState<SpendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buyerId) { setLoading(false); return; }
    const fetch = async () => {
      const { data: result, error } = await supabase.rpc('get_buyer_spend_summary', {
        p_buyer_id: buyerId, p_days: days
      });
      if (!error && result) setData(result as unknown as SpendData);
      setLoading(false);
    };
    fetch();
  }, [buyerId, days]);

  return { data, loading };
}

export function useSupplierPerformance(supplierId: string | undefined) {
  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) { setLoading(false); return; }
    const fetch = async () => {
      const { data: result, error } = await supabase.rpc('get_supplier_performance', {
        p_supplier_id: supplierId
      });
      if (!error && result) setData(result as unknown as SupplierData);
      setLoading(false);
    };
    fetch();
  }, [supplierId]);

  return { data, loading };
}

export function useAdminPlatformMetrics(days = 90) {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: result, error } = await supabase.rpc('get_admin_platform_metrics', {
        p_days: days
      });
      if (!error && result) setData(result as unknown as AdminMetrics);
      setLoading(false);
    };
    fetch();
  }, [days]);

  return { data, loading };
}
