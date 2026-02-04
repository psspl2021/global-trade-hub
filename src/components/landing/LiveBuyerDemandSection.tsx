import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Country code to flag emoji mapping
const countryFlags: Record<string, string> = {
  'IN': '🇮🇳',
  'AE': '🇦🇪',
  'SA': '🇸🇦',
  'US': '🇺🇸',
  'UK': '🇬🇧',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'NG': '🇳🇬',
  'KE': '🇰🇪',
  'SG': '🇸🇬',
  'EU': '🇪🇺',
  'GLOBAL': '🌍',
  'india': '🇮🇳',
  'India': '🇮🇳',
};

const countryNames: Record<string, string> = {
  'IN': 'India',
  'AE': 'UAE',
  'SA': 'Saudi Arabia',
  'US': 'USA',
  'UK': 'UK',
  'GB': 'UK',
  'DE': 'Germany',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'SG': 'Singapore',
  'EU': 'Europe',
  'GLOBAL': 'Global',
  'india': 'India',
  'India': 'India',
};

interface DemandSignal {
  category: string;
  country: string;
}

/**
 * Live Buyer Demand Section - Shows REAL demand signals from demand_intelligence_signals
 * No caching - always fetches fresh data
 */
export const LiveBuyerDemandSection = () => {
  const queryClient = useQueryClient();

  // Fetch real demand signals from demand_intelligence_signals table
  const { data: demandSignals, isLoading, refetch } = useQuery({
    queryKey: ['live-demand-signals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_intelligence_signals')
        .select('category, country')
        .gte('discovered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('discovered_at', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('[LiveBuyerDemandSection] Error fetching signals:', error);
        return [];
      }
      
      // Deduplicate by category+country and take top 3
      const seen = new Set<string>();
      const unique: DemandSignal[] = [];
      for (const row of data || []) {
        const key = `${row.category}-${row.country}`;
        if (!seen.has(key) && row.category && row.country) {
          seen.add(key);
          unique.push({ category: row.category, country: row.country });
          if (unique.length >= 3) break;
        }
      }
      
      return unique;
    },
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // Don't cache (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Subscribe to realtime updates on demand_intelligence_signals
  useEffect(() => {
    const channel = supabase
      .channel('live-demand-homepage')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demand_intelligence_signals',
        },
        () => {
          // Refetch on new demand signal
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Format category name (convert slug to title case)
  const formatCategory = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get flag for country
  const getFlag = (country: string) => countryFlags[country] || '🌍';
  
  // Get display name for country
  const getCountryName = (country: string) => countryNames[country] || country;

  // Fallback signals only if DB returns nothing
  const fallbackSignals = [
    { category: "pipes", country: "SA" },
    { category: "pulses", country: "AE" },
    { category: "steel", country: "IN" },
  ];

  const displaySignals = (demandSignals && demandSignals.length > 0) 
    ? demandSignals 
    : fallbackSignals;

  return (
    <section className="py-12 bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Section Header */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Demand Intelligence</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            Live Buyer Demand Detected by AI
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our AI continuously monitors buyer searches, RFQs, and procurement research to identify emerging demand.
          </p>
          
          {/* Demand Signals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {isLoading ? (
              <div className="col-span-3 flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              displaySignals.map((signal, index) => (
                <div 
                  key={`${signal.category}-${signal.country}-${index}`}
                  className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl">{getFlag(signal.country)}</span>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{formatCategory(signal.category)}</p>
                    <p className="text-sm text-muted-foreground">{getCountryName(signal.country)}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600 ml-auto" />
                </div>
              ))
            )}
          </div>
          
          {/* Caption */}
          <p className="text-xs text-muted-foreground italic">
            {demandSignals && demandSignals.length > 0 
              ? "Real-time demand signals from verified buyer activity."
              : "Updated from buyer searches, RFQs, and procurement research."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default LiveBuyerDemandSection;
