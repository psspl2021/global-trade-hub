import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let days = 7;
    let includeSEM = false;
    try {
      const body = await req.json();
      days = body.days || 7;
      includeSEM = body.includeSEM || false;
    } catch {
      // Use default
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    console.log(`Fetching real analytics for last ${days} days from ${startDateStr}, includeSEM: ${includeSEM}`);

    // Fetch all page visits in date range - need to handle pagination for large datasets
    // Supabase has a default limit of 1000 rows, so we need to fetch in batches
    let allVisits: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;

    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('page_visits')
        .select('*')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (batchError) {
        console.error('Error fetching page visits batch:', batchError);
        throw batchError;
      }

      if (batch && batch.length > 0) {
        allVisits = allVisits.concat(batch);
        offset += batchSize;
        hasMore = batch.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    const visits = allVisits;

    console.log(`Found ${visits?.length || 0} page visits`);

    // If no data, return zeros
    if (!visits || visits.length === 0) {
      const emptyResponse: any = {
        totalVisitors: 0,
        totalPageviews: 0,
        pageviewsPerVisit: 0,
        topPages: [],
        topSources: [],
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
        dailyData: [],
        countryBreakdown: [],
      };
      
      if (includeSEM) {
        emptyResponse.semAnalytics = {
          totalUtmVisits: 0,
          googleAdsClicks: 0,
          activeCampaigns: 0,
          topSource: null,
          campaignBreakdown: [],
          sourceBreakdown: [],
          mediumBreakdown: [],
          keywordPerformance: [],
          dailyCampaignData: [],
        };
      }
      
      return new Response(
        JSON.stringify(emptyResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate metrics
    const uniqueVisitors = new Set(visits.map(v => v.visitor_id)).size;
    const totalPageviews = visits.length;
    const pageviewsPerVisit = uniqueVisitors > 0 ? Math.round((totalPageviews / uniqueVisitors) * 10) / 10 : 0;

    // Top pages
    const pageCounts: Record<string, number> = {};
    visits.forEach(v => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Traffic sources
    const sourceCounts: Record<string, number> = {};
    visits.forEach(v => {
      const source = v.source || 'Direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / totalPageviews) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    visits.forEach(v => {
      const device = v.device_type || 'desktop';
      if (device in deviceCounts) {
        deviceCounts[device]++;
      }
    });
    const totalDevices = deviceCounts.desktop + deviceCounts.mobile + deviceCounts.tablet;
    const deviceBreakdown = {
      desktop: totalDevices > 0 ? Math.round((deviceCounts.desktop / totalDevices) * 100) : 0,
      mobile: totalDevices > 0 ? Math.round((deviceCounts.mobile / totalDevices) * 100) : 0,
      tablet: totalDevices > 0 ? Math.round((deviceCounts.tablet / totalDevices) * 100) : 0,
    };

    // Daily data
    const dailyCounts: Record<string, { visitors: Set<string>; pageviews: number }> = {};
    visits.forEach(v => {
      const date = v.created_at.split('T')[0];
      if (!dailyCounts[date]) {
        dailyCounts[date] = { visitors: new Set(), pageviews: 0 };
      }
      dailyCounts[date].visitors.add(v.visitor_id);
      dailyCounts[date].pageviews++;
    });
    const dailyData = Object.entries(dailyCounts)
      .map(([date, data]) => ({
        date,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Country breakdown (from country field if available)
    const countryCounts: Record<string, { count: number; code: string }> = {};
    visits.forEach(v => {
      if (v.country) {
        if (!countryCounts[v.country]) {
          countryCounts[v.country] = { count: 0, code: v.country_code || '' };
        }
        countryCounts[v.country].count++;
      }
    });
    const countryBreakdown = Object.entries(countryCounts)
      .map(([country, data]) => ({
        country,
        countryCode: data.code,
        visitors: data.count,
        percentage: Math.round((data.count / totalPageviews) * 100),
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    const analytics: any = {
      totalVisitors: uniqueVisitors,
      totalPageviews,
      pageviewsPerVisit,
      topPages,
      topSources,
      deviceBreakdown,
      dailyData,
      countryBreakdown,
    };

    // SEM Analytics - only calculate if requested
    if (includeSEM) {
      console.log('Calculating SEM analytics...');
      
      // Filter UTM-tagged visits
      const utmVisits = visits.filter(v => v.utm_source || v.utm_campaign || v.utm_medium || v.gclid);
      const totalUtmVisits = utmVisits.length;
      const googleAdsClicks = visits.filter(v => v.gclid).length;
      
      // Campaign breakdown
      const campaignMap: Record<string, { source: string; medium: string; visits: number }> = {};
      utmVisits.forEach(v => {
        const campaign = v.utm_campaign || '(not set)';
        if (!campaignMap[campaign]) {
          campaignMap[campaign] = {
            source: v.utm_source || '(direct)',
            medium: v.utm_medium || '(none)',
            visits: 0,
          };
        }
        campaignMap[campaign].visits++;
      });
      const campaignBreakdown = Object.entries(campaignMap)
        .map(([campaign, data]) => ({
          campaign,
          source: data.source,
          medium: data.medium,
          visits: data.visits,
          percentage: totalUtmVisits > 0 ? Math.round((data.visits / totalUtmVisits) * 100) : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20);

      // Source breakdown (from UTM)
      const utmSourceCounts: Record<string, number> = {};
      utmVisits.forEach(v => {
        const source = v.utm_source || '(direct)';
        utmSourceCounts[source] = (utmSourceCounts[source] || 0) + 1;
      });
      const sourceBreakdown = Object.entries(utmSourceCounts)
        .map(([source, visits]) => ({
          source,
          visits,
          percentage: totalUtmVisits > 0 ? Math.round((visits / totalUtmVisits) * 100) : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      // Medium breakdown
      const mediumCounts: Record<string, number> = {};
      utmVisits.forEach(v => {
        const medium = v.utm_medium || '(none)';
        mediumCounts[medium] = (mediumCounts[medium] || 0) + 1;
      });
      const mediumBreakdown = Object.entries(mediumCounts)
        .map(([medium, visits]) => ({
          medium,
          visits,
          percentage: totalUtmVisits > 0 ? Math.round((visits / totalUtmVisits) * 100) : 0,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      // Keyword performance (utm_term)
      const keywordCounts: Record<string, { visits: number; campaign: string }> = {};
      utmVisits.forEach(v => {
        if (v.utm_term) {
          if (!keywordCounts[v.utm_term]) {
            keywordCounts[v.utm_term] = { visits: 0, campaign: v.utm_campaign || '(not set)' };
          }
          keywordCounts[v.utm_term].visits++;
        }
      });
      const keywordPerformance = Object.entries(keywordCounts)
        .map(([term, data]) => ({
          term,
          visits: data.visits,
          campaign: data.campaign,
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 20);

      // Daily campaign data
      const dailyCampaignMap: Record<string, Record<string, number>> = {};
      utmVisits.forEach(v => {
        const date = v.created_at.split('T')[0];
        const campaign = v.utm_campaign || '(not set)';
        if (!dailyCampaignMap[date]) {
          dailyCampaignMap[date] = {};
        }
        dailyCampaignMap[date][campaign] = (dailyCampaignMap[date][campaign] || 0) + 1;
      });
      
      const dailyCampaignData: Array<{ date: string; campaign: string; visits: number }> = [];
      Object.entries(dailyCampaignMap).forEach(([date, campaigns]) => {
        Object.entries(campaigns).forEach(([campaign, visits]) => {
          dailyCampaignData.push({ date, campaign, visits });
        });
      });
      dailyCampaignData.sort((a, b) => a.date.localeCompare(b.date));

      // Top source with most visits
      const topSource = sourceBreakdown.length > 0 
        ? { name: sourceBreakdown[0].source, visits: sourceBreakdown[0].visits }
        : null;

      analytics.semAnalytics = {
        totalUtmVisits,
        googleAdsClicks,
        activeCampaigns: Object.keys(campaignMap).length,
        topSource,
        campaignBreakdown,
        sourceBreakdown,
        mediumBreakdown,
        keywordPerformance,
        dailyCampaignData,
      };

      console.log('SEM analytics calculated:', {
        utmVisits: totalUtmVisits,
        googleAdsClicks,
        campaigns: Object.keys(campaignMap).length,
      });
    }

    console.log('Analytics calculated:', {
      visitors: uniqueVisitors,
      pageviews: totalPageviews,
      sources: topSources.length,
    });

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-analytics function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
