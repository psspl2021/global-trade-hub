/**
 * ============================================================
 * LANE AUCTION PANEL (ADMIN)
 * ============================================================
 * 
 * Dynamic monetisation via lane auctions:
 * - High-intent lanes (≥8) enter auction
 * - Suppliers bid for exclusive slots
 * - Top 3 suppliers win access
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Gavel, 
  Loader2,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Trophy,
  IndianRupee
} from 'lucide-react';
import { toast } from 'sonner';
import { getMappedCategories } from '@/data/categorySubcategoryMap';
import { countries } from '@/data/countries';

interface LaneAuction {
  id: string;
  category: string;
  country: string;
  intent_threshold: number;
  auction_status: string;
  max_slots: number;
  auction_start_at: string;
  auction_end_at: string;
  winning_suppliers: string[] | null;
  created_at: string;
}

interface AuctionBid {
  id: string;
  auction_id: string;
  supplier_id: string;
  bid_amount: number;
  bid_tier: string | null;
  bid_status: string;
  created_at: string;
}

export function LaneAuctionPanel() {
  const [auctions, setAuctions] = useState<LaneAuction[]>([]);
  const [selectedAuctionBids, setSelectedAuctionBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBids, setLoadingBids] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBidsDialog, setShowBidsDialog] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<LaneAuction | null>(null);
  
  // Create form state
  const [newCategory, setNewCategory] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newThreshold, setNewThreshold] = useState(8);
  const [newDuration, setNewDuration] = useState(48);
  const [creating, setCreating] = useState(false);

  const categories = getMappedCategories();
  const countryOptions = countries.map(c => ({ value: c.name, label: c.name }));

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lane_auctions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuctions((data || []) as LaneAuction[]);
    } catch (err) {
      console.error('[LaneAuctionPanel] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBids = useCallback(async (auctionId: string) => {
    setLoadingBids(true);
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      setSelectedAuctionBids((data || []) as AuctionBid[]);
    } catch (err) {
      console.error('[LaneAuctionPanel] Bids error:', err);
    } finally {
      setLoadingBids(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const createAuction = async () => {
    if (!newCategory || !newCountry) {
      toast.error('Please select category and country');
      return;
    }
    
    setCreating(true);
    try {
      const auctionEnd = new Date();
      auctionEnd.setHours(auctionEnd.getHours() + newDuration);
      
      const { error } = await supabase
        .from('lane_auctions')
        .insert({
          category: newCategory,
          country: newCountry,
          intent_threshold: newThreshold,
          auction_end_at: auctionEnd.toISOString()
        });

      if (error) throw error;
      toast.success('Lane auction created!');
      setShowCreateDialog(false);
      setNewCategory('');
      setNewCountry('');
      fetchAuctions();
    } catch (err) {
      console.error('[LaneAuctionPanel] Create error:', err);
      toast.error('Failed to create auction');
    } finally {
      setCreating(false);
    }
  };

  const closeAuction = async (auctionId: string) => {
    try {
      // Get top 3 bids
      const { data: topBids } = await supabase
        .from('auction_bids')
        .select('supplier_id')
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false })
        .limit(3);

      const winners = topBids?.map(b => b.supplier_id) || [];

      const { error } = await supabase
        .from('lane_auctions')
        .update({
          auction_status: 'awarded',
          winning_suppliers: winners,
          updated_at: new Date().toISOString()
        })
        .eq('id', auctionId);

      if (error) throw error;
      
      // Mark winning bids as accepted
      if (winners.length > 0) {
        await supabase
          .from('auction_bids')
          .update({ bid_status: 'accepted' })
          .eq('auction_id', auctionId)
          .in('supplier_id', winners);
        
        // Mark others as outbid
        await supabase
          .from('auction_bids')
          .update({ bid_status: 'outbid' })
          .eq('auction_id', auctionId)
          .not('supplier_id', 'in', `(${winners.join(',')})`);
      }

      toast.success(`Auction closed! ${winners.length} winners`);
      fetchAuctions();
    } catch (err) {
      console.error('[LaneAuctionPanel] Close error:', err);
      toast.error('Failed to close auction');
    }
  };

  const viewBids = async (auction: LaneAuction) => {
    setSelectedAuction(auction);
    setShowBidsDialog(true);
    await fetchBids(auction.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800"><Clock className="h-3 w-3 mr-1" />Open</Badge>;
      case 'awarded':
        return <Badge className="bg-purple-100 text-purple-800"><Trophy className="h-3 w-3 mr-1" />Awarded</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTimeRemaining = (endAt: string) => {
    const end = new Date(endAt);
    const now = new Date();
    const hours = Math.max(0, Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  // Summary stats
  const openAuctions = auctions.filter(a => a.auction_status === 'open').length;
  const awardedAuctions = auctions.filter(a => a.auction_status === 'awarded').length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Lane Auctions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Exclusive supplier slots for high-intent demand lanes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAuctions} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Auction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-1">Open Auctions</div>
              <div className="text-2xl font-bold text-green-800">{openAuctions}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-sm font-medium text-purple-700 mb-1">Awarded</div>
              <div className="text-2xl font-bold text-purple-800">{awardedAuctions}</div>
            </div>
          </div>

          {/* Auctions Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gavel className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No lane auctions created yet</p>
              <p className="text-sm mt-1">Create an auction for high-intent demand lanes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-center">Intent Threshold</TableHead>
                  <TableHead className="text-center">Max Slots</TableHead>
                  <TableHead className="text-center">Time Left</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Winners</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auctions.map((auction) => (
                  <TableRow key={auction.id}>
                    <TableCell className="font-medium">{auction.category}</TableCell>
                    <TableCell>{auction.country}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">≥ {auction.intent_threshold}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{auction.max_slots}</TableCell>
                    <TableCell className="text-center">
                      {auction.auction_status === 'open' ? (
                        <span className="text-amber-600 font-medium">
                          {getTimeRemaining(auction.auction_end_at)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(auction.auction_status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {auction.winning_suppliers?.length || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => viewBids(auction)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {auction.auction_status === 'open' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => closeAuction(auction.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Auction Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Lane Auction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Country</Label>
              <Select value={newCountry} onValueChange={setNewCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intent Threshold</Label>
              <Input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                min={5}
                max={10}
              />
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Select value={String(newDuration)} onValueChange={(v) => setNewDuration(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createAuction} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bids Dialog */}
      <Dialog open={showBidsDialog} onOpenChange={setShowBidsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bids for {selectedAuction?.category} - {selectedAuction?.country}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingBids ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : selectedAuctionBids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No bids yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Supplier ID</TableHead>
                    <TableHead className="text-center">Bid Amount</TableHead>
                    <TableHead className="text-center">Tier</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAuctionBids.map((bid, idx) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        {idx < 3 ? (
                          <Trophy className={`h-5 w-5 ${
                            idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        ) : (
                          <span className="text-muted-foreground">{idx + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {bid.supplier_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          <span className="font-medium">{bid.bid_amount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{bid.bid_tier || 'premium'}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={
                          bid.bid_status === 'accepted' ? 'bg-green-100 text-green-800' :
                          bid.bid_status === 'outbid' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }>
                          {bid.bid_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LaneAuctionPanel;
