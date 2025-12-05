import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, Package, Navigation } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { ShipmentTrackingUpdate } from "./ShipmentTrackingUpdate";

interface Shipment {
  id: string;
  status: string;
  current_location: string | null;
  pickup_time: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  created_at: string;
  requirement: {
    title: string;
    material_type: string;
    quantity: number;
    unit: string;
    pickup_location: string;
    delivery_location: string;
    pickup_date: string;
    delivery_deadline: string;
  };
  vehicle: {
    registration_number: string;
    vehicle_type: string;
  } | null;
}

interface ActiveShipmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ActiveShipments({ open, onOpenChange, userId }: ActiveShipmentsProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          *,
          requirement:logistics_requirements(
            title, material_type, quantity, unit, 
            pickup_location, delivery_location, pickup_date, delivery_deadline
          ),
          vehicle:vehicles(registration_number, vehicle_type)
        `)
        .eq("transporter_id", userId)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast({ title: "Error", description: "Failed to load shipments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchShipments();

      // Subscribe to realtime updates
      const channel = supabase
        .channel("shipments-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shipments", filter: `transporter_id=eq.${userId}` },
          () => fetchShipments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, userId]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      awaiting_pickup: { label: "Awaiting Pickup", variant: "outline" },
      picked_up: { label: "Picked Up", variant: "secondary" },
      in_transit: { label: "In Transit", variant: "default" },
      at_checkpoint: { label: "At Checkpoint", variant: "secondary" },
      out_for_delivery: { label: "Out for Delivery", variant: "default" },
      delayed: { label: "Delayed", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleUpdateClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setUpdateDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Shipments
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active shipments</p>
              <p className="text-sm">Shipments will appear here when your bids are accepted</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <Card key={shipment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{shipment.requirement?.title}</CardTitle>
                      {getStatusBadge(shipment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">From:</span>
                        <span>{shipment.requirement?.pickup_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-red-500" />
                        <span className="text-muted-foreground">To:</span>
                        <span>{shipment.requirement?.delivery_location}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Material:</span>
                        <p className="font-medium">{shipment.requirement?.material_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{shipment.requirement?.quantity} {shipment.requirement?.unit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span>
                        <p className="font-medium">{shipment.vehicle?.registration_number || "Not assigned"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Pickup: {shipment.requirement?.pickup_date ? format(new Date(shipment.requirement.pickup_date), "MMM d") : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Deadline: {shipment.requirement?.delivery_deadline ? format(new Date(shipment.requirement.delivery_deadline), "MMM d") : "N/A"}</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleUpdateClick(shipment)}>
                        <MapPin className="h-4 w-4 mr-1" />
                        Update Status
                      </Button>
                    </div>

                    {shipment.current_location && (
                      <div className="bg-muted/50 rounded p-2 text-sm">
                        <span className="text-muted-foreground">Current Location:</span>{" "}
                        <span className="font-medium">{shipment.current_location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedShipment && (
        <ShipmentTrackingUpdate
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          shipment={selectedShipment}
          onSuccess={fetchShipments}
        />
      )}
    </>
  );
}
