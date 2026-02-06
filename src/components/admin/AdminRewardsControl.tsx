/**
 * ============================================================
 * ADMIN REWARDS CONTROL (ADMIN PANEL)
 * ============================================================
 * 
 * Admin kill switch for purchaser rewards system.
 * 
 * When rewards_enabled = false:
 * - Hide reward amounts across all dashboards
 * - Freeze reward calculations
 * - Show "Rewards temporarily paused by admin" banner
 * - Savings & performance tracking CONTINUE
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Power, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface RewardsSettings {
  id: string;
  rewards_enabled: boolean;
  paused_reason: string | null;
  paused_by: string | null;
  paused_at: string | null;
  compliance_tier: string;
}

export function AdminRewardsControl() {
  const [settings, setSettings] = useState<RewardsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('purchaser_rewards_settings' as any)
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data as unknown as RewardsSettings);
    } catch (err) {
      console.error('[AdminRewardsControl] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggleRewards = async (enabled: boolean) => {
    if (!settings?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('purchaser_rewards_settings' as any)
        .update({
          rewards_enabled: enabled,
          paused_reason: enabled ? null : (pauseReason || 'Paused by admin'),
          paused_at: enabled ? null : new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        rewards_enabled: enabled,
        paused_reason: enabled ? null : (pauseReason || 'Paused by admin'),
        paused_at: enabled ? null : new Date().toISOString(),
      } : null);

      toast.success(enabled ? 'Rewards enabled' : 'Rewards paused');
      setPauseReason('');
    } catch (err) {
      console.error('[AdminRewardsControl] Toggle error:', err);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading settings...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Purchaser Rewards Governance</h2>
              <p className="text-sm text-muted-foreground">
                Admin control for internal procurement incentive system
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kill Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            Rewards Kill Switch
          </CardTitle>
          <CardDescription>
            Toggle to pause or enable reward calculations and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {settings?.rewards_enabled ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              )}
              <div>
                <p className="font-medium">
                  Rewards are {settings?.rewards_enabled ? 'ENABLED' : 'PAUSED'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings?.rewards_enabled 
                    ? 'Purchasers can see reward pools and titles'
                    : 'Reward amounts hidden, calculations frozen'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.rewards_enabled ?? true}
              onCheckedChange={toggleRewards}
              disabled={saving}
            />
          </div>

          {/* Pause Reason */}
          {!settings?.rewards_enabled && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Rewards Currently Paused</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Reason: {settings?.paused_reason || 'No reason provided'}
                  </p>
                  {settings?.paused_at && (
                    <p className="text-xs text-amber-600 mt-1">
                      Paused at: {new Date(settings.paused_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Set Pause Reason */}
          {settings?.rewards_enabled && (
            <div className="space-y-2">
              <Label>Pause Reason (optional)</Label>
              <Input
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g., Quarterly review in progress"
              />
              <p className="text-xs text-muted-foreground">
                This message will be shown to purchasers when rewards are paused
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Continues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Always Active (Even When Paused)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-emerald-800">Savings Tracking</p>
              <p className="text-xs text-emerald-600">
                AI continues to verify and record savings
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-emerald-800">Performance Scores</p>
              <p className="text-xs text-emerald-600">
                Efficiency metrics continue updating
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-emerald-800">Leaderboard</p>
              <p className="text-xs text-emerald-600">
                Rankings based on savings remain visible
              </p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="font-medium text-emerald-800">Career Assets</p>
              <p className="text-xs text-emerald-600">
                Certificates and reports remain downloadable
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Structure Reminder */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Financial Structure Reminder</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Rewards are funded by the BUYER ORGANISATION's budget</li>
                <li>• ProcureSaathi only measures, verifies, and reports savings</li>
                <li>• Rewards are NEVER deducted from ProcureSaathi fees</li>
                <li>• Rewards are NEVER linked to supplier payments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Pitch */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-primary text-center">
            "We convert procurement ethics into measurable performance."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminRewardsControl;
