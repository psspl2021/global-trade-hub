/**
 * Supplier Relationship Graph
 * Visual representation of supplier participation frequency and strength
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Network, Users, Trophy, TrendingDown, ChevronDown, ChevronUp,
  Star, Activity, RefreshCw
} from 'lucide-react';
import { useSupplierGraph, SupplierNode } from '@/hooks/useSupplierGraph';

interface SupplierRelationshipGraphProps {
  buyerId: string;
}

const STRENGTH_CONFIG = {
  strong: { label: 'Strong', color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30', bar: 'bg-emerald-500' },
  moderate: { label: 'Moderate', color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30', bar: 'bg-blue-500' },
  weak: { label: 'New', color: 'text-muted-foreground', bg: 'bg-muted', bar: 'bg-muted-foreground/40' },
};

function formatRatio(ratio: number): string {
  const pct = ((1 - ratio) * 100);
  if (pct > 0) return `${pct.toFixed(0)}% below avg`;
  if (pct < 0) return `${Math.abs(pct).toFixed(0)}% above avg`;
  return 'At average';
}

export function SupplierRelationshipGraph({ buyerId }: SupplierRelationshipGraphProps) {
  const { nodes, loading, refresh } = useSupplierGraph(buyerId);
  const [expanded, setExpanded] = useState(false);

  if (loading && nodes.length === 0) return null;
  if (nodes.length === 0) return null;

  const maxParticipation = Math.max(...nodes.map(n => n.participation_count), 1);
  const strongCount = nodes.filter(n => n.strength === 'strong').length;
  const totalWins = nodes.reduce((sum, n) => sum + n.wins, 0);
  const avgRatio = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + n.avg_bid_ratio, 0) / nodes.length
    : 1;

  return (
    <Card className="border">
      <div className="p-3 space-y-3">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Network className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Supplier Network</p>
              <p className="text-[10px] text-muted-foreground">
                {nodes.length} suppliers • {strongCount} strong relationships
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {totalWins} wins
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 pt-1">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <p className="text-lg font-bold text-foreground">{nodes.length}</p>
                <p className="text-[10px] text-muted-foreground">Total Suppliers</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <p className="text-lg font-bold text-emerald-600">{strongCount}</p>
                <p className="text-[10px] text-muted-foreground">Strong Relations</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/40">
                <p className="text-lg font-bold text-primary">
                  {avgRatio < 1 ? `${((1 - avgRatio) * 100).toFixed(0)}%` : '0%'}
                </p>
                <p className="text-[10px] text-muted-foreground">Avg Savings</p>
              </div>
            </div>

            {/* Supplier list */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {nodes.slice(0, 15).map((node, idx) => {
                const cfg = STRENGTH_CONFIG[node.strength];
                const barWidth = (node.participation_count / maxParticipation) * 100;

                return (
                  <div key={node.supplier_id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                    {/* Rank */}
                    <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">
                      {idx + 1}
                    </span>

                    {/* Bar + Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            Supplier {node.supplier_id.slice(0, 6)}
                          </span>
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 border-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Activity className="w-3 h-3" />
                            {node.participation_count}
                          </span>
                          {node.wins > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Trophy className="w-3 h-3" />
                              {node.wins}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Participation bar */}
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>

                      {/* Categories */}
                      {node.categories.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {node.categories.slice(0, 3).map(cat => (
                            <span key={cat} className="text-[9px] text-muted-foreground bg-muted/60 rounded px-1">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {nodes.length > 15 && (
              <p className="text-[10px] text-center text-muted-foreground">
                +{nodes.length - 15} more suppliers
              </p>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="w-full text-xs gap-1.5 h-7"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
