/**
 * ============================================================
 * DEMAND ALERTS PANEL (ADMIN)
 * ============================================================
 * 
 * Real-time AI-triggered demand alerts for admin dashboard.
 * Displays alerts when:
 * - Intent >= 7 in any category + country
 * - >= 3 RFQs detected in 72 hours
 * - Same category spikes across >= 2 countries
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  TrendingUp, 
  Globe2, 
  Zap, 
  Check, 
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface DemandAlert {
  id: string;
  alert_type: 'intent_threshold' | 'rfq_spike' | 'cross_country_spike' | 'forecast_spike' | 'export_demand' | 'velocity_jump';
  category: string;
  country: string;
  intent_score: number;
  rfq_count: number;
  time_window_hours: number;
  suggested_action: string;
  countries_affected: string[] | null;
  is_read: boolean;
  is_actioned: boolean;
  created_at: string;
}

const alertTypeConfig: Record<string, { icon: typeof TrendingUp; color: string; bgColor: string; label: string }> = {
  intent_threshold: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: 'High Intent',
  },
  rfq_spike: {
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'RFQ Spike',
  },
  cross_country_spike: {
    icon: Globe2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Multi-Country',
  },
  forecast_spike: {
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Forecast Spike',
  },
  export_demand: {
    icon: Globe2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    label: 'Export Demand',
  },
  velocity_jump: {
    icon: Zap,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    label: 'Velocity Jump',
  },
};

export function DemandAlertsPanel() {
  const [alerts, setAlerts] = useState<DemandAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('demand_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data || []) as DemandAlert[]);
    } catch (err) {
      console.error('[DemandAlertsPanel] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAlertCheck = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('check_and_create_demand_alerts');
      if (error) throw error;
      toast.success(`Created ${data} new alerts`);
      fetchAlerts();
    } catch (err) {
      console.error('[DemandAlertsPanel] Trigger error:', err);
      toast.error('Failed to check for new alerts');
    }
  }, [fetchAlerts]);

  const markAsActioned = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('demand_alerts')
        .update({ 
          is_actioned: true, 
          actioned_at: new Date().toISOString() 
        })
        .eq('id', alertId);

      if (error) throw error;
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_actioned: true } : a
      ));
      toast.success('Alert marked as actioned');
    } catch (err) {
      console.error('[DemandAlertsPanel] Action error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const unactionedCount = alerts.filter(a => !a.is_actioned).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            AI Demand Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          AI Demand Alerts
          {unactionedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unactionedCount} new
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={triggerAlertCheck}>
          <Zap className="h-4 w-4 mr-1" />
          Check Now
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
            <p className="text-sm mt-1">Alerts are triggered by demand signals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = alertTypeConfig[alert.alert_type];
              const Icon = config.icon;
              
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.is_actioned ? 'opacity-60 bg-muted/30' : config.bgColor
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="font-medium">{alert.category}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {alert.country === 'GLOBAL' 
                              ? `${alert.countries_affected?.length || 0} countries`
                              : alert.country
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          {alert.intent_score > 0 && (
                            <span className={`font-semibold ${
                              alert.intent_score >= 7 ? 'text-green-600' :
                              alert.intent_score >= 4 ? 'text-amber-600' :
                              'text-muted-foreground'
                            }`}>
                              Intent: {alert.intent_score}
                            </span>
                          )}
                          {alert.rfq_count > 0 && (
                            <span className="text-blue-600 font-medium">
                              {alert.rfq_count} RFQs
                            </span>
                          )}
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">
                            {alert.suggested_action}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!alert.is_actioned && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsActioned(alert.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DemandAlertsPanel;
