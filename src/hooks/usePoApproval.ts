/**
 * PO Approval Workflow Hook
 * Handles manager→director approval flow with intelligence gating,
 * row-locking, idempotency, and Brevo email notifications.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type ApprovalRole = "manager" | "director";

interface ApprovalResult {
  success: boolean;
  idempotent?: boolean;
}

export function usePoApproval() {
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  /**
   * Approve a PO step (manager or director).
   * Uses the DB-enforced approve_po_step RPC with row locking + idempotency.
   */
  const approvePo = async (
    poId: string,
    role: ApprovalRole,
    userId: string
  ): Promise<ApprovalResult> => {
    setIsApproving(true);
    try {
      const idempotencyKey = `${poId}_${role}_${crypto.randomUUID()}`;

      const { data, error } = await supabase.rpc("approve_po_step" as any, {
        p_po_id: poId,
        p_role: role,
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
      });

      if (error) {
        const msg = error.message || "Approval failed";

        if (msg.includes("Low competition")) {
          toast({
            title: "Approval Blocked",
            description: "This PO is linked to a low-competition auction. Minimum 40 quality score required.",
            variant: "destructive",
          });
        } else if (msg.includes("Savings below")) {
          toast({
            title: "Approval Blocked",
            description: "Savings are below the 2% threshold. Review pricing before approval.",
            variant: "destructive",
          });
        } else if (msg.includes("Invalid approval flow")) {
          toast({
            title: "Invalid Action",
            description: "This PO is not in the correct state for your approval level.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Approval Failed",
            description: msg,
            variant: "destructive",
          });
        }
        return { success: false };
      }

      const result = data as ApprovalResult;

      toast({
        title: result?.idempotent ? "Already Approved" : "Approved",
        description: result?.idempotent
          ? "This approval was already processed."
          : `PO ${role === "manager" ? "sent to Director" : "fully approved and locked"}.`,
      });

      return { success: true, idempotent: result?.idempotent };
    } catch (err) {
      toast({
        title: "Error",
        description: "Unexpected error during approval.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Send approval notification email via Brevo.
   */
  const sendApprovalEmail = async (params: {
    poId: string;
    approverEmail: string;
    approverRole: ApprovalRole;
    poNumber?: string;
    poValue?: number;
    vendorName?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-po-approval", {
        body: {
          po_id: params.poId,
          approver_email: params.approverEmail,
          approver_role: params.approverRole,
          po_number: params.poNumber,
          po_value: params.poValue,
          vendor_name: params.vendorName,
        },
      });

      if (error) {
        console.error("Failed to send approval email:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Approval email error:", err);
      return false;
    }
  };

  /**
   * Create PO from auction with frozen intelligence snapshot.
   */
  const createPoFromAuction = async (params: {
    auctionId: string;
    userId: string;
    poValue: number;
    vendorName: string;
    supplierId: string;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase.rpc("create_po_from_auction" as any, {
        p_auction_id: params.auctionId,
        p_user_id: params.userId,
        p_po_value: params.poValue,
        p_vendor_name: params.vendorName,
        p_supplier_id: params.supplierId,
        p_notes: params.notes || null,
      });

      if (error) {
        toast({
          title: "PO Creation Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "PO Created",
        description: "Purchase order created and sent for manager approval.",
      });

      return data as { success: boolean; po_id: string; po_number: string };
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create PO from auction.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    approvePo,
    sendApprovalEmail,
    createPoFromAuction,
    isApproving,
  };
}

/**
 * Maps approval_status to display labels.
 */
export const APPROVAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-muted-foreground" },
  pending_manager: { label: "Awaiting Manager Approval", color: "text-amber-600" },
  pending_director: { label: "Awaiting Director Approval", color: "text-orange-600" },
  approved: { label: "Approved — Locked", color: "text-emerald-600" },
  rejected: { label: "Rejected", color: "text-destructive" },
};
