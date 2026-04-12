import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierScore {
  on_time_delivery_score: number;
  price_competitiveness_score: number;
  quality_score: number;
  reliability_score: number;
  total_orders_scored: number;
  composite: number;
}

function computeComposite(s: Partial<SupplierScore>): number {
  return (
    (s.on_time_delivery_score || 0) * 0.5 +
    (s.price_competitiveness_score || 0) * 0.2 +
    (s.quality_score || 0) * 0.2 +
    (s.reliability_score || 0) * 0.1
  );
}

export function useSupplierScore(supplierId: string | null) {
  const [score, setScore] = useState<SupplierScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('supplier_scores')
          .select('*')
          .eq('supplier_id', supplierId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          const s = data as any;
          setScore({
            on_time_delivery_score: s.on_time_delivery_score ?? 0,
            price_competitiveness_score: s.price_competitiveness_score ?? 0,
            quality_score: s.quality_score ?? 0,
            reliability_score: s.reliability_score ?? 0,
            total_orders_scored: s.total_orders_scored ?? 0,
            composite: computeComposite(s),
          });
        }
      } catch {
        setScore(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [supplierId]);

  return { score, loading };
}

export function getScoreBadge(composite: number) {
  if (composite >= 80) return { label: '🟢 Excellent', color: 'text-green-600' };
  if (composite >= 60) return { label: '🟡 Good', color: 'text-amber-600' };
  if (composite >= 40) return { label: '🟠 Fair', color: 'text-orange-600' };
  return { label: '🔴 Risky', color: 'text-red-600' };
}
