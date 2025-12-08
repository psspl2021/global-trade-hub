import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const projectId = 'hsybhjjtxdwtpfvcmoqk';
    
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get date range from request body or use defaults (last 7 days)
    let startDate: string;
    let endDate: string;
    
    try {
      const body = await req.json();
      startDate = body.startDate || getDateString(-7);
      endDate = body.endDate || getDateString(0);
    } catch {
      startDate = getDateString(-7);
      endDate = getDateString(0);
    }

    console.log(`Fetching analytics from ${startDate} to ${endDate}`);

    const response = await fetch(
      `https://api.lovable.dev/v1/projects/${projectId}/analytics?startdate=${startDate}&enddate=${endDate}&granularity=daily`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analytics', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Analytics data received:', JSON.stringify(data).substring(0, 500));

    // Process and aggregate the data
    const analytics = processAnalyticsData(data);

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

function getDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

interface AnalyticsData {
  totalVisitors: number;
  totalPageviews: number;
  pageviewsPerVisit: number;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  dailyData: Array<{ date: string; visitors: number; pageviews: number }>;
}

function processAnalyticsData(rawData: any): AnalyticsData {
  // Default values in case of empty data
  const defaultResult: AnalyticsData = {
    totalVisitors: 0,
    totalPageviews: 0,
    pageviewsPerVisit: 0,
    topPages: [],
    topSources: [{ source: 'Direct', count: 0, percentage: 100 }],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    dailyData: [],
  };

  if (!rawData || !rawData.data) {
    return defaultResult;
  }

  const data = rawData.data;
  
  // Calculate totals
  let totalVisitors = 0;
  let totalPageviews = 0;
  const dailyData: Array<{ date: string; visitors: number; pageviews: number }> = [];
  const pageViewCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  let desktopCount = 0;
  let mobileCount = 0;
  let tabletCount = 0;

  // Process each day's data
  if (Array.isArray(data)) {
    for (const day of data) {
      const visitors = day.visitors || day.unique_visitors || 0;
      const pageviews = day.pageviews || day.page_views || 0;
      
      totalVisitors += visitors;
      totalPageviews += pageviews;
      
      dailyData.push({
        date: day.date || day.day || '',
        visitors,
        pageviews,
      });

      // Aggregate page views
      if (day.pages) {
        for (const page of day.pages) {
          const pagePath = page.path || page.page || '/';
          pageViewCounts[pagePath] = (pageViewCounts[pagePath] || 0) + (page.views || page.count || 1);
        }
      }

      // Aggregate sources
      if (day.sources) {
        for (const source of day.sources) {
          const sourceName = source.source || source.name || 'Direct';
          sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + (source.count || 1);
        }
      }

      // Aggregate devices
      if (day.devices) {
        desktopCount += day.devices.desktop || 0;
        mobileCount += day.devices.mobile || 0;
        tabletCount += day.devices.tablet || 0;
      }
    }
  }

  // Convert page views to sorted array
  const topPages = Object.entries(pageViewCounts)
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Convert sources to sorted array with percentages
  const totalSourceCount = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0) || 1;
  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalSourceCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // If no sources found, default to Direct
  if (topSources.length === 0) {
    topSources.push({ source: 'Direct', count: totalVisitors, percentage: 100 });
  }

  // Calculate device breakdown
  const totalDevices = desktopCount + mobileCount + tabletCount || 1;
  const deviceBreakdown = {
    desktop: Math.round((desktopCount / totalDevices) * 100),
    mobile: Math.round((mobileCount / totalDevices) * 100),
    tablet: Math.round((tabletCount / totalDevices) * 100),
  };

  return {
    totalVisitors,
    totalPageviews,
    pageviewsPerVisit: totalVisitors > 0 ? Math.round((totalPageviews / totalVisitors) * 10) / 10 : 0,
    topPages,
    topSources,
    deviceBreakdown,
    dailyData,
  };
}
