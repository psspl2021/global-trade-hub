/**
 * Supplier Recommendation Panel (Buyer Network-Scoped)
 * Shows AI-ranked top 5 suppliers from buyer's own network
 * Includes auto-invite for top performers
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Plus, Star, Shield, Zap, UserPlus, Wand2, TrendingUp, Handshake, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useSupplierRecommendation, SupplierRecommendation } from '@/hooks/useSupplierRecommendation';
import { useToast } from '@/hooks/use-toast';

interface SupplierRecommendationPanelProps {
  category: string;
  buyerId?: string;
  onAddSupplier: (supplier: { id: string; company_name: string; contact_person: string; city: string | null; email?: string | null }) => void;
  invitedIds: Set<string>;
}

const BADGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  trusted: { label: 'Worked with you', icon: <Shield className="w-3 h-3" />, className: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  high_performer: { label: 'High win rate', icon: <Zap className="w-3 h-3" />, className: 'border-amber-300 text-amber-700 bg-amber-50' },
  new_promising: { label: 'New & promising', icon: <UserPlus className="w-3 h-3" />, className: 'border-blue-300 text-blue-700 bg-blue-50' },
};

const AUTO_INVITE_COUNT = 3;
const MAX_TOTAL_INVITES = 10;

export function SupplierRecommendationPanel({ category, buyerId, onAddSupplier, invitedIds }: SupplierRecommendationPanelProps) {
  const { recommendations, isLoading, getRecommendations, isNetworkMode, setIsNetworkMode } = useSupplierRecommendation();
  const [loaded, setLoaded] = useState(false);
  const [autoInviting, setAutoInviting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (category && !loaded) {
      getRecommendations(category, buyerId);
      setLoaded(true);
    }
  }, [category, loaded, getRecommendations, buyerId]);

  useEffect(() => {
    setLoaded(false);
  }, [category, isNetworkMode]);

  const availableSlots = Math.max(0, MAX_TOTAL_INVITES - invitedIds.size);
  const uninvitedTopSuppliers = recommendations
    .filter(s => !invitedIds.has(s.supplier_id))
    .slice(0, Math.min(AUTO_INVITE_COUNT, availableSlots));
  const canAutoInvite = uninvitedTopSuppliers.length > 0 && availableSlots > 0;

  const handleAutoInvite = useCallback(async () => {
    if (!canAutoInvite) return;
    setAutoInviting(true);
    try {
      for (const s of uninvitedTopSuppliers) {
        onAddSupplier({
          id: s.supplier_id,
          company_name: s.company_name,
          contact_person: s.contact_person,
          city: s.city,
          email: s.email,
        });
        await new Promise(res => setTimeout(res, 100));
      }
      toast({
        title: `⚡ ${uninvitedTopSuppliers.length} top suppliers auto-invited`,
        description: 'Based on your past auctions & supplier performance',
      });
    } finally {
      setAutoInviting(false);
    }
  }, [canAutoInvite, uninvitedTopSuppliers, onAddSupplier, toast]);

  if (!category) return null;

  return (
    <Card className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            AI Recommended Suppliers
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
              {isNetworkMode ? 'Your Network' : 'All'}
            </Badge>
          </CardTitle>
          {!isLoading && canAutoInvite && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
              onClick={handleAutoInvite}
              disabled={autoInviting}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {autoInviting ? 'Inviting...' : `Invite best suppliers instantly`}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isNetworkMode
            ? 'Based on your past auctions & supplier interactions'
            : 'Showing all suppliers in this category'}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Analyzing supplier performance...</p>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              {isNetworkMode
                ? 'No suppliers from your network found for this category.'
                : 'No suppliers found for this category.'}
            </p>
            {isNetworkMode && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => setIsNetworkMode(false)}
              >
                <Plus className="w-3 h-3" /> Explore New Suppliers
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, idx) => {
              const isInvited = invitedIds.has(rec.supplier_id);
              const badgeInfo = rec.badge ? BADGE_CONFIG[rec.badge] : null;
              const isExpanded = expandedId === rec.supplier_id;
              const competitivenessLabel = rec.avg_price_competitiveness >= 0.7 ? 'High' : rec.avg_price_competitiveness >= 0.4 ? 'Medium' : 'Low';
              
              return (
                <div key={rec.supplier_id} className="rounded-md bg-background border overflow-hidden">
                  <div
                    className="flex items-center justify-between p-2 text-sm cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rec.supplier_id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{rec.company_name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {rec.city && <span>{rec.city}</span>}
                          {rec.total_wins > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <Trophy className="w-3 h-3" />
                              {rec.total_wins} wins
                            </span>
                          )}
                        </div>
                        {badgeInfo && (
                          <Badge variant="outline" className={`text-[10px] mt-1 gap-0.5 ${badgeInfo.className}`}>
                            {badgeInfo.icon} {badgeInfo.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-xs font-semibold">{(rec.score * 100).toFixed(0)}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            Trust score based on win rate, pricing & history
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      {isInvited ? (
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">Invited</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddSupplier({
                              id: rec.supplier_id,
                              company_name: rec.company_name,
                              contact_person: rec.contact_person,
                              city: rec.city,
                              email: rec.email,
                            });
                          }}
                        >
                          <Plus className="w-3 h-3" /> Invite
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Trust Score Breakdown */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t bg-muted/20 space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Trust Signals</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-muted-foreground">Win rate:</span>
                          <span className="font-semibold text-foreground">{(rec.win_rate * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-muted-foreground">Pricing:</span>
                          <span className="font-semibold text-foreground">{competitivenessLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="text-muted-foreground">Auctions:</span>
                          <span className="font-semibold text-foreground">{rec.total_participations}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Handshake className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="text-muted-foreground">Relationship:</span>
                          <span className="font-semibold text-foreground">{rec.hasWorkedWithBuyer ? 'Established' : 'New'}</span>
                        </div>
                      </div>
                      {rec.isNewSupplier && (
                        <p className="text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/30 rounded px-2 py-1">
                          🆕 New supplier — boosted in rankings to encourage network diversity
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Toggle between network and explore mode */}
            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setIsNetworkMode(!isNetworkMode)}
              >
                {isNetworkMode ? '+ Explore New Suppliers' : '← Back to Your Network'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
