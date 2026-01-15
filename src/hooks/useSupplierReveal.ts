import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RevealedContact {
  supplier_name: string | null;
  supplier_company: string | null;
  supplier_phone: string | null;
  supplier_email: string | null;
  supplier_address: string | null;
  supplier_gstin: string | null;
  revealed_at: string | null;
}

interface RevealRequest {
  success: boolean;
  reveal_id?: string;
  reveal_fee?: number;
  status?: string;
  error?: string;
  message?: string;
}

interface UseSupplierRevealReturn {
  // Initiate reveal request (creates payment intent)
  requestReveal: (requirementId: string, supplierId: string, bidId: string) => Promise<RevealRequest>;
  // Get revealed contact (only works if reveal_status = 'revealed')
  getRevealedContact: (requirementId: string, supplierId: string) => Promise<RevealedContact | null>;
  // Check reveal status
  getRevealStatus: (requirementId: string, supplierId: string) => Promise<string | null>;
  // Loading states
  isRequesting: boolean;
  isFetching: boolean;
}

/**
 * Hook for secure supplier contact reveal flow
 * 
 * SECURITY: This hook uses database functions that enforce:
 * 1. Buyer ownership verification
 * 2. Reveal status check before returning contact data
 * 3. Payment completion before reveal
 */
export function useSupplierReveal(): UseSupplierRevealReturn {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  /**
   * Request a supplier contact reveal
   * This creates a reveal request and returns the fee for payment
   */
  const requestReveal = useCallback(async (
    requirementId: string, 
    supplierId: string, 
    bidId: string
  ): Promise<RevealRequest> => {
    setIsRequesting(true);
    try {
      const { data, error } = await supabase.rpc('request_supplier_reveal', {
        p_requirement_id: requirementId,
        p_supplier_id: supplierId,
        p_bid_id: bidId
      });

      if (error) {
        console.error('Request reveal error:', error);
        toast.error('Failed to request reveal');
        return { success: false, error: error.message };
      }

      const result = data as unknown as RevealRequest;
      
      if (result.success) {
        if (result.status === 'requested') {
          toast.success(`Reveal requested! Fee: ₹${result.reveal_fee}`);
        } else if (result.message) {
          toast.info(result.message);
        }
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (err: any) {
      console.error('Request reveal error:', err);
      toast.error('Failed to request reveal');
      return { success: false, error: err.message };
    } finally {
      setIsRequesting(false);
    }
  }, []);

  /**
   * Get revealed supplier contact
   * SECURITY: Only returns data if reveal_status = 'revealed'
   */
  const getRevealedContact = useCallback(async (
    requirementId: string, 
    supplierId: string
  ): Promise<RevealedContact | null> => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.rpc('get_revealed_supplier_contact', {
        p_requirement_id: requirementId,
        p_supplier_id: supplierId
      });

      if (error) {
        // This is expected if contact is not revealed yet
        if (error.message.includes('not revealed')) {
          return null;
        }
        console.error('Get revealed contact error:', error);
        return null;
      }

      // RPC returns array, get first item
      const contact = Array.isArray(data) ? data[0] : data;
      return contact || null;
    } catch (err: any) {
      console.error('Get revealed contact error:', err);
      return null;
    } finally {
      setIsFetching(false);
    }
  }, []);

  /**
   * Check reveal status for a requirement-supplier pair
   */
  const getRevealStatus = useCallback(async (
    requirementId: string, 
    supplierId: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('requirement_supplier_reveals')
        .select('reveal_status')
        .eq('requirement_id', requirementId)
        .eq('supplier_id', supplierId)
        .maybeSingle();

      if (error) {
        console.error('Get reveal status error:', error);
        return null;
      }

      return data?.reveal_status || null;
    } catch (err) {
      console.error('Get reveal status error:', err);
      return null;
    }
  }, []);

  return {
    requestReveal,
    getRevealedContact,
    getRevealStatus,
    isRequesting,
    isFetching
  };
}

/**
 * Fetch anonymized supplier quotes for a requirement
 * SECURITY: Uses secure view that NEVER exposes contact data
 */
export async function fetchAnonymizedQuotes(requirementId: string) {
  const { data, error } = await supabase
    .from('anonymized_supplier_quotes')
    .select('*')
    .eq('requirement_id', requirementId)
    .order('bid_amount', { ascending: true });

  if (error) {
    console.error('Fetch anonymized quotes error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get reveal statuses for multiple suppliers in a requirement
 */
export async function fetchRevealStatuses(requirementId: string, supplierIds: string[]) {
  if (!supplierIds.length) return {};

  const { data, error } = await supabase
    .from('requirement_supplier_reveals')
    .select('supplier_id, reveal_status, reveal_fee')
    .eq('requirement_id', requirementId)
    .in('supplier_id', supplierIds);

  if (error) {
    console.error('Fetch reveal statuses error:', error);
    return {};
  }

  const statusMap: Record<string, { status: string; fee: number }> = {};
  for (const item of data || []) {
    statusMap[item.supplier_id] = {
      status: item.reveal_status,
      fee: item.reveal_fee || 499
    };
  }

  return statusMap;
}
