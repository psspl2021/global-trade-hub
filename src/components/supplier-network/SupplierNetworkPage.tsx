/**
 * Supplier Network — Full sub-view page
 * Add suppliers, view list with status, quality scores, actions
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  ArrowLeft, UserPlus, Users, Trophy, MessageCircle,
  Mail, Phone, Search, RefreshCw, AlertTriangle, ShieldCheck, Pencil,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SupplierNetworkPageProps {
  userId: string;
  onBack: () => void;
}

export function SupplierNetworkPage({ userId, onBack }: SupplierNetworkPageProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editGstin, setEditGstin] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (s: any) => {
    setEditingSupplier(s);
    setEditName(s.company_name || s.supplier_name || '');
    setEditEmail(s.email || '');
    setEditPhone(s.phone || '');
    setEditCategory(s.category || '');
    setEditGstin(s.gstin || '');
    setEditLocation(s.location || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSupplier) return;
    if (!editName.trim()) { toast.error('Supplier name is required'); return; }
    const gstin = editGstin.trim().toUpperCase();
    if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) {
      toast.error('GSTIN must be 15 alphanumeric characters');
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('buyer_suppliers')
        .update({
          supplier_name: editName.trim(),
          company_name: editName.trim(),
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
          category: editCategory.trim() || null,
          gstin: gstin || null,
          location: editLocation.trim() || null,
        } as any)
        .eq('id', editingSupplier.id)
        .eq('buyer_id', userId);
      if (error) throw error;
      toast.success('Supplier updated');
      setEditingSupplier(null);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSavingEdit(false); }
  };

  const loadSuppliers = async () => {
    setLoading(true);
    const [suppRes, partRes] = await Promise.all([
      supabase
        .from('buyer_suppliers')
        .select('id, supplier_name, company_name, email, phone, is_onboarded, created_at, is_global_supplier, export_capability, category, gstin, location')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('supplier_participation' as any)
        .select('supplier_id, has_bid, auction_id, last_active')
        .eq('buyer_id', userId),
    ]);

    // Fetch verification data from profiles for onboarded suppliers
    const emails = (suppRes.data || []).map((s: any) => s.email).filter(Boolean);
    let verifiedMap = new Map<string, { verified: boolean; gstin: string | null; tax_id: string | null; completeness: number }>();
    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, is_verified_supplier, gstin, tax_id, business_registration, company_name, phone, city, country')
        .in('email', emails);
      (profiles || []).forEach((p: any) => {
        const fields = [p.company_name, p.phone, p.email, p.city, p.country, p.gstin || p.tax_id || p.business_registration].filter(Boolean);
        const completeness = Math.round((fields.length / 6) * 100);
        verifiedMap.set(p.email?.toLowerCase(), {
          verified: !!p.is_verified_supplier,
          gstin: p.gstin,
          tax_id: p.tax_id,
          completeness,
        });
      });
    }

    const partMap = new Map<string, { total: number; participated: number; lastActive: string | null }>();
    ((partRes.data as any[]) || []).forEach((p: any) => {
      const key = `${p.supplier_id}_${userId}`;
      if (!partMap.has(key)) partMap.set(key, { total: 0, participated: 0, lastActive: null });
      const entry = partMap.get(key)!;
      entry.total++;
      if (p.has_bid) entry.participated++;
      if (p.last_active && (!entry.lastActive || p.last_active > entry.lastActive)) {
        entry.lastActive = p.last_active;
      }
    });

    const enriched = (suppRes.data || []).map((s: any) => {
      const part = partMap.get(`${s.id}_${userId}`);
      const participationPct = part && part.total > 0 ? Math.round((part.participated / part.total) * 100) : null;
      const qualityScore = participationPct !== null
        ? Math.min(100, Math.round(participationPct * 0.7 + ((part?.participated || 0) * 2)))
        : 0;
      const vData = s.email ? verifiedMap.get(s.email.toLowerCase()) : null;
      return {
        ...s,
        participationPct,
        partBid: part?.participated || 0,
        lastActive: part?.lastActive || null,
        qualityScore,
        isVerified: vData?.verified || false,
        profileCompleteness: vData?.completeness || 0,
        hasGstin: !!vData?.gstin,
        hasTaxId: !!vData?.tax_id,
      };
    });
    setSuppliers(enriched);
    setLoading(false);
  };

  useEffect(() => { loadSuppliers(); }, [userId]);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Supplier name is required'); return; }
    // Lightweight GSTIN sanity check (India: 15 chars alphanumeric). Optional.
    const gstin = newGstin.trim().toUpperCase();
    if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) {
      toast.error('GSTIN must be 15 alphanumeric characters');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('buyer_suppliers').insert({
        buyer_id: userId,
        supplier_name: newName.trim(),
        email: newEmail.trim() || null,
        phone: newPhone.trim() || null,
        company_name: newName.trim(),
        category: newCategory.trim() || null,
        gstin: gstin || null,
        location: newLocation.trim() || null,
      } as any);
      if (error) throw error;
      toast.success(`${newName.trim()} added to your network`);
      setNewName(''); setNewEmail(''); setNewPhone('');
      setNewCategory(''); setNewGstin(''); setNewLocation('');
      setShowAdd(false);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setAdding(false); }
  };

  const handleWhatsApp = (s: any) => {
    const msg = `Hi ${s.company_name || s.supplier_name || ''}, you're invited to join ProcureSaathi as a supplier: ${window.location.origin}/supplier-auction`;
    window.open(`https://wa.me/${(s.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const bestSupplier = suppliers.length > 0
    ? [...suppliers].sort((a, b) => (b.participationPct ?? -1) - (a.participationPct ?? -1))[0]
    : null;

  const filtered = suppliers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.supplier_name || '').toLowerCase().includes(q) ||
      (s.company_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
  });

  const activeBidders = suppliers.filter(s => s.participationPct && s.participationPct > 50).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Supplier Network</h2>
          <p className="text-xs text-muted-foreground">{suppliers.length} suppliers in your network</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{suppliers.length}</div>
          <div className="text-[11px] text-muted-foreground">Total Suppliers</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{suppliers.filter(s => s.is_onboarded).length}</div>
          <div className="text-[11px] text-muted-foreground">Onboarded</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-violet-600">{activeBidders}</div>
          <div className="text-[11px] text-muted-foreground">Active Bidders</div>
        </Card>
      </div>

      {/* Network value signal */}
      {suppliers.length > 0 && suppliers.length < 3 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
          <span className="text-lg">🎯</span>
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              You've added {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}. Add more for stronger competition and better pricing.
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400">Add at least 3 suppliers to unlock best pricing</p>
          </div>
        </div>
      )}
      {suppliers.length >= 3 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800">
          <span className="text-lg">✅</span>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {suppliers.length} suppliers — strong network drives great competition and better pricing
          </p>
        </div>
      )}

      {/* Low competition alert */}
      {suppliers.length <= 1 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span className="text-xs text-destructive font-medium">
            {suppliers.length === 0 ? 'No suppliers yet — add suppliers to start getting competitive bids' : 'Only 1 supplier — invite more for better pricing'}
          </span>
        </div>
      )}

      {/* Actions: Add + Search */}
      <div className="flex gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
          <UserPlus className="w-3.5 h-3.5" /> Add Supplier
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={loadSuppliers}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm pl-8"
          />
        </div>
      </div>

      {/* Add Supplier Form */}
      {showAdd && (
        <Card className="p-4 border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Add New Supplier</span>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Company / Supplier name *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-9"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Phone (with country code)"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Category (e.g. Steel, Chemicals)"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="h-9"
                maxLength={80}
              />
              <Input
                placeholder="Location (City / Region)"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                className="h-9"
                maxLength={120}
              />
            </div>
            <Input
              placeholder="GST Number (optional, 15 chars)"
              value={newGstin}
              onChange={e => setNewGstin(e.target.value.toUpperCase())}
              className="h-9 uppercase"
              maxLength={15}
            />
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleAdd} disabled={adding}>
                {adding ? 'Adding...' : 'Add to Network'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Smart insight */}
      {activeBidders > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          💡 <strong>{activeBidders}</strong> supplier{activeBidders > 1 ? 's are' : ' is'} actively bidding (&gt;50% participation rate)
        </div>
      )}

      {/* Supplier List */}
      {loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading suppliers…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No suppliers match your search' : 'No suppliers in your network yet'}
          description={search ? 'Try a different search term' : 'Add your first supplier to start building your procurement network'}
          action={!search ? { label: 'Add Supplier', onClick: () => setShowAdd(true) } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const isBest = bestSupplier?.id === s.id && (s.participationPct ?? 0) > 0;
            return (
              <Card key={s.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{s.company_name || s.supplier_name}</span>
                      {s.is_onboarded ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">🟢 Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">⚪ Invited</Badge>
                      )}
                      {isBest && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                          <Trophy className="w-2.5 h-2.5 mr-0.5 inline" /> Best
                        </Badge>
                      )}
                      {s.isVerified && (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" /> Verified
                        </Badge>
                      )}
                      {(s.hasGstin || s.hasTaxId) && !s.isVerified && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          {s.hasGstin ? 'GST' : 'Tax ID'} ✓
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {s.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>}
                      {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                    </div>
                    {s.profileCompleteness > 0 && s.profileCompleteness < 100 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="h-1 flex-1 max-w-[80px] bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.profileCompleteness}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{s.profileCompleteness}% profile</span>
                      </div>
                    )}
                    {s.qualityScore > 0 && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-violet-600 font-medium">Score: {s.qualityScore}</span>
                        <span className="text-muted-foreground">{s.participationPct}% participation</span>
                        <span className="text-muted-foreground">{s.partBid} bids</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.phone && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => handleWhatsApp(s)}>
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-primary hover:bg-primary/10" onClick={() => toast.success(`Invite resent to ${s.email || s.supplier_name}`)}>
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
