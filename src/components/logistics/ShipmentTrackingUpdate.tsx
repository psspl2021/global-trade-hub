import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ShipmentTrackingUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: {
    id: string;
    status: string;
    current_location: string | null;
    requirement: {
      pickup_location: string;
      delivery_location: string;
    };
  };
  onSuccess: () => void;
}

const statusOptions = [
  { value: "awaiting_pickup", label: "Awaiting Pickup" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "at_checkpoint", label: "At Checkpoint" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
];

export function ShipmentTrackingUpdate({ open, onOpenChange, shipment, onSuccess }: ShipmentTrackingUpdateProps) {
  const [status, setStatus] = useState(shipment.status);
  const [location, setLocation] = useState(shipment.current_location || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!status) {
      toast({ title: "Error", description: "Please select a status", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("shipment_updates").insert({
        shipment_id: shipment.id,
        status: status as any,
        location: location || null,
        notes: notes || null,
        updated_by: user.id,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Shipment status updated successfully" });
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setNotes("");
    } catch (error: any) {
      console.error("Error updating shipment:", error);
      toast({ title: "Error", description: error.message || "Failed to update shipment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getNextStatusSuggestion = (currentStatus: string): string => {
    const statusFlow: Record<string, string> = {
      awaiting_pickup: "picked_up",
      picked_up: "in_transit",
      in_transit: "out_for_delivery",
      at_checkpoint: "in_transit",
      out_for_delivery: "delivered",
    };
    return statusFlow[currentStatus] || currentStatus;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Update Shipment Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route:</span>
              <span className="font-medium">
                {shipment.requirement?.pickup_location} → {shipment.requirement?.delivery_location}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {shipment.status !== "delivered" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setStatus(getNextStatusSuggestion(shipment.status))}
              >
                Suggest: {statusOptions.find(s => s.value === getNextStatusSuggestion(shipment.status))?.label}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="h-4 w-4 inline mr-1" />
              Current Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Jaipur Checkpoint, NH-48"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
