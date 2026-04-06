/**
 * Smart Mode Panel — Autonomous rules engine toggle for War Room
 * Shows active rules, cooldowns, and audit trail
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Zap, Bot, Users, Clock, Shield, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ReverseAuction, ReverseAuctionBid } from '@/hooks/useReverseAuction';
import { useToast } from '@/hooks/use-toast';

interface SmartModePanelProps {
  auctions: ReverseAuction[];
  bidsMap: Record<string, ReverseAuctionBid[]>;
  buyerId: string;
}

interface SmartAction {
  id: string;
  type: 'auto_invite' | 'extend_auction' | 'notify';
  auctionTitle: string;
  description: string;
  timestamp: Date;
  status: 'executed' | 'skipped' | 'cooldown';
}

const COOLDOWN_SECONDS = 120;

const RULES = [
  {
    id: 'low_competition',
    label: 'Auto-invite on low competition',
    description: 'Invite top 2 suppliers when < 3 unique bidders',
    icon: Users,
    defaultEnabled: true,
  },
  {
    id: 'anti_stale',
    label: 'Stale auction alert',
    description: 'Flag auctions with no bids in 5+ minutes',
    icon: Clock,
    defaultEnabled: true,
  },
  {
    id: 'price_guard',
    label: 'Aggressive pricing guard',
    description: 'Alert when price drops > 20% below start',
    icon: Shield,
    defaultEnabled: false,
  },
];

export function SmartModePanel({ auctions, bidsMap, buyerId }: SmartModePanelProps) {
  const { toast } = useToast();
  const [smartEnabled, setSmartEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(RULES.map(r => [r.id, r.defaultEnabled]))
  );
  const [actionLog, setActionLog] = useState<SmartAction[]>([]);
  const lastActionTime = useRef<Record<string, number>>({});

  const addAction = useCallback((action: Omit<SmartAction, 'id' | 'timestamp'>) => {
    setActionLog(prev => [{
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev].slice(0, 20));
  }, []);

  // Smart mode evaluation loop
  useEffect(() => {
    if (!smartEnabled) return;

    const interval = setInterval(async () => {
      const liveAuctions = auctions.filter(a => a.status === 'live');

      for (const auction of liveAuctions) {
        const bids = bidsMap[auction.id] || [];
        const uniqueBidders = new Set(bids.map(b => b.supplier_id)).size;
        const now = Date.now();

        // Rule: Low competition → auto invite
        if (ruleStates['low_competition'] && uniqueBidders < 3) {
          const cooldownKey = `invite_${auction.id}`;
          const lastTime = lastActionTime.current[cooldownKey] || 0;

          if (now - lastTime > COOLDOWN_SECONDS * 1000) {
            try {
              // Get existing invited suppliers
              const { data: existing } = await supabase
                .from('reverse_auction_suppliers')
                .select('supplier_id')
                .eq('auction_id', auction.id);

              const existingIds = new Set((existing || []).map((e: any) => e.supplier_id));

              // Find top uninvited suppliers from buyer's network
              const { data: network } = await supabase
                .from('reverse_auction_bids')
                .select('supplier_id')
                .neq('auction_id', auction.id);

              const candidates = [...new Set((network || []).map((n: any) => n.supplier_id))]
                .filter(id => !existingIds.has(id))
                .slice(0, 2);

              if (candidates.length > 0) {
                for (const supplierId of candidates) {
                  await supabase.from('reverse_auction_suppliers').insert({
                    auction_id: auction.id,
                    supplier_id: supplierId,
                  });
                }

                lastActionTime.current[cooldownKey] = now;
                addAction({
                  type: 'auto_invite',
                  auctionTitle: auction.title,
                  description: `Auto-invited ${candidates.length} supplier${candidates.length > 1 ? 's' : ''} (${uniqueBidders} bidders detected)`,
                  status: 'executed',
                });

                toast({
                  title: "⚡ Smart Mode: Auto-invite",
                  description: `Invited ${candidates.length} suppliers to "${auction.title}"`,
                });
              }
            } catch {
              addAction({
                type: 'auto_invite',
                auctionTitle: auction.title,
                description: 'Auto-invite failed — will retry',
                status: 'skipped',
              });
            }
          } else {
            addAction({
              type: 'auto_invite',
              auctionTitle: auction.title,
              description: `Cooldown active (${Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastTime)) / 1000)}s remaining)`,
              status: 'cooldown',
            });
          }
        }

        // Rule: Stale detection
        if (ruleStates['anti_stale'] && bids.length > 0) {
          const lastBidTime = Math.max(...bids.map(b => new Date(b.created_at).getTime()));
          const secsSinceLast = (now - lastBidTime) / 1000;

          if (secsSinceLast > 300) {
            const staleKey = `stale_${auction.id}`;
            const lastStaleAlert = lastActionTime.current[staleKey] || 0;

            if (now - lastStaleAlert > COOLDOWN_SECONDS * 1000) {
              lastActionTime.current[staleKey] = now;
              addAction({
                type: 'notify',
                auctionTitle: auction.title,
                description: `No bids for ${Math.floor(secsSinceLast / 60)} minutes — auction may be stalling`,
                status: 'executed',
              });
            }
          }
        }

        // Rule: Aggressive pricing guard
        if (ruleStates['price_guard']) {
          const currentPrice = auction.current_price ?? auction.starting_price;
          const dropPct = ((auction.starting_price - currentPrice) / auction.starting_price) * 100;

          if (dropPct > 20) {
            const guardKey = `guard_${auction.id}`;
            const lastGuardAlert = lastActionTime.current[guardKey] || 0;

            if (now - lastGuardAlert > COOLDOWN_SECONDS * 1000) {
              lastActionTime.current[guardKey] = now;
              addAction({
                type: 'notify',
                auctionTitle: auction.title,
                description: `Price dropped ${dropPct.toFixed(1)}% — verify supplier credibility`,
                status: 'executed',
              });
            }
          }
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [smartEnabled, auctions, bidsMap, ruleStates, addAction, toast]);

  const statusIcon = {
    executed: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    skipped: <AlertTriangle className="w-3 h-3 text-amber-600" />,
    cooldown: <Clock className="w-3 h-3 text-muted-foreground" />,
  };

  return (
    <Card className={`border transition-all ${smartEnabled ? 'border-violet-300 dark:border-violet-700 bg-violet-50/30 dark:bg-violet-950/10' : ''}`}>
      <div className="p-3 space-y-3">
        {/* Header toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${smartEnabled ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted'}`}>
              <Bot className={`w-4 h-4 ${smartEnabled ? 'text-violet-600 animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                Smart Mode
                {smartEnabled && (
                  <Badge className="text-[9px] bg-violet-600 text-white border-0 animate-pulse">
                    ACTIVE
                  </Badge>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground">Autonomous auction optimization</p>
            </div>
          </div>
          <Switch checked={smartEnabled} onCheckedChange={setSmartEnabled} />
        </div>

        {/* Expand toggle */}
        {smartEnabled && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide rules & log' : 'Show rules & log'}
          </button>
        )}

        {/* Expanded: Rules + Action Log */}
        {smartEnabled && expanded && (
          <div className="space-y-3 pt-1">
            {/* Rule toggles */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rules</p>
              {RULES.map(rule => {
                const Icon = rule.icon;
                return (
                  <div key={rule.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{rule.label}</p>
                        <p className="text-[10px] text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={ruleStates[rule.id]}
                      onCheckedChange={(v) => setRuleStates(prev => ({ ...prev, [rule.id]: v }))}
                      className="scale-75"
                    />
                  </div>
                );
              })}
            </div>

            {/* Action log */}
            {actionLog.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <History className="w-3 h-3" /> Action Log
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {actionLog.slice(0, 8).map(action => (
                    <div key={action.id} className="flex items-start gap-2 text-[10px] py-1 border-b border-border/30 last:border-0">
                      {statusIcon[action.status]}
                      <div className="min-w-0 flex-1">
                        <span className="text-foreground font-medium">{action.auctionTitle}</span>
                        <span className="text-muted-foreground"> — {action.description}</span>
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {action.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {COOLDOWN_SECONDS}s cooldown between actions • All actions are logged
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
