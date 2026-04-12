import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BidValidationResult {
  valid: boolean;
  reason?: string;
}

export function useBidValidation() {
  const [validating, setValidating] = useState(false);

  const validateBid = async (
    auctionId: string,
    supplierId: string,
    bidAmount: number
  ): Promise<BidValidationResult> => {
    setValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_bid_rules', {
        p_auction_id: auctionId,
        p_supplier_id: supplierId,
        p_bid_amount: bidAmount,
      });
      if (error) throw error;
      return data as any as BidValidationResult;
    } catch {
      return { valid: false, reason: 'Validation service unavailable' };
    } finally {
      setValidating(false);
    }
  };

  return { validateBid, validating };
}
