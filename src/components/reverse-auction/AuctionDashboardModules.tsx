/**
 * AuctionDashboardModules — Procol-style enterprise modules
 * Summary cards, live auction strip, supplier overview, PO history, execution tracking
 * Sits ABOVE the existing auction list on the reverse auction dashboard
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee, Flame, BarChart3, Users, Eye, ChevronDown, ChevronRight,
  FileText, CheckCircle2, Package, Clock, TrendingUp,
  MessageCircle, RefreshCw, Trophy, AlertTriangle, Lightbulb, Plus, UserPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerCompanyContext } from '@/hooks/useBuyerCompanyContext';
import { ReverseAuction } from '@/hooks/useReverseAuction';
import { format } from 'date-fns';
import { formatCompact as sharedFormatCompact, formatCurrency as sharedFormatCurrency, useCurrencyFormatter } from '@/lib/currency';

/* ─── helpers ─── */
function formatCompact(v: number, currency: string = 'INR') {
  return sharedFormatCompact(v, currency);
}

function formatINR(v: number, currency: string = 'INR') {
  return sharedFormatCurrency(v, currency);
}

interface Props {
  onSelectAuction: (a: ReverseAuction) => void;
}

/* ═══════════════════════════════════════════════
   ✦ 2. Live Auction Strip
   ═══════════════════════════════════════════════ */
