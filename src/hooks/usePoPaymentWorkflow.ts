/**
 * PO Payment Lifecycle Hook
 * Manages: pending → approved_for_payment → payment_initiated → payment_confirmed → payment_failed
 * Role-locked: Only CFO/Finance roles can transition financial states (enforced server-side)
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PaymentStatus = "pending" | "approved_for_payment" | "payment_initiated" | "payment_confirmed" | "payment_failed";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "text-muted-foreground" },
  approved_for_payment: { label: "Approved for Payment", color: "text-blue-600" },
  payment_initiated: { label: "Payment Initiated", color: "text-amber-600" },
  payment_confirmed: { label: "Payment Confirmed", color: "text-emerald-600" },
  payment_failed: { label: "Payment Failed", color: "text-destructive" },
};

export const FINANCE_ROLES = ["cfo", "finance_manager", "buyer_admin"] as const;

export function usePoPaymentWorkflow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const transitionPayment = async (params: {
    poId: string;
    targetStatus: PaymentStatus;
    userId: string;
    paymentReference?: string;
    paymentMethod?: string;
    amount?: number;
    currency?: string;
    notes?: string;
  }) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("transition_po_payment" as any, {
        p_po_id: params.poId,
        p_target_status: params.targetStatus,
        p_user_id: params.userId,
        p_payment_reference: params.paymentReference || null,
        p_payment_method: params.paymentMethod || null,
        p_amount: params.amount || null,
        p_currency: params.currency || null,
        p_notes: params.notes || null,
      });

      if (error) {
        const msg = error.message;
        // Surface role-lock errors clearly
        if (msg.includes("CFO") || msg.includes("Finance")) {
          toast({ title: "Access Denied", description: "Only CFO or Finance roles can perform this action.", variant: "destructive" });
        } else if (msg.includes("exceeds PO value")) {
          toast({ title: "Fraud Check Failed", description: msg, variant: "destructive" });
        } else if (msg.includes("currency")) {
          toast({ title: "Currency Mismatch", description: msg, variant: "destructive" });
        } else {
          toast({ title: "Payment Error", description: msg, variant: "destructive" });
        }
        return { success: false };
      }

      toast({
        title: "Payment Updated",
        description: `Payment status changed to ${PAYMENT_STATUS_LABELS[params.targetStatus]?.label || params.targetStatus}`,
      });
      return { success: true, data };
    } catch (err) {
      toast({ title: "Error", description: "Unexpected error during payment transition", variant: "destructive" });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return { transitionPayment, isProcessing, FINANCE_ROLES };
}
