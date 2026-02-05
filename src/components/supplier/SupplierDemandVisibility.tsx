/**
 * ============================================================
 * SUPPLIER DEMAND VISIBILITY (MONETISED)
 * ============================================================
 * 
 * Displays demand signals to suppliers with monetisation gates:
 * - Free suppliers: See low-intent demand only
 * - Premium suppliers: Full access + RFQ alerts
 * - Exclusive suppliers: Early access + locked lanes
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Lock, 
  Eye, 
  EyeOff,
  Crown,
  Zap,
  AlertCircle
} from 'lucide-react';

interface SupplierDemandRow {
  category: string;
  country: string;
  intent: number;
  rfqs: number;
  source: string;
  is_locked: boolean;
  can_access: boolean;
  access_reason: string;
}

interface SupplierAccessInfo {
  access_tier: 'free' | 'premium' | 'exclusive';
  min_intent_visible: number;
  max_alerts_per_day: number;
  early_access_hours: number;
}

interface Props {
  supplierId: string;
}

export function SupplierDemandVisibility({ supplierId }: Props) {
  const [demandData, setDemandData] = useState<SupplierDemandRow[]>([]);
  const [accessInfo, setAccessInfo] = useState<SupplierAccessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDemandData = useCallback(async () => {
    try {
      // Fetch supplier's access tier
      const { data: accessData } = await supabase
        .from('supplier_demand_access')
        .select('*')
        .eq('supplier_id', supplierId)
        .single();

      if (accessData) {
        setAccessInfo(accessData as SupplierAccessInfo);
      } else {
        setAccessInfo({
          access_tier: 'free',
          min_intent_visible: 0,
          max_alerts_per_day: 3,
          early_access_hours: 0,
        });
      }

      // Fetch visible demand data
      const { data, error } = await supabase.rpc('get_supplier_visible_demand', {
        p_supplier_id: supplierId,
      });

      if (error) throw error;
      setDemandData((data || []) as SupplierDemandRow[]);
    } catch (err) {
      console.error('[SupplierDemandVisibility] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchDemandData();
  }, [fetchDemandData]);

  const tierBadge = {
    free: { label: 'Free', color: 'bg-muted text-muted-foreground' },
    premium: { label: 'Premium', color: 'bg-amber-100 text-amber-800' },
    exclusive: { label: 'Exclusive', color: 'bg-purple-100 text-purple-800' },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Demand Signals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading demand data...</div>
        </CardContent>
      </Card>
    );
  }

  const tier = accessInfo?.access_tier || 'free';
  const hiddenCount = demandData.filter(d => !d.can_access).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Demand Signals
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Live buyer demand in your categories
          </p>
        </div>
        <Badge className={tierBadge[tier].color}>
          {tier === 'exclusive' && <Crown className="h-3 w-3 mr-1" />}
          {tierBadge[tier].label}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Upgrade Banner for Free Users */}
        {tier === 'free' && hiddenCount > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <EyeOff className="h-4 w-4" />
              <span className="font-medium">
                {hiddenCount} high-intent opportunities hidden
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Upgrade to Premium to see all demand signals and receive RFQ alerts
            </p>
            <Button size="sm" className="mt-2" variant="outline">
              <Zap className="h-4 w-4 mr-1" />
              Upgrade to Premium
            </Button>
          </div>
        )}

        {/* Demand Grid */}
        {demandData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No demand signals in your categories</p>
            <p className="text-sm mt-1">
              Add more categories to your profile to see more opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {demandData.map((row, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  !row.can_access 
                    ? 'bg-muted/30 opacity-75' 
                    : row.intent >= 70
                    ? 'bg-green-50 border-green-200'
                    : row.intent >= 40
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-background'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {!row.can_access ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <div className="font-medium">{row.category}</div>
                      <div className="text-sm text-muted-foreground">
                        {row.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {row.can_access && (
                      <>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            row.intent >= 70 ? 'text-green-600' :
                            row.intent >= 40 ? 'text-amber-600' :
                            'text-muted-foreground'
                          }`}>
                            {row.intent}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Intent
                          </div>
                        </div>
                        {row.rfqs > 0 && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {row.rfqs}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              RFQs
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {row.is_locked && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}

                    <Badge variant={
                      row.can_access && row.intent >= 70 ? 'default' :
                      row.can_access && row.intent >= 40 ? 'secondary' :
                      !row.can_access ? 'outline' :
                      'outline'
                    }>
                      {row.can_access ? (row.intent >= 70 ? 'Active' : row.intent >= 40 ? 'Confirmed' : 'Detected') : 'Hidden'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Early Access Info for Exclusive Users */}
        {tier === 'exclusive' && accessInfo?.early_access_hours && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800">
              <Crown className="h-4 w-4" />
              <span className="font-medium">
                {accessInfo.early_access_hours}h early access to new opportunities
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SupplierDemandVisibility;
