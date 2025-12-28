import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Calendar, Package, Truck, ArrowRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface LogisticsRequirement {
  id: string;
  title: string;
  material_type: string;
  material_description: string | null;
  quantity: number;
  unit: string;
  pickup_location: string;
  delivery_location: string;
  pickup_date: string;
  delivery_deadline: string;
  vehicle_type_preference: string | null;
  special_requirements: string | null;
  budget_max: number | null;
  status: string;
  created_at: string;
}

interface BrowseLogisticsPublicProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BrowseLogisticsPublic = ({ open, onOpenChange }: BrowseLogisticsPublicProps) => {
  const [requirements, setRequirements] = useState<LogisticsRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const navigate = useNavigate();

  const fetchRequirements = async () => {
    setLoading(true);
    
    let query = (supabase.from('logistics_requirements') as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const { data, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching logistics requirements:', error);
    } else {
      setRequirements(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchRequirements();
    }
  }, [open, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVehicleTypeLabel = (type: string | null) => {
    if (!type) return null;
    const labels: Record<string, string> = {
      'open_truck': 'Open Truck',
      'closed_container': 'Closed Container',
      'trailer': 'Trailer',
      'tanker': 'Tanker',
      'tipper': 'Tipper',
      'flatbed': 'Flatbed'
    };
    return labels[type] || type;
  };

  const activeCount = requirements.filter(r => r.status === 'active').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Live Logistics Requirements
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active ({activeCount})</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requirements.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No logistics requirements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requirements.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{req.title}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{req.material_type}</Badge>
                        {req.vehicle_type_preference && (
                          <Badge variant="secondary">{getVehicleTypeLabel(req.vehicle_type_preference)}</Badge>
                        )}
                      </div>

                      {req.material_description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {req.material_description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {req.quantity} {req.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-success" />
                          {req.pickup_location}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-destructive" />
                          {req.delivery_location}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Pickup: {format(new Date(req.pickup_date), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Delivery: {format(new Date(req.delivery_deadline), 'MMM dd, yyyy')}
                        </span>
                        {req.budget_max && (
                          <span className="font-medium text-foreground">
                            Budget: ₹{req.budget_max.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          navigate('/signup?role=logistics');
                        }}
                        disabled={req.status !== 'active'}
                      >
                        Quote Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to bid on logistics requirements? Join as a logistics partner!
          </p>
          <Button onClick={() => {
            onOpenChange(false);
            navigate('/signup?role=logistics');
          }}>
            <Truck className="h-4 w-4 mr-2" />
            Join as Logistics Partner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrowseLogisticsPublic;
