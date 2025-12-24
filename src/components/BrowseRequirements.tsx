import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Calendar, MapPin, Building2, Star, Share2, Copy, Check, Filter, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { maskCompanyName } from '@/lib/utils';
import { BidFormInvoice, BidFormInvoiceData } from '@/components/BidFormInvoice';

interface Requirement {
  id: string;
  title: string;
  description: string;
  product_category: string;
  trade_type?: 'import' | 'export' | 'domestic_india';
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string;
  delivery_location: string;
  status: string;
  created_at: string;
  buyer_profile?: {
    company_name: string;
  };
}

interface RequirementItem {
  id: string;
  item_name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
}

// Helper function to get service fee rate based on trade type (standard rate)
const getServiceFeeRate = (tradeType: string | undefined) => {
  return tradeType === 'domestic_india' ? 0.005 : 0.01; // 0.5% for domestic, 1% for import/export
};

// Premium bid fee rate (same as domestic)
const PREMIUM_FEE_RATE = 0.005; // 0.5%

const getTradeTypeLabel = (tradeType: string | undefined) => {
  switch (tradeType) {
    case 'import': return 'Import';
    case 'export': return 'Export';
    case 'domestic_india': return 'Domestic India';
    default: return 'Domestic India';
  }
};

interface MyBidDetails {
  id: string;
  bid_amount: number;
  service_fee: number;
  total_amount: number;
  delivery_timeline_days: number;
  terms_and_conditions: string | null;
}

interface ItemBid {
  unitPrice: number;
  quantity: number;
}

interface BrowseRequirementsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export const BrowseRequirements = ({ open, onOpenChange, userId }: BrowseRequirementsProps) => {
  const isGuest = !userId;
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [lowestBids, setLowestBids] = useState<Record<string, number>>({});
  const [lowestRates, setLowestRates] = useState<Record<string, number>>({});
  const [myBids, setMyBids] = useState<Set<string>>(new Set());
  const [myBidDetails, setMyBidDetails] = useState<Record<string, MyBidDetails>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [lineItems, setLineItems] = useState<RequirementItem[]>([]);
  const [itemBids, setItemBids] = useState<Record<string, ItemBid>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [subscription, setSubscription] = useState<{ 
    bids_used_this_month: number; 
    bids_limit: number; 
    id: string;
    premium_bids_balance: number;
  } | null>(null);
  const { toast } = useToast();

  // Get unique categories from requirements for the filter
  const availableCategories = useMemo(() => {
    const categories = [...new Set(requirements.map(r => r.product_category))];
    return categories.sort();
  }, [requirements]);

