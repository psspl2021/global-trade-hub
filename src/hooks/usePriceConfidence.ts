import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceConfidenceData {
  price_confidence_score: number;
  confidence_label: "HIGH" | "MEDIUM" | "LOW";
  buyer_message: string;
  price_behavior_note: string;
  logistics_note: string;
  mode: "bidding" | "auto_assign";
  internal?: {
    price_position: number;
    market_stability: number;
    competition_score: number;
    price_spread_ratio: number;
    margin_type: string;
    total_bids: number | null;
    historical_price_variance: number | null;
  };
}

interface UsePriceConfidenceOptions {
  requirementId: string;
  bidId?: string;
  buyerVisiblePrice?: number;
  selectionMode?: "bidding" | "auto_assign";
}

export const usePriceConfidence = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PriceConfidenceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateConfidence = useCallback(
    async ({
      requirementId,
      bidId,
      buyerVisiblePrice,
      selectionMode = "bidding",
    }: UsePriceConfidenceOptions) => {
      setLoading(true);
      setError(null);

      try {
        const { data: result, error: rpcError } = await supabase.rpc(
          "calculate_price_confidence",
          {
            p_requirement_id: requirementId,
            p_bid_id: bidId || null,
            p_buyer_visible_price: buyerVisiblePrice || null,
            p_selection_mode: selectionMode,
          }
        );

        if (rpcError) throw rpcError;

        const resultObj = result as Record<string, unknown> | null;
        if (resultObj?.error) {
          throw new Error(String(resultObj.error));
        }

        setData(resultObj as unknown as PriceConfidenceData);
        return resultObj as unknown as PriceConfidenceData;
      } catch (err: any) {
        const message = err.message || "Failed to calculate price confidence";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStoredConfidence = useCallback(
    async (requirementId: string, bidId?: string) => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("price_confidence_scores")
          .select("*")
          .eq("requirement_id", requirementId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (bidId) {
          query = query.eq("bid_id", bidId);
        }

        const { data: scores, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (scores && scores.length > 0) {
          const score = scores[0];
          const confidenceData: PriceConfidenceData = {
            price_confidence_score: score.confidence_score,
            confidence_label: score.confidence_label as "HIGH" | "MEDIUM" | "LOW",
            buyer_message: score.buyer_message,
            price_behavior_note:
              score.price_behavior_note || "Prices may vary due to market conditions.",
            logistics_note:
              score.logistics_note || "Logistics charges are calculated separately.",
            mode: score.selection_mode as "bidding" | "auto_assign",
            internal: {
              price_position: score.price_position || 0,
              market_stability: score.market_stability || 0,
              competition_score: score.competition_score || 0,
              price_spread_ratio: score.price_spread_ratio || 0,
              margin_type: score.margin_type || "",
              total_bids: score.total_bids,
              historical_price_variance: score.historical_price_variance,
            },
          };
          setData(confidenceData);
          return confidenceData;
        }

        return null;
      } catch (err: any) {
        const message = err.message || "Failed to fetch price confidence";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    data,
    error,
    calculateConfidence,
    fetchStoredConfidence,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
};

export default usePriceConfidence;
