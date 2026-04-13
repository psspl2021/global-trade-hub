/**
 * Auction Limits — Frontend checks for active auction limit and supplier cap.
 * Calls server-side RPCs for hard enforcement.
 */
import { supabase } from "@/integrations/supabase/client";

interface AuctionLimitResult {
  allowed: boolean;
  current?: number;
  limit?: number;
  plan?: string;
  reason?: string;
}

interface SupplierLimitResult {
  valid: boolean;
  current?: number;
  max?: number;
  reason?: string;
}

export async function checkActiveAuctionLimit(
  buyerId: string
): Promise<AuctionLimitResult> {
  const { data, error } = await supabase.rpc("check_active_auction_limit", {
    p_buyer_id: buyerId,
  });

  if (error) {
    console.error("Auction limit check failed:", error);
    return { allowed: true }; // fail-open to not block on RPC errors
  }

  return data as unknown as AuctionLimitResult;
}

export async function checkSupplierLimit(
  auctionId: string
): Promise<SupplierLimitResult> {
  const { data, error } = await supabase.rpc("validate_supplier_limit", {
    p_auction_id: auctionId,
  });

  if (error) {
    console.error("Supplier limit check failed:", error);
    return { valid: true };
  }

  return data as unknown as SupplierLimitResult;
}
