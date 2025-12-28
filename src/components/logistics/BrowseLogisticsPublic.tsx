import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, MapPin, Calendar, Package, Truck, ArrowLeft, Filter, Share2, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<LogisticsRequirement | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async (req: LogisticsRequirement) => {
    const shareUrl = `${window.location.origin}/book-truck?ref=${req.id}`;
    const shareText = `Transport Requirement: ${req.title}\n${req.quantity} ${req.unit} from ${req.pickup_location} to ${req.delivery_location}\nPickup: ${format(new Date(req.pickup_date), 'MMM dd, yyyy')}\n\nQuote now on ProcureSaathi!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transport: ${req.title}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedId(req.id);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyLink = async (req: LogisticsRequirement) => {
    const shareUrl = `${window.location.origin}/book-truck?ref=${req.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedId(req.id);
    toast({
      title: "Link copied!",
      description: "Direct link copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      setSelectedRequirement(null);
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

  // Detail View
  if (selectedRequirement) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Live Logistics Requirements
            </DialogTitle>
          </DialogHeader>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedRequirement(null)}
            className="w-fit"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>

          <Card className="border-2">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedRequirement.title}</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-primary text-primary-foreground">{selectedRequirement.material_type}</Badge>
                {selectedRequirement.vehicle_type_preference && (
                  <Badge variant="outline">{getVehicleTypeLabel(selectedRequirement.vehicle_type_preference)}</Badge>
                )}
              </div>

              {selectedRequirement.material_description && (
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {selectedRequirement.material_description}
                </p>
              )}

              {selectedRequirement.special_requirements && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Special Requirements:</h4>
                  <p className="text-muted-foreground">{selectedRequirement.special_requirements}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="font-semibold">Quantity: </span>
                  <span>{selectedRequirement.quantity} {selectedRequirement.unit}</span>
                </div>
                <div>
                  <span className="font-semibold">Budget: </span>
                  <span>{selectedRequirement.budget_max ? `₹${selectedRequirement.budget_max.toLocaleString()}` : 'Not specified'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-success" />
                  <div>
                    <span className="font-semibold">Pickup: </span>
                    <span>{selectedRequirement.pickup_location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-destructive" />
                  <div>
                    <span className="font-semibold">Delivery: </span>
                    <span>{selectedRequirement.delivery_location}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">Pickup Date: </span>
                  <span>{format(new Date(selectedRequirement.pickup_date), 'MMMM do, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">Delivery By: </span>
                  <span>{format(new Date(selectedRequirement.delivery_deadline), 'MMMM do, yyyy')}</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Sign up as a logistics partner to quote on this requirement
                </p>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/signup?role=logistics');
                  }}
                  disabled={selectedRequirement.status !== 'active'}
                >
                  Sign Up to Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // List View
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
              <Card 
                key={req.id} 
                className="hover:shadow-md transition-shadow cursor-pointer border"
                onClick={() => setSelectedRequirement(req)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{req.title}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-primary text-primary-foreground">{req.material_type}</Badge>
                        {req.vehicle_type_preference && (
                          <Badge variant="outline">{getVehicleTypeLabel(req.vehicle_type_preference)}</Badge>
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
                        <span className="mx-1">→</span>
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
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {copiedId === req.id ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Share2 className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover z-50">
                          <DropdownMenuItem onClick={() => handleShare(req)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(req)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequirement(req)}
                      >
                        View & Quote
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