function LiveAuctionStrip({ auctions, onSelect }: { auctions: any[]; onSelect: (a: any) => void }) {
  const liveAuctions = useMemo(() => auctions.filter((a) => a.status === 'live'), [auctions]);

  if (liveAuctions.length === 0) return null;

  return (
    <div className="space-y-2">
      {liveAuctions.map((a) => {
        const savings = a.starting_price && a.current_price ? (a.starting_price - a.current_price) * (a.quantity || 1) : 0;
        return (
          <div
            key={a.id}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-[0.625rem] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(a)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  L1: {a.current_price ? formatINR(a.current_price) : '—'}
                  {savings > 0 && <span className="text-emerald-600 ml-2">Saved {formatCompact(savings)}</span>}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 shrink-0">
              <Eye className="w-3.5 h-3.5" /> View Live
            </Button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 3. Supplier Overview (collapsible) — uses buyer_suppliers + participation
   ═══════════════════════════════════════════════ */
function SupplierOverview({ buyerId }: { buyerId: string }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const loadSuppliers = async () => {
    if (!buyerId) return;
    const [suppRes, partRes] = await Promise.all([
      supabase
        .from('buyer_suppliers')
        .select('id, supplier_name, company_name, email, phone, is_onboarded')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('supplier_participation' as any)
        .select('supplier_id, has_bid, auction_id, last_active')
        .eq('buyer_id', buyerId),
    ]);

    const partMap = new Map<string, { total: number; participated: number; lastActive: string | null }>();
    ((partRes.data as any[]) || []).forEach((p: any) => {
      const key = `${p.supplier_id}_${buyerId}`;
      if (!partMap.has(key)) partMap.set(key, { total: 0, participated: 0, lastActive: null });
      const entry = partMap.get(key)!;
      entry.total++;
      if (p.has_bid) entry.participated++;
      if (p.last_active && (!entry.lastActive || p.last_active > entry.lastActive)) {
        entry.lastActive = p.last_active;
      }
    });

    const enriched = (suppRes.data || []).map((s: any) => {
      const part = partMap.get(`${s.id}_${buyerId}`);
      const participationPct = part && part.total > 0 ? Math.round((part.participated / part.total) * 100) : null;
      const qualityScore = participationPct !== null
        ? Math.min(100, Math.round(participationPct * 0.7 + ((part?.participated || 0) * 2)))
        : 0;
      return {
        ...s,
        participationPct,
        partTotal: part?.total || 0,
        partBid: part?.participated || 0,
        lastActive: part?.lastActive || null,
        qualityScore,
        isActive: s.is_onboarded || !!s.email,
      };
    });
    setSuppliers(enriched);
  };

  useEffect(() => {
    loadSuppliers();
  }, [buyerId]);

  const bestSupplier = suppliers.length > 0
    ? [...suppliers].sort((a, b) => (b.participationPct ?? -1) - (a.participationPct ?? -1))[0]
    : null;
  const activeBidders = suppliers.filter(s => s.participationPct && s.participationPct > 50).length;

  const getStatusBadge = (s: any) => {
    if (s.is_onboarded) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">🟢 Active</Badge>;
    return <Badge variant="outline" className="text-xs">⚪ Not onboarded</Badge>;
  };

  const handleWhatsApp = (s: any) => {
    const msg = `Hi ${s.company_name || s.supplier_name || ''}, you are invited to a reverse auction on ProcureSaathi.\n\nBid here: ${window.location.origin}/supplier-auction`;
    window.open(`https://wa.me/${(s.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleResend = async (s: any) => {
    toast.success(`Invite resent to ${s.email || s.supplier_name}`);
  };

  const handleAddSupplier = async () => {
    if (!newName.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase
        .from('buyer_suppliers')
        .insert({
          buyer_id: buyerId,
          supplier_name: newName.trim(),
          email: newEmail.trim() || null,
          phone: newPhone.trim() || null,
          company_name: newName.trim(),
        });
      if (error) throw error;
      toast.success(`${newName.trim()} added to your supplier network`);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setShowAddForm(false);
      loadSuppliers();
    } catch (err: any) {
      toast.error('Failed to add supplier: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-sm">Supplier Network</span>
          <Badge variant="secondary" className="text-xs">{suppliers.length}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t">
          {/* Add supplier button + form */}
          <div className="p-3 border-b">
            {!showAddForm ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 w-full"
                onClick={() => setShowAddForm(true)}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Supplier to Network
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">Add New Supplier</span>
                </div>
                <Input
                  placeholder="Company / Supplier name *"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSupplier} disabled={adding} className="gap-1">
                    <Plus className="w-3 h-3" />
                    {adding ? 'Adding...' : 'Add'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {suppliers.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No suppliers yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add suppliers to build your procurement network and track participation</p>
            </div>
          ) : (
            <>
              {/* Low competition alert */}
              {suppliers.length <= 1 && (
                <div className="px-4 py-2 bg-destructive/10 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Only {suppliers.length} supplier — invite more for better pricing
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40">
                      <th className="text-left p-3 font-medium text-muted-foreground">Company</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Score</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Participation</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-t hover:bg-muted/20">
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{s.company_name || s.supplier_name || '—'}</span>
                            {bestSupplier?.id === s.id && s.participationPct !== null && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 px-1.5 py-0">
                                <Trophy className="w-3 h-3 mr-0.5" /> Best
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{s.email || ''}</span>
                        </td>
                        <td className="p-3">{getStatusBadge(s)}</td>
                        <td className="p-3 text-right">
                          <span className={`text-xs font-semibold ${s.qualityScore >= 70 ? 'text-emerald-600' : s.qualityScore >= 40 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {s.qualityScore}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {s.participationPct !== null ? (
                            <span className="text-xs font-medium">
                              {s.participationPct}%
                              <span className="text-muted-foreground ml-1">({s.partBid}/{s.partTotal})</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            {s.phone && (
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600" onClick={(e) => { e.stopPropagation(); handleWhatsApp(s); }}>
                                <MessageCircle className="w-3 h-3 mr-1" /> WA
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" onClick={(e) => { e.stopPropagation(); handleResend(s); }}>
                              <RefreshCw className="w-3 h-3 mr-1" /> Resend
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {suppliers.length > 10 && (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    + {suppliers.length - 10} more suppliers
                  </div>
                )}
              </div>
              {/* Smart insight */}
              <div className="px-4 py-2 border-t flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                {activeBidders} supplier{activeBidders !== 1 ? 's' : ''} actively bidding (&gt;50% participation)
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   ✦ 4. Purchase Order History (collapsible)
   ═══════════════════════════════════════════════ */
function POHistory({ auctions }: { auctions: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const completedWithWinner = useMemo(
    () => auctions.filter((a) => a.status === 'completed' && a.winner_supplier_id),
    [auctions]
  );

  if (completedWithWinner.length === 0) return null;

  return (
    <Card className="rounded-[0.625rem] overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Purchase Orders</span>
          <Badge variant="secondary" className="text-xs">{completedWithWinner.length}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="border-t overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left p-3 font-medium text-muted-foreground">PO Ref</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Auction</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {completedWithWinner.slice(0, 10).map((a) => (
                <tr key={a.id} className="border-t hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs">PO-{a.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3 font-medium truncate max-w-[200px]">{a.title}</td>
                  <td className="p-3 text-right font-semibold">{a.winning_bid ? formatINR(a.winning_bid * (a.quantity || 1)) : '—'}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                      Awarded
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   ✦ MAIN EXPORT
   ═══════════════════════════════════════════════ */
export function AuctionDashboardModules({ onSelectAuction }: Props) {
  const { user } = useAuth();
  const { selectedPurchaserId, isLoading: contextLoading } = useBuyerCompanyContext();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || contextLoading) return;

    setAuctions([]);
    setLoading(true);

    const load = async () => {
      // Scoped via DB RPC for purchaser-aware filtering
      const { data } = await (supabase as any).rpc('get_scoped_auctions_by_purchaser', {
        p_user_id: user.id,
        p_selected_purchaser: selectedPurchaserId,
      });

      setAuctions(data || []);
      setLoading(false);
    };

    load();
  }, [user?.id, selectedPurchaserId, contextLoading]);

  if (loading || auctions.length === 0) return null;

  return (
    <div className="space-y-4">
      <LiveAuctionStrip auctions={auctions} onSelect={onSelectAuction} />
    </div>
  );
}
