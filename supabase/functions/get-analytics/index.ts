import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    try {
      const body = await req.json();
      days = body.days || 7;
    } catch {
      // Use default
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    console.log(`Fetching real analytics for last ${days} days from ${startDateStr}`);

    // Fetch all page visits in date range
    const { data: visits, error } = await supabase
      .from('page_visits')
      .select('*')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching page visits:', error);
      throw error;
    }

    console.log(`Found ${visits?.length || 0} page visits`);

    // If no data, return zeros
    if (!visits || visits.length === 0) {
      return new Response(
        JSON.stringify({
          totalVisitors: 0,
          totalPageviews: 0,
          pageviewsPerVisit: 0,
          topPages: [],
          topSources: [],
          deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
          dailyData: [],
          countryBreakdown: [],
        }),
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

    const analytics = {
      totalVisitors: uniqueVisitors,
      totalPageviews,
      pageviewsPerVisit,
      topPages,
      topSources,
      deviceBreakdown,
      dailyData,
      countryBreakdown,
    };

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
