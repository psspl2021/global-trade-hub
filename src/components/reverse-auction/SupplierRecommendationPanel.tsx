/**
 * Supplier Recommendation Panel
 * Shows AI-ranked top 5 suppliers for a category
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Trophy, Plus, Star } from 'lucide-react';
import { useSupplierRecommendation, SupplierRecommendation } from '@/hooks/useSupplierRecommendation';

interface SupplierRecommendationPanelProps {
  category: string;
  onAddSupplier: (supplier: { id: string; company_name: string; contact_person: string; city: string | null; email?: string | null }) => void;
  invitedIds: Set<string>;
}

export function SupplierRecommendationPanel({ category, onAddSupplier, invitedIds }: SupplierRecommendationPanelProps) {
  const { recommendations, isLoading, getRecommendations } = useSupplierRecommendation();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (category && !loaded) {
      getRecommendations(category);
      setLoaded(true);
    }
  }, [category, loaded, getRecommendations]);

  // Re-fetch if category changes
  useEffect(() => {
    setLoaded(false);
  }, [category]);

  if (!category || (recommendations.length === 0 && !isLoading)) return null;

  return (
    <Card className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          AI Recommended Suppliers
          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Top 5</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Analyzing supplier performance...</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, idx) => {
              const isInvited = invitedIds.has(rec.supplier_id);
              return (
                <div key={rec.supplier_id} className="flex items-center justify-between p-2 rounded-md bg-background border text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{rec.company_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
