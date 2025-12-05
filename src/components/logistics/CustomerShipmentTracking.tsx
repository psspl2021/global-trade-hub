import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, CheckCircle2, Circle, AlertCircle, Truck } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface ShipmentUpdate {
  id: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

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
  };
}

interface CustomerShipmentTrackingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CustomerShipmentTracking({ open, onOpenChange, userId }: CustomerShipmentTrackingProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [updates, setUpdates] = useState<ShipmentUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          *,
          requirement:logistics_requirements(
            title, material_type, quantity, unit, 
            pickup_location, delivery_location
          )
        `)
        .eq("customer_id", userId)
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

  const fetchUpdates = async (shipmentId: string) => {
    setLoadingUpdates(true);
    try {
      const { data, error } = await supabase
        .from("shipment_updates")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchShipments();

      // Subscribe to realtime updates
      const shipmentsChannel = supabase
        .channel("customer-shipments")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shipments", filter: `customer_id=eq.${userId}` },
          () => fetchShipments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(shipmentsChannel);
      };
    }
  }, [open, userId]);

  useEffect(() => {
    if (selectedShipment) {
      fetchUpdates(selectedShipment.id);

      // Subscribe to updates for selected shipment
      const updatesChannel = supabase
        .channel(`shipment-updates-${selectedShipment.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "shipment_updates", filter: `shipment_id=eq.${selectedShipment.id}` },
          () => {
            fetchUpdates(selectedShipment.id);
            toast({ title: "Shipment Update", description: "New tracking update available" });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(updatesChannel);
      };
    }
  }, [selectedShipment]);

  const getStatusIcon = (status: string, isComplete: boolean) => {
    if (isComplete) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === "delayed") return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      awaiting_pickup: { label: "Awaiting Pickup", variant: "outline" },
      picked_up: { label: "Picked Up", variant: "secondary" },
      in_transit: { label: "In Transit", variant: "default" },
      at_checkpoint: { label: "At Checkpoint", variant: "secondary" },
      out_for_delivery: { label: "Out for Delivery", variant: "default" },
      delivered: { label: "Delivered", variant: "default" },
      delayed: { label: "Delayed", variant: "destructive" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };
    const cfg = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const statusOrder = ["awaiting_pickup", "picked_up", "in_transit", "at_checkpoint", "out_for_delivery", "delivered"];

  const isStatusComplete = (status: string, currentStatus: string) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const statusIndex = statusOrder.indexOf(status);
    return statusIndex <= currentIndex && statusIndex !== -1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Track Your Shipments
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shipments to track</p>
            <p className="text-sm">Shipments will appear here once your logistics bids are accepted</p>
          </div>
        ) : !selectedShipment ? (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Card 
                key={shipment.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedShipment(shipment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{shipment.requirement?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {shipment.requirement?.pickup_location} → {shipment.requirement?.delivery_location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {shipment.requirement?.quantity} {shipment.requirement?.unit} of {shipment.requirement?.material_type}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(shipment.status)}
                      {shipment.current_location && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <MapPin className="h-3 w-3" />
                          {shipment.current_location}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <button 
              className="text-sm text-primary hover:underline mb-4"
              onClick={() => setSelectedShipment(null)}
            >
              ← Back to all shipments
            </button>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedShipment.requirement?.title}</CardTitle>
                  {getStatusBadge(selectedShipment.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span>From: {selectedShipment.requirement?.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>To: {selectedShipment.requirement?.delivery_location}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-4">Tracking Timeline</h4>
                
                {loadingUpdates ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <div className="relative">
                    {/* Default stages */}
                    <div className="space-y-4">
                      {/* Bid Accepted */}
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <div className="w-0.5 h-full bg-green-500 mt-1" />
                        </div>
                        <div className="pb-4">
                          <p className="font-medium">Bid Accepted</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(selectedShipment.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>

                      {/* Updates from database */}
                      {updates.map((update, index) => (
                        <div key={update.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            {getStatusIcon(update.status, true)}
                            {index < updates.length - 1 && (
                              <div className="w-0.5 h-full bg-green-500 mt-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="font-medium capitalize">{update.status.replace(/_/g, " ")}</p>
                            {update.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {update.location}
                              </p>
                            )}
                            {update.notes && (
                              <p className="text-sm text-muted-foreground">{update.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(update.created_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Awaiting next update */}
                      {selectedShipment.status !== "delivered" && selectedShipment.status !== "cancelled" && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <Circle className="h-5 w-5 text-muted-foreground animate-pulse" />
                          </div>
                          <div>
                            <p className="text-muted-foreground">Awaiting next update...</p>
                            {selectedShipment.estimated_delivery && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ETA: {format(new Date(selectedShipment.estimated_delivery), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivered */}
                      {selectedShipment.status === "delivered" && selectedShipment.delivered_at && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-green-600">Delivered</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(selectedShipment.delivered_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
