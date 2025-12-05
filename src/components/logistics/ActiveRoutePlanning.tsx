import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route, MapPin, Navigation, Calendar, Truck, Package, Clock } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface Shipment {
  id: string;
  status: string;
  current_location: string | null;
  pickup_time: string | null;
  estimated_delivery: string | null;
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

interface ActiveRoutePlanningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ActiveRoutePlanning({ open, onOpenChange, userId }: ActiveRoutePlanningProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast({ title: "Error", description: "Failed to load routes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchShipments();
    }
  }, [open, userId]);

  const categorizeShipments = () => {
    const pendingPickup = shipments.filter(s => s.status === "awaiting_pickup");
    const inTransit = shipments.filter(s => ["picked_up", "in_transit", "at_checkpoint", "out_for_delivery"].includes(s.status));
    const delayed = shipments.filter(s => s.status === "delayed");
    
    const dueToday = shipments.filter(s => {
      const deadline = s.requirement?.delivery_deadline;
      return deadline && isToday(new Date(deadline));
    });

    const dueTomorrow = shipments.filter(s => {
      const deadline = s.requirement?.delivery_deadline;
      return deadline && isTomorrow(new Date(deadline));
    });

    const overdue = shipments.filter(s => {
      const deadline = s.requirement?.delivery_deadline;
      return deadline && isPast(new Date(deadline)) && !["delivered", "cancelled"].includes(s.status);
    });

    return { pendingPickup, inTransit, delayed, dueToday, dueTomorrow, overdue };
  };

  const categories = categorizeShipments();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      awaiting_pickup: "bg-yellow-500",
      picked_up: "bg-blue-500",
      in_transit: "bg-green-500",
      at_checkpoint: "bg-purple-500",
      out_for_delivery: "bg-cyan-500",
      delayed: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const renderShipmentCard = (shipment: Shipment) => (
    <Card key={shipment.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(shipment.status)}`} />
              <span className="font-medium">{shipment.requirement?.title}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-green-500" />
                {shipment.requirement?.pickup_location}
              </div>
              <span>→</span>
              <div className="flex items-center gap-1">
                <Navigation className="h-3 w-3 text-red-500" />
                {shipment.requirement?.delivery_location}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {shipment.requirement?.quantity} {shipment.requirement?.unit}
              </div>
              {shipment.vehicle && (
                <div className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {shipment.vehicle.registration_number}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Deadline: {shipment.requirement?.delivery_deadline ? format(new Date(shipment.requirement.delivery_deadline), "MMM d") : "N/A"}
              </div>
            </div>
          </div>
          <Badge variant={shipment.status === "delayed" ? "destructive" : "secondary"}>
            {shipment.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Active Route Planning
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active routes</p>
            <p className="text-sm">Your accepted shipments will appear here</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="bg-yellow-500/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{categories.pendingPickup.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Pickup</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{categories.inTransit.length}</p>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{categories.dueToday.length}</p>
                  <p className="text-xs text-muted-foreground">Due Today</p>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{categories.overdue.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({shipments.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({categories.pendingPickup.length})</TabsTrigger>
                <TabsTrigger value="transit">In Transit ({categories.inTransit.length})</TabsTrigger>
                <TabsTrigger value="urgent">Urgent ({categories.dueToday.length + categories.overdue.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {shipments.map(renderShipmentCard)}
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                {categories.pendingPickup.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No pending pickups</p>
                ) : (
                  categories.pendingPickup.map(renderShipmentCard)
                )}
              </TabsContent>

              <TabsContent value="transit" className="mt-4">
                {categories.inTransit.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No shipments in transit</p>
                ) : (
                  categories.inTransit.map(renderShipmentCard)
                )}
              </TabsContent>

              <TabsContent value="urgent" className="mt-4">
                {categories.overdue.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Overdue
                    </h4>
                    {categories.overdue.map(renderShipmentCard)}
                  </div>
                )}
                {categories.dueToday.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-500 mb-2 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due Today
                    </h4>
                    {categories.dueToday.map(renderShipmentCard)}
                  </div>
                )}
                {categories.overdue.length === 0 && categories.dueToday.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No urgent shipments</p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
