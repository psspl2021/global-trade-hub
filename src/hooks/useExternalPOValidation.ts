import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function useExternalPOValidation() {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = async (poId: string): Promise<ValidationResult> => {
    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_external_po', { p_po_id: poId });
      if (error) throw error;
      const res = data as unknown as ValidationResult;
      setResult(res);
      return res;
    } catch {
      const fallback = { valid: true }; // fail-open
      setResult(fallback);
      return fallback;
    } finally {
      setValidating(false);
    }
  };

  return { validate, validating, result };
}
