/**
 * ============================================================
 * ADMIN KILL SWITCH (PS_ADMIN ONLY)
 * ============================================================
 * 
 * Global boolean: rewards_enabled
 * When false:
 * - Hide all incentive currency values
 * - Show: "Rewards paused by admin. Savings tracking remains active."
 * 
 * ACCESS: ps_admin ONLY
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
  Lock,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useGovernanceAccess } from '@/hooks/useGovernanceAccess';
import { AccessDenied } from '@/components/purchaser/AccessDenied';
import { GovernanceLegalArmor } from './GovernanceLegalArmor';

interface RewardsSettings {
  id: string;
  rewards_enabled: boolean;
  paused_reason: string | null;
  paused_at: string | null;
  compliance_tier: string;
}

export function AdminKillSwitch() {
  const [settings, setSettings] = useState<RewardsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  
  // Access control - only ps_admin can toggle
  const { canToggleRewards, primaryRole, isLoading: accessLoading, isAccessDenied } = useGovernanceAccess();

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
      console.error('[AdminKillSwitch] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Access control: Only ps_admin can access
  if (!accessLoading && (isAccessDenied || !canToggleRewards)) {
    return <AccessDenied />;
  }

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
      console.error('[AdminKillSwitch] Toggle error:', err);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || accessLoading) {
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
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-600">
                <Power className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Admin Kill Switch
                </h2>
                <p className="text-sm text-slate-600">
                  Global rewards control (PS Admin Only)
                </p>
              </div>
            </div>
            <Badge className="bg-slate-600 text-white">
              <Lock className="w-3 h-3 mr-1" />
              PS_ADMIN
            </Badge>
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
            Toggle to pause or enable reward visibility across all dashboards
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
                    ? 'All incentive amounts visible to purchasers'
                    : 'Incentive values hidden, savings tracking active'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.rewards_enabled ?? true}
              onCheckedChange={toggleRewards}
              disabled={saving}
            />
          </div>

          {/* Pause Reason Display */}
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
                This message will be shown to users when rewards are paused
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

      {/* Legal Armor */}
      <GovernanceLegalArmor variant="footer" />
      <GovernanceLegalArmor variant="positioning" />
    </div>
  );
}

export default AdminKillSwitch;
