/**
 * RFQ Industry Templates Hook
 * Fetches pre-built templates per category for quick auction setup
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RfqTemplate {
  id: string;
  category: string;
  template_name: string;
  default_items: { product_name: string; quantity: number; unit: string; description?: string }[];
  default_specs: Record<string, string>;
  quality_standards: string | null;
  certifications: string | null;
  payment_terms: string | null;
  unit: string;
}

export function useRfqTemplates() {
  const [templates, setTemplates] = useState<RfqTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplates = useCallback(async (category?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('rfq_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTemplates((data || []).map((t: any) => ({
        id: t.id,
        category: t.category,
        template_name: t.template_name,
        default_items: Array.isArray(t.default_items) ? t.default_items : JSON.parse(t.default_items || '[]'),
        default_specs: t.default_specs || {},
        quality_standards: t.quality_standards,
        certifications: t.certifications,
        payment_terms: t.payment_terms,
        unit: t.unit,
      })));
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, isLoading, fetchTemplates };
}