  // Filter requirements based on selected category and status
  const filteredRequirements = useMemo(() => {
    return requirements.filter(r => {
      const matchesCategory = categoryFilter === 'all' || r.product_category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [requirements, categoryFilter, statusFilter]);

  const handleShare = (e: React.MouseEvent, req: Requirement, platform: 'whatsapp' | 'linkedin' | 'copy') => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/requirements?rfq=${req.id}`;
    const shareText = `Check out this RFQ: ${req.title} - ${req.quantity} ${req.unit} | ${req.product_category} | Deadline: ${format(new Date(req.deadline), 'PP')}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setCopiedId(req.id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({ title: 'Copied!', description: 'Link copied to clipboard' });
        break;
    }
  };

  const BID_FEE = 500; // Rs.500 per bid after free limit
  
  // Priority: premium_bids_balance -> monthly bids -> paid bid
  const hasPremiumBids = subscription && subscription.premium_bids_balance > 0;
  const hasFreeBidsRemaining = subscription && subscription.bids_used_this_month < subscription.bids_limit;
  const isPaidBid = subscription && !hasPremiumBids && !hasFreeBidsRemaining;
  const isUsingPremiumBid = hasPremiumBids;

  // Initialize item bids when line items are fetched
  useEffect(() => {
    if (lineItems.length > 0) {
      const initial: Record<string, ItemBid> = {};
      lineItems.forEach(item => {
        initial[item.id] = { unitPrice: 0, quantity: item.quantity };
      });
      setItemBids(initial);
    } else {
      setItemBids({});
    }
  }, [lineItems]);

  // Calculate totals from line item bids
  const calculateItemTotals = () => {
    let subtotal = 0;
    lineItems.forEach(item => {
      const bid = itemBids[item.id];
      if (bid?.unitPrice) {
        subtotal += bid.unitPrice * item.quantity;
      }
    });
    // Use premium rate if using premium bids
    const currentFeeRate = isUsingPremiumBid ? PREMIUM_FEE_RATE : getServiceFeeRate(selectedRequirement?.trade_type);
    const serviceFee = subtotal * currentFeeRate;
    return { subtotal, serviceFee, total: subtotal + serviceFee, feeRate: currentFeeRate };
  };

  const hasLineItems = lineItems.length > 0;
  const allItemsBidded = hasLineItems && lineItems.every(item => itemBids[item.id]?.unitPrice > 0);

  const fetchRequirements = async () => {
    setLoading(true);
    
    // First, trigger auto-expire for any stale active requirements
    await supabase.rpc('auto_expire_requirements');
    
    // Fetch all requirements (not just active) for filtering
    const { data: reqData, error: reqError } = await supabase
      .from('requirements')
      .select('*')
      .in('status', ['active', 'expired', 'awarded'])
      .order('created_at', { ascending: false });

    if (reqError) {
      toast({ title: 'Error', description: 'Failed to load requirements', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch buyer profiles for the requirements
    if (reqData && reqData.length > 0) {
      const buyerIds = [...new Set(reqData.map(r => r.buyer_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', buyerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const reqsWithProfiles = reqData.map(req => ({
        ...req,
        buyer_profile: profilesMap.get(req.buyer_id) || undefined
      }));
      
      setRequirements(reqsWithProfiles as Requirement[]);
    } else {
      setRequirements([]);
    }

    // Fetch my existing bids with details (only for logged-in users)
    if (userId) {
      const { data: myBidsData } = await supabase
        .from('bids')
        .select('id, requirement_id, bid_amount, service_fee, total_amount, delivery_timeline_days, terms_and_conditions')
        .eq('supplier_id', userId);

      if (myBidsData) {
        setMyBids(new Set(myBidsData.map(b => b.requirement_id)));
        const detailsMap: Record<string, MyBidDetails> = {};
        myBidsData.forEach(b => {
          detailsMap[b.requirement_id] = {
            id: b.id,
            bid_amount: b.bid_amount,
            service_fee: b.service_fee,
            total_amount: b.total_amount,
            delivery_timeline_days: b.delivery_timeline_days,
            terms_and_conditions: b.terms_and_conditions,
          };
        });
        setMyBidDetails(detailsMap);
      }
    }

    // Fetch lowest bids for each requirement using secure RPC function
    if (reqData && reqData.length > 0) {
      const lowestByReq: Record<string, number> = {};
      const lowestRateByReq: Record<string, number> = {};
      
      for (const req of reqData) {
        const { data } = await supabase.rpc('get_lowest_bid_for_requirement', { req_id: req.id });
        if (data && data[0]?.lowest_bid_amount) {
          lowestByReq[req.id] = data[0].lowest_bid_amount;
          lowestRateByReq[req.id] = data[0].lowest_bid_amount;
        }
      }
      
      setLowestBids(lowestByReq);
      setLowestRates(lowestRateByReq);
    }

    setLoading(false);
  };

  const fetchSubscription = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('id, bids_used_this_month, bids_limit, premium_bids_balance')
      .eq('user_id', userId)
      .maybeSingle();
    setSubscription(data);
  };

  const fetchLineItems = async (requirementId: string) => {
    const { data, error } = await supabase
      .from('requirement_items')
      .select('*')
      .eq('requirement_id', requirementId);
    
    if (data && !error) {
      setLineItems(data as RequirementItem[]);
    } else {
      setLineItems([]);
    }
  };

  const handleSelectRequirement = (req: Requirement) => {
    setSelectedRequirement(req);
    fetchLineItems(req.id);
  };

  useEffect(() => {
    if (open) {
      fetchRequirements();
      if (userId) fetchSubscription();
    }
  }, [open, userId]);

  const handleBidSubmit = async (data: BidFormInvoiceData) => {
    if (!selectedRequirement || !subscription) return;

    setSubmitting(true);
    try {
      // Determine fee rate
      const standardFeeRate = getServiceFeeRate(selectedRequirement.trade_type);
      const feeRate = isUsingPremiumBid ? 0.003 : standardFeeRate;
      
      // Use the grand total from the invoice form as the total order value
      const totalOrderValue = data.grandTotal;
      const serviceFee = totalOrderValue * feeRate;
      const totalAmount = totalOrderValue + serviceFee;
      const bidAmountToStore = data.rate * (1 + feeRate);

      // Build terms string with all bid details
      let termsString = '';
      if (data.hsnCode) termsString += `HSN Code: ${data.hsnCode}\n`;
      termsString += `GST Rate: ${data.gstRate}%\n`;
      termsString += `GST Type: ${data.gstType === 'inter' ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}\n`;
      if (data.discountPercent > 0) termsString += `Discount: ${data.discountPercent}%\n`;
      if (data.additionalCharges.length > 0) {
        termsString += 'Additional Charges:\n';
        data.additionalCharges.forEach(charge => {
          if (charge.description && charge.amount > 0) {
            termsString += `  - ${charge.description}: ₹${charge.amount}\n`;
          }
        });
      }
      termsString += `Taxable Value: ₹${data.taxableValue.toLocaleString('en-IN')}\n`;
      termsString += `Total GST: ₹${data.totalGst.toLocaleString('en-IN')}\n`;
      termsString += `Grand Total: ₹${data.grandTotal.toLocaleString('en-IN')}\n`;
      if (data.termsAndConditions) termsString += `\nTerms: ${data.termsAndConditions}`;

      // Insert bid
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert({
          requirement_id: selectedRequirement.id,
          supplier_id: userId,
          bid_amount: bidAmountToStore,
          service_fee: serviceFee,
          total_amount: totalAmount,
          delivery_timeline_days: data.deliveryDays,
          terms_and_conditions: termsString.trim() || null,
          is_paid_bid: isPaidBid ? true : false,
        })
        .select('id')
        .single();

      if (bidError) throw bidError;

      // Update subscription based on bid type
      if (isUsingPremiumBid) {
        await supabase
          .from('subscriptions')
          .update({ premium_bids_balance: subscription.premium_bids_balance - 1 })
          .eq('id', subscription.id);
      } else if (hasFreeBidsRemaining) {
        await supabase
          .from('subscriptions')
          .update({ bids_used_this_month: subscription.bids_used_this_month + 1 })
          .eq('id', subscription.id);
      }

      let bidCostMsg = '';
      if (isUsingPremiumBid) {
        bidCostMsg = ' (Used 1 premium bid)';
      } else if (isPaidBid) {
        bidCostMsg = ` (Bid fee: ₹${BID_FEE})`;
      }
      toast({ title: 'Success', description: `Bid submitted successfully!${bidCostMsg}` });
      setSelectedRequirement(null);
      setLineItems([]);
      setItemBids({});
      fetchRequirements();
      fetchSubscription();
    } catch (error: any) {
      if (error.message?.includes('bids_requirement_id_supplier_id_key') || error.code === '23505') {
        toast({ 
          title: 'Bid Already Exists', 
          description: 'You have already submitted a bid for this requirement.', 
          variant: 'destructive' 
        });
        fetchRequirements();
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    }
    setSubmitting(false);
  };

  const handleBidUpdate = async (data: BidFormInvoiceData) => {
    if (!selectedRequirement) return;
    
    const myBid = myBidDetails[selectedRequirement.id];
    if (!myBid) return;

    setSubmitting(true);
    try {
      const feeRate = getServiceFeeRate(selectedRequirement.trade_type);
      const totalOrderValue = data.grandTotal;
      const serviceFee = totalOrderValue * feeRate;
      const totalAmount = totalOrderValue + serviceFee;
      const bidAmountToStore = data.rate * (1 + feeRate);

      // Build terms string
      let termsString = '';
      if (data.hsnCode) termsString += `HSN Code: ${data.hsnCode}\n`;
      termsString += `GST Rate: ${data.gstRate}%\n`;
      termsString += `GST Type: ${data.gstType === 'inter' ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}\n`;
      if (data.discountPercent > 0) termsString += `Discount: ${data.discountPercent}%\n`;
      if (data.additionalCharges.length > 0) {
        termsString += 'Additional Charges:\n';
        data.additionalCharges.forEach(charge => {
          if (charge.description && charge.amount > 0) {
            termsString += `  - ${charge.description}: ₹${charge.amount}\n`;
          }
        });
      }
      termsString += `Taxable Value: ₹${data.taxableValue.toLocaleString('en-IN')}\n`;
      termsString += `Total GST: ₹${data.totalGst.toLocaleString('en-IN')}\n`;
      termsString += `Grand Total: ₹${data.grandTotal.toLocaleString('en-IN')}\n`;
      if (data.termsAndConditions) termsString += `\nTerms: ${data.termsAndConditions}`;

      const { error } = await supabase
        .from('bids')
        .update({
          bid_amount: bidAmountToStore,
          service_fee: serviceFee,
          total_amount: totalAmount,
          delivery_timeline_days: data.deliveryDays,
          terms_and_conditions: termsString.trim() || null,
        })
        .eq('id', myBid.id)
        .eq('supplier_id', userId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Bid updated successfully!' });
      setIsEditing(false);
      setSelectedRequirement(null);
      setLineItems([]);
      fetchRequirements();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const currentFeeRate = isUsingPremiumBid ? PREMIUM_FEE_RATE : getServiceFeeRate(selectedRequirement?.trade_type);
  const feePercentage = currentFeeRate * 100;

  // For line-item bidding
  const { subtotal: itemSubtotal, serviceFee: itemServiceFee, total: itemTotal, feeRate: itemFeeRate } = calculateItemTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Requirements</DialogTitle>
        </DialogHeader>

        {!selectedRequirement && requirements.length > 0 && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active ({requirements.filter(r => r.status === 'active').length})</SelectItem>
                <SelectItem value="expired">Expired ({requirements.filter(r => r.status === 'expired').length})</SelectItem>
                <SelectItem value="awarded">Awarded ({requirements.filter(r => r.status === 'awarded').length})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories ({requirements.length})</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat} ({requirements.filter(r => r.product_category === cat).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(categoryFilter !== 'all' || statusFilter !== 'active') && (
              <Button variant="ghost" size="sm" onClick={() => { setCategoryFilter('all'); setStatusFilter('active'); }}>
                Clear
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{requirements.length === 0 ? 'No active requirements at the moment.' : 'No requirements match the selected category.'}</p>
          </div>
        ) : selectedRequirement ? (
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => { setSelectedRequirement(null); setLineItems([]); setIsEditing(false); }}>← Back to list</Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedRequirement.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge>{selectedRequirement.product_category}</Badge>
                  {selectedRequirement.trade_type && <Badge variant="outline">{getTradeTypeLabel(selectedRequirement.trade_type)}</Badge>}
                  {selectedRequirement.buyer_profile && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {maskCompanyName(selectedRequirement.buyer_profile.company_name)}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{selectedRequirement.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Quantity:</strong> {Number(selectedRequirement.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {selectedRequirement.unit}</div>
                  <div><strong>Budget:</strong> {selectedRequirement.budget_min && selectedRequirement.budget_max ? `₹${selectedRequirement.budget_min} - ₹${selectedRequirement.budget_max}` : 'Not specified'}</div>
                  <div className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Deadline: {format(new Date(selectedRequirement.deadline), 'PPP')}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedRequirement.delivery_location}</div>
                </div>

                {lowestRates[selectedRequirement.id] && (() => {
                  const feeRate = getServiceFeeRate(selectedRequirement.trade_type);
                  const lowestPerUnit = lowestRates[selectedRequirement.id] / (1 + feeRate);
                  return (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Current L1 Rate: ₹{Math.round(lowestPerUnit).toLocaleString('en-IN')} per {selectedRequirement.unit}
                      </p>
                    </div>
                  );
                })()}

                {isGuest ? (
                  <div className="p-4 bg-primary/10 rounded-lg text-center space-y-3 border-t pt-4">
                    <p className="font-medium">Sign up as a supplier to bid on this requirement</p>
                    <Button 
                      type="button"
                      onClick={() => { 
                        onOpenChange(false); 
                        setTimeout(() => {
                          window.location.href = '/signup?role=supplier'; 
                        }, 100);
                      }}
                    >
                      Sign Up to Bid
                    </Button>
                  </div>
                ) : myBids.has(selectedRequirement.id) && !isEditing ? (
                  (() => {
                    const myBid = myBidDetails[selectedRequirement.id];
                    const feeRate = getServiceFeeRate(selectedRequirement.trade_type);
                    const storedBidAmount = myBid?.bid_amount || 0;
                    const perUnitRate = storedBidAmount / (1 + feeRate);
                    const quantity = selectedRequirement.quantity;
                    const totalOrderValue = perUnitRate * quantity;
                    const lowestL1Rate = lowestRates[selectedRequirement.id];
                    const lowestPerUnit = lowestL1Rate ? lowestL1Rate / (1 + feeRate) : 0;
                    const isL1 = lowestL1Rate && storedBidAmount <= lowestL1Rate;
                    
                    const gstPercent = 18;
                    const gstAmount = totalOrderValue * (gstPercent / 100);
                    const grandTotal = totalOrderValue + gstAmount;
                    
                    return (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium">Your Submitted Bid</h4>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Your Rate:</span>
                              <p className="font-bold text-primary">₹{Math.round(perUnitRate).toLocaleString('en-IN')} per {selectedRequirement.unit}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Delivery:</span>
                              <p className="font-medium">{myBid?.delivery_timeline_days} days</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Order Value:</span>
                              <p className="font-bold text-lg">₹{Math.round(totalOrderValue).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">GST ({gstPercent}%):</span>
                              <p className="font-medium">₹{Math.round(gstAmount).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="col-span-2 border-t pt-2 mt-1">
                              <span className="text-muted-foreground">Grand Total (incl. GST):</span>
                              <p className="font-bold text-xl text-primary">₹{Math.round(grandTotal).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                        
                        {lowestL1Rate && (
                          <div className={`rounded-lg p-3 ${isL1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-orange-500/10 border border-orange-500/30'}`}>
                            {isL1 ? (
                              <p className="text-sm font-medium text-green-600">You have the L1 (lowest) bid!</p>
                            ) : (
                              <div className="text-sm">
                                <p className="font-medium text-orange-600">A lower bid exists</p>
                                <p className="text-muted-foreground mt-1">
                                  L1 Rate: ₹{Math.round(lowestPerUnit).toLocaleString('en-IN')} per {selectedRequirement.unit}
                                </p>
                                <p className="text-orange-600 mt-1">
                                  Your bid is ₹{Math.round(perUnitRate - lowestPerUnit).toLocaleString('en-IN')} higher per {selectedRequirement.unit}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Bid
                        </Button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{isEditing ? 'Update Your Bid' : 'Submit Your Bid'}</h4>
                      {isEditing && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    
                    {/* Per-line-item bidding */}
                    {hasLineItems ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Enter your bid per item:</p>
                        <div className="border rounded-lg divide-y">
                          {lineItems.map((item) => (
                            <div key={item.id} className="p-3 space-y-2">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="font-medium">{item.item_name}</p>
                                  {item.description && <p className="text-muted-foreground text-xs">{item.description}</p>}
                                  <p className="text-xs text-muted-foreground mt-1">{Number(item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {item.unit}</p>
                                  {(item.budget_min || item.budget_max) && (
                                    <p className="text-xs text-muted-foreground">
                                      Budget: {item.budget_min && item.budget_max 
                                        ? `₹${item.budget_min.toLocaleString()} - ₹${item.budget_max.toLocaleString()}`
                                        : item.budget_max 
                                          ? `Up to ₹${item.budget_max.toLocaleString()}`
                                          : `From ₹${item.budget_min?.toLocaleString()}`
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">₹</span>
                                  <Input
                                    type="number"
                                    placeholder="Unit price"
                                    className="w-28"
                                    value={itemBids[item.id]?.unitPrice || ''}
                                    onChange={(e) => setItemBids(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], unitPrice: Number(e.target.value) }
                                    }))}
                                  />
                                  <span className="text-xs text-muted-foreground">/{item.unit}</span>
                                </div>
                              </div>
                              {itemBids[item.id]?.unitPrice > 0 && (
                                <div className="text-right text-sm text-muted-foreground">
                                  Subtotal: ₹{((itemBids[item.id]?.unitPrice || 0) * item.quantity).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {itemSubtotal > 0 && (
                          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                            <div className="flex justify-between font-medium"><span>Total Bid Amount:</span><span>₹{itemSubtotal.toLocaleString()}</span></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Invoice-style bid form for requirements without line items */
                      <BidFormInvoice
                        key={isEditing ? `edit-${selectedRequirement.id}` : `new-${selectedRequirement.id}`}
                        productName={selectedRequirement.title}
                        quantity={selectedRequirement.quantity}
                        unit={selectedRequirement.unit}
                        onSubmit={isEditing ? handleBidUpdate : handleBidSubmit}
                        submitting={submitting}
                        isEditing={isEditing}
                        initialData={isEditing && myBidDetails[selectedRequirement.id] ? {
                          rate: Math.round(myBidDetails[selectedRequirement.id].bid_amount / (1 + getServiceFeeRate(selectedRequirement.trade_type))),
                          deliveryDays: myBidDetails[selectedRequirement.id].delivery_timeline_days,
                          termsAndConditions: myBidDetails[selectedRequirement.id].terms_and_conditions || '',
                        } : undefined}
                      />
                    )}

                    {hasLineItems && (
                      <>
                        {isUsingPremiumBid && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              <strong>Using Premium Bid</strong>
                            </div>
                            <p className="mt-1">Balance after: {(subscription?.premium_bids_balance ?? 1) - 1} bids</p>
                          </div>
                        )}

                        {isPaidBid && (
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400">
                            <strong>Paid Bid:</strong> You've used all {subscription?.bids_limit} free bids this month. 
                            This bid will cost ₹{BID_FEE}.
                          </div>
                        )}

                        <Button 
                          type="button"
                          onClick={() => {
                            // Handle line items bid submission
                            if (!allItemsBidded) return;
                            // This would need a separate handler for line item bids
                          }}
                          disabled={submitting || !allItemsBidded} 
                          className="w-full"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          {isEditing ? 'Update Bid' : (isPaidBid ? `Submit Bid (₹${BID_FEE})` : 'Submit Bid')}
                        </Button>
                        {!allItemsBidded && (
                          <p className="text-xs text-muted-foreground text-center">Please enter a bid for all items</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequirements.map(req => (
              <Card key={req.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleSelectRequirement(req)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{req.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{req.product_category}</Badge>
                        {req.trade_type && <Badge variant="outline">{getTradeTypeLabel(req.trade_type)}</Badge>}
                        {myBids.has(req.id) && <Badge variant="outline">Bid Submitted</Badge>}
                        {req.buyer_profile && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {maskCompanyName(req.buyer_profile.company_name)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{Number(req.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {req.unit}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.delivery_location}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(req.deadline), 'PP')}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {lowestRates[req.id] && (() => {
                        const feeRate = getServiceFeeRate(req.trade_type);
                        const lowestPerUnit = lowestRates[req.id] / (1 + feeRate);
                        return (
                          <p className="text-sm">
                            <span className="text-muted-foreground">L1 Rate: </span>
                            <span className="font-medium">₹{Math.round(lowestPerUnit).toLocaleString('en-IN')}/{req.unit}</span>
                          </p>
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={(e) => handleShare(e, req, 'whatsapp')}>
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleShare(e, req, 'linkedin')}>
                              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleShare(e, req, 'copy')}>
                              {copiedId === req.id ? (
                                <Check className="h-4 w-4 mr-2 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedId === req.id ? 'Copied!' : 'Copy Link'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm">View & Bid</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
