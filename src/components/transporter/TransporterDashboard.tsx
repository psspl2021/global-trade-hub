/**
 * Global Fleet Transportation Dashboard — Logistics command center
 * Shows freight requests, active shipments, and delivery tracking
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/currency';

interface LogisticsRequest {
  id: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  cargo_type: string | null;
  cargo_description: string | null;
  weight_tons: number | null;
  vehicle_type: string | null;
  shipment_mode: string | null;
  pickup_date: string | null;
  delivery_deadline: string | null;
  budget_amount: number | null;
  currency: string;
  status: string;
  created_at: string;
}

export function TransporterDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LogisticsRequest[]>([]);
  const [activeShipments, setActiveShipments] = useState<LogisticsRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // Fetch available requests (pending)
        const { data: pendingData } = await supabase
          .from('logistics_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20) as any;

        // Fetch my active shipments
        const { data: activeData } = await supabase
          .from('logistics_requests')
          .select('*')
          .eq('transporter_id', user.id)
          .in('status', ['assigned', 'in_transit', 'picked_up'])
          .order('created_at', { ascending: false }) as any;

        setRequests(pendingData || []);
        setActiveShipments(activeData || []);
      } catch (err) {
        console.error('[TransporterDashboard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Open</Badge>;
      case 'assigned': return <Badge className="bg-blue-100 text-blue-700">Assigned</Badge>;
      case 'picked_up': return <Badge className="bg-amber-100 text-amber-700">Picked Up</Badge>;
      case 'in_transit': return <Badge className="bg-primary/10 text-primary">In Transit</Badge>;
      case 'delivered': return <Badge className="bg-emerald-100 text-emerald-700">Delivered</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModeIcon = (mode: string | null) => {
    switch (mode) {
      case 'sea': return '🚢';
      case 'air': return '✈️';
      case 'rail': return '🚂';
      default: return '🚛';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-xs text-muted-foreground">Open Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{activeShipments.length}</p>
            <p className="text-xs text-muted-foreground">Active Shipments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Pending Pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Shipments */}
      {activeShipments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Active Shipments
          </h3>
          <div className="space-y-3">
            {activeShipments.map(shipment => (
              <Card key={shipment.id} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{getModeIcon(shipment.shipment_mode)}</span>
                      <span className="font-medium">{shipment.cargo_type || 'General Cargo'}</span>
                    </div>
                    {getStatusBadge(shipment.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{shipment.origin_city} → {shipment.destination_city}</span>
                  </div>
                  {shipment.weight_tons && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Weight: {shipment.weight_tons} MT
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Freight Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Freight Requests
        </h3>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
              <p>No open freight requests right now.</p>
              <p className="text-sm">New requests will appear here as buyers post them.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{getModeIcon(req.shipment_mode)}</span>
                      <span className="font-medium">{req.cargo_type || 'General Cargo'}</span>
                    </div>
                    {req.budget_amount && (
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(req.budget_amount, req.currency)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{req.origin_city}, {req.origin_country} → {req.destination_city}, {req.destination_country}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {req.weight_tons && <span>📦 {req.weight_tons} MT</span>}
                      {req.pickup_date && <span>📅 Pickup: {new Date(req.pickup_date).toLocaleDateString()}</span>}
                    </div>
                    <Button size="sm" variant="outline">
                      Express Interest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TransporterDashboard;
