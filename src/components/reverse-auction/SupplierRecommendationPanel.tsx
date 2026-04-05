/**
 * Supplier Recommendation Panel (Buyer Network-Scoped)
 * Shows AI-ranked top 5 suppliers from buyer's own network
 * Includes auto-invite for top performers
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Plus, Star, Shield, Zap, UserPlus, Wand2 } from 'lucide-react';
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

  const uninvitedTopSuppliers = recommendations.filter(s => !invitedIds.has(s.supplier_id)).slice(0, AUTO_INVITE_COUNT);
  const canAutoInvite = uninvitedTopSuppliers.length > 0 && invitedIds.size < MAX_TOTAL_INVITES;

  const handleAutoInvite = useCallback(() => {
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
              {autoInviting ? 'Inviting...' : `Auto-invite top ${uninvitedTopSuppliers.length}`}
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
              return (
                <div key={rec.supplier_id} className="flex items-center justify-between p-2 rounded-md bg-background border text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
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
                        {rec.total_participations > 0 && (
                          <span>{rec.total_participations} auctions</span>
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
                    <div className="text-right mr-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-semibold">{(rec.score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    {isInvited ? (
                      <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300">Invited</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => onAddSupplier({
                          id: rec.supplier_id,
                          company_name: rec.company_name,
                          contact_person: rec.contact_person,
                          city: rec.city,
                          email: rec.email,
                        })}
                      >
                        <Plus className="w-3 h-3" /> Invite
                      </Button>
                    )}
                  </div>
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
