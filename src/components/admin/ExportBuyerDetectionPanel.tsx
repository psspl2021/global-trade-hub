/**
 * ============================================================
 * EXPORT BUYER DETECTION PANEL (ADMIN)
 * ============================================================
 * 
 * Cross-border demand intelligence showing:
 * - Country pairs with export potential
 * - Buyer intent in destination country
 * - Supplier strength in source country
 * - Suggested supplier pools
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Globe2, 
  ArrowRight, 
  Loader2,
  RefreshCw,
  Flame,
  Zap,
  Eye,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { countries } from '@/data/countries';

interface ExportLane {
  country_from: string;
  country_to: string;
  category: string;
  buyer_intent_score: number;
  supplier_strength_score: number;
  cross_border_score: number;
  rfq_count: number;
  suggested_suppliers: string[] | null;
  lane_status: string;
}

export function ExportBuyerDetectionPanel() {
  const [lanes, setLanes] = useState<ExportLane[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedFromCountry, setSelectedFromCountry] = useState<string>('');
  const [selectedToCountry, setSelectedToCountry] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(5);

  const countryOptions = countries.map(c => ({ value: c.name, label: c.name }));

  const fetchLanes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('export_demand_lanes')
        .select('*')
        .order('cross_border_score', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map to expected interface
      const mapped = (data || []).map(d => ({
        country_from: d.country_from,
        country_to: d.country_to,
        category: d.category,
        buyer_intent_score: d.export_intent_score,
        supplier_strength_score: d.supplier_strength_score,
        cross_border_score: d.cross_border_score,
        rfq_count: d.rfq_count,
        suggested_suppliers: d.suggested_suppliers,
        lane_status: d.lane_status
      }));
      
      setLanes(mapped);
    } catch (err) {
      console.error('[ExportBuyerDetectionPanel] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const runDetection = useCallback(async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.rpc('detect_export_buyers', {
        p_country_from: selectedFromCountry || null,
        p_country_to: selectedToCountry || null,
        p_threshold: threshold
      });

      if (error) throw error;
      setLanes((data || []) as ExportLane[]);
      toast.success(`Found ${data?.length || 0} export demand lanes`);
    } catch (err) {
      console.error('[ExportBuyerDetectionPanel] Scan error:', err);
      toast.error('Failed to scan for export buyers');
    } finally {
      setScanning(false);
    }
  }, [selectedFromCountry, selectedToCountry, threshold]);

  useEffect(() => {
    fetchLanes();
  }, [fetchLanes]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hot':
        return <Badge className="bg-red-100 text-red-800"><Flame className="h-3 w-3 mr-1" />Hot</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><Zap className="h-3 w-3 mr-1" />Active</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Eye className="h-3 w-3 mr-1" />Detected</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 15) return 'text-red-600 font-bold';
    if (score >= 10) return 'text-amber-600 font-semibold';
    if (score >= 5) return 'text-blue-600';
    return 'text-muted-foreground';
  };

  // Summary stats
  const hotLanes = lanes.filter(l => l.lane_status === 'hot').length;
  const activeLanes = lanes.filter(l => l.lane_status === 'active').length;
  const totalRFQs = lanes.reduce((sum, l) => sum + (l.rfq_count || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Export Buyer Detection
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-border demand lanes with supplier matching
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLanes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={runDetection} disabled={scanning}>
            {scanning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            Scan Now
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedFromCountry} onValueChange={setSelectedFromCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Source Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                {countryOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select value={selectedToCountry} onValueChange={setSelectedToCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Destination Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Destinations</SelectItem>
                {countryOptions.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={String(threshold)} onValueChange={(v) => setThreshold(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Min Score: 3</SelectItem>
                <SelectItem value="5">Min Score: 5</SelectItem>
                <SelectItem value="8">Min Score: 8</SelectItem>
                <SelectItem value="10">Min Score: 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">Hot Lanes</span>
            </div>
            <div className="text-2xl font-bold text-red-800">{hotLanes}</div>
            <div className="text-xs text-red-600">Cross-border score ≥ 15</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Active Lanes</span>
            </div>
            <div className="text-2xl font-bold text-green-800">{activeLanes}</div>
            <div className="text-xs text-green-600">Cross-border score 8-14</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Total RFQs</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">{totalRFQs}</div>
            <div className="text-xs text-blue-600">Cross-border inquiries</div>
          </div>
        </div>

        {/* Lanes Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : lanes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No export demand lanes detected</p>
            <p className="text-sm mt-1">Click "Scan Now" to detect cross-border opportunities</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Buyer Intent</TableHead>
                <TableHead className="text-center">Supplier Strength</TableHead>
                <TableHead className="text-center">Cross-Border Score</TableHead>
                <TableHead className="text-center">RFQs</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lanes.map((lane, idx) => (
                <TableRow key={`${lane.country_from}-${lane.country_to}-${lane.category}-${idx}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lane.country_from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{lane.country_to}</span>
                    </div>
                  </TableCell>
                  <TableCell>{lane.category}</TableCell>
                  <TableCell className="text-center">
                    <span className={getScoreColor(lane.buyer_intent_score)}>
                      {lane.buyer_intent_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-blue-600 font-medium">
                      {lane.supplier_strength_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getScoreColor(lane.cross_border_score)}>
                      {lane.cross_border_score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {lane.rfq_count}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(lane.lane_status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default ExportBuyerDetectionPanel;
