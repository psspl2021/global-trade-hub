import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Calendar, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AcceptedBid {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  created_at: string;
  requirements: {
    id: string;
    title: string;
    quantity: number;
    unit: string;
    delivery_location: string;
    deadline: string;
    product_category: string;
  };
}

interface SupplierAcceptedBidsProps {
  userId: string;
}

export function SupplierAcceptedBids({ userId }: SupplierAcceptedBidsProps) {
  const [acceptedBids, setAcceptedBids] = useState<AcceptedBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcceptedBids();
  }, [userId]);

  const fetchAcceptedBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          id,
          bid_amount,
          service_fee,
          total_amount,
          delivery_timeline_days,
          created_at,
          requirements (
            id,
            title,
            quantity,
            unit,
            delivery_location,
            deadline,
            product_category
          )
        `)
        .eq('supplier_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAcceptedBids(data || []);
    } catch (error: any) {
      console.error('Error fetching accepted bids:', error);
      toast.error('Failed to load accepted bids');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Accepted Bids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Accepted Bids ({acceptedBids.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {acceptedBids.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No accepted bids yet. Keep bidding on requirements!
          </p>
        ) : (
          <div className="space-y-4">
            {acceptedBids.map((bid) => (
              <div
                key={bid.id}
                className="p-4 border rounded-lg bg-success/5 border-success/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{bid.requirements?.title}</h4>
                      <Badge className="bg-success/20 text-success border-success/30">
                        Accepted
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {bid.requirements?.quantity} {bid.requirements?.unit}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {bid.requirements?.delivery_location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {bid.requirements?.deadline ? format(new Date(bid.requirements.deadline), 'MMM d, yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bid Amount:</span>
                        <span className="ml-2 font-medium">₹{bid.bid_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Service Fee:</span>
                        <span className="ml-2">₹{bid.service_fee.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <span className="ml-2 font-bold text-primary">₹{bid.total_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery:</span>
                        <span className="ml-2">{bid.delivery_timeline_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
