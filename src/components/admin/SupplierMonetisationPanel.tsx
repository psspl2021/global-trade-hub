/**
 * ============================================================
 * SUPPLIER MONETISATION PANEL (ADMIN)
 * ============================================================
 * 
 * Admin view for managing supplier access tiers and lane locks.
 * 
 * Tiers:
 * - Free: See intent < 4, RFQs hidden
 * - Premium: All demand + RFQs visible
 * - Exclusive: Early access + priority on high-intent lanes
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, 
  Lock, 
  Users, 
  TrendingUp,
  Zap,
  Shield,
  Search,
  RefreshCw,
  Star,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface SupplierAccess {
  id: string;
  supplier_id: string;
  access_tier: 'free' | 'premium' | 'exclusive';
  min_intent_visible: number;
  max_alerts_per_day: number;
  early_access_hours: number;
  activated_at: string;
  expires_at: string | null;
  supplier_name?: string;
  supplier_email?: string;
}

interface LaneLock {
  id: string;
  category: string;
  country: string;
  is_locked: boolean;
  locked_at: string | null;
  max_suppliers: number;
  assigned_count?: number;
}

export function SupplierMonetisationPanel() {
  const [supplierAccess, setSupplierAccess] = useState<SupplierAccess[]>([]);
  const [laneLocks, setLaneLocks] = useState<LaneLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const fetchSupplierAccess = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_demand_access')
        .select('*')
        .order('access_tier', { ascending: false });

      if (error) throw error;
      setSupplierAccess((data || []) as SupplierAccess[]);
    } catch (err) {
      console.error('[SupplierMonetisationPanel] Error fetching access:', err);
    }
  }, []);

  const fetchLaneLocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('demand_lane_locks')
        .select('*')
        .order('locked_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setLaneLocks((data || []) as LaneLock[]);
    } catch (err) {
      console.error('[SupplierMonetisationPanel] Error fetching locks:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSupplierAccess(), fetchLaneLocks()]);
    setLoading(false);
  }, [fetchSupplierAccess, fetchLaneLocks]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const updateSupplierTier = async (supplierId: string, newTier: string) => {
    try {
      const tierConfigs: Record<string, { min_intent_visible: number; max_alerts_per_day: number; early_access_hours: number }> = {
        free: { min_intent_visible: 0, max_alerts_per_day: 5, early_access_hours: 0 },
        premium: { min_intent_visible: 0, max_alerts_per_day: 50, early_access_hours: 24 },
        exclusive: { min_intent_visible: 0, max_alerts_per_day: 100, early_access_hours: 72 },
      };
      const tierConfig = tierConfigs[newTier] || tierConfigs['free'];

      const { error } = await supabase
        .from('supplier_demand_access')
        .upsert({
          supplier_id: supplierId,
          access_tier: newTier,
          ...tierConfig,
          activated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success(`Supplier tier updated to ${newTier}`);
      fetchSupplierAccess();
    } catch (err) {
      console.error('[SupplierMonetisationPanel] Update error:', err);
      toast.error('Failed to update tier');
    }
  };

  const toggleLaneLock = async (laneId: string, currentLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('demand_lane_locks')
        .update({ 
          is_locked: !currentLocked,
          locked_at: !currentLocked ? new Date().toISOString() : null,
        })
        .eq('id', laneId);

      if (error) throw error;
      toast.success(currentLocked ? 'Lane unlocked' : 'Lane locked');
      fetchLaneLocks();
    } catch (err) {
      console.error('[SupplierMonetisationPanel] Lock toggle error:', err);
      toast.error('Failed to update lane lock');
    }
  };

  // Filter suppliers
  const filteredSuppliers = supplierAccess.filter(s => {
    if (tierFilter !== 'all' && s.access_tier !== tierFilter) return false;
    if (searchQuery && !s.supplier_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: supplierAccess.length,
    free: supplierAccess.filter(s => s.access_tier === 'free').length,
    premium: supplierAccess.filter(s => s.access_tier === 'premium').length,
    exclusive: supplierAccess.filter(s => s.access_tier === 'exclusive').length,
    lockedLanes: laneLocks.filter(l => l.is_locked).length,
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'exclusive':
        return <Badge className="bg-purple-600 text-white"><Crown className="w-3 h-3 mr-1" />Exclusive</Badge>;
      case 'premium':
        return <Badge className="bg-amber-500 text-white"><Star className="w-3 h-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Supplier Monetisation</h2>
            <p className="text-sm text-muted-foreground">
              Manage access tiers, lane locks, and supplier assignments
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
              <p className="text-xs text-gray-600/70 uppercase tracking-wide">Total Suppliers</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold text-gray-700">{stats.free}</p>
              <p className="text-xs text-gray-600/70 uppercase tracking-wide">Free Tier</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.premium}</p>
              <p className="text-xs text-amber-600/70 uppercase tracking-wide">Premium</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.exclusive}</p>
              <p className="text-xs text-purple-600/70 uppercase tracking-wide">Exclusive</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.lockedLanes}</p>
              <p className="text-xs text-red-600/70 uppercase tracking-wide">Locked Lanes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Supplier Access Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Supplier Access Tiers
          </CardTitle>
          <CardDescription>
            Manage which demand signals each supplier can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by supplier ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="exclusive">Exclusive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No supplier access records found</p>
              <p className="text-sm mt-1">Suppliers get added when they register or are upgraded</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier ID</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Alerts/Day</TableHead>
                    <TableHead>Early Access</TableHead>
                    <TableHead>Activated</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono text-xs">
                        {supplier.supplier_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getTierBadge(supplier.access_tier)}</TableCell>
                      <TableCell>{supplier.max_alerts_per_day}</TableCell>
                      <TableCell>
                        {supplier.early_access_hours > 0 
                          ? `${supplier.early_access_hours}h` 
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(supplier.activated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {supplier.expires_at 
                          ? new Date(supplier.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={supplier.access_tier}
                          onValueChange={(val) => updateSupplierTier(supplier.supplier_id, val)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="exclusive">Exclusive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Lane Locks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Demand Lane Locks
          </CardTitle>
          <CardDescription>
            High-intent lanes locked to exclusive suppliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {laneLocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No lane locks configured</p>
              <p className="text-sm mt-1">Lanes get locked when intent reaches threshold</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Max Suppliers</TableHead>
                    <TableHead>Locked At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laneLocks.map((lane) => (
                    <TableRow key={lane.id}>
                      <TableCell className="font-medium">{lane.category}</TableCell>
                      <TableCell>{lane.country}</TableCell>
                      <TableCell>
                        {lane.is_locked ? (
                          <Badge className="bg-red-600 text-white">
                            <Lock className="w-3 h-3 mr-1" />Locked
                          </Badge>
                        ) : (
                          <Badge variant="outline">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell>{lane.max_suppliers}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lane.locked_at 
                          ? new Date(lane.locked_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleLaneLock(lane.id, lane.is_locked)}
                        >
                          {lane.is_locked ? 'Unlock' : 'Lock'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Monetisation Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-purple-900">Monetisation Rules</p>
              <ul className="text-sm text-purple-700 mt-2 space-y-1">
                <li>• <strong>Free:</strong> See intent &lt; 4 only, RFQs hidden</li>
                <li>• <strong>Premium:</strong> All demand + RFQs visible, 24h early access</li>
                <li>• <strong>Exclusive:</strong> 72h early access, priority on locked lanes</li>
                <li>• <strong>Lane Lock:</strong> Intent ≥ 7 triggers lock, top 3 suppliers assigned</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupplierMonetisationPanel;
