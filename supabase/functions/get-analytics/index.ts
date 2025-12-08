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
    // Get date range from request body
    let startDate: string;
    let endDate: string;
    let days: number = 7;
    
    try {
      const body = await req.json();
      startDate = body.startDate || getDateString(-7);
      endDate = body.endDate || getDateString(0);
      days = body.days || 7;
    } catch {
      startDate = getDateString(-7);
      endDate = getDateString(0);
    }

    console.log(`Generating analytics from ${startDate} to ${endDate} (${days} days)`);

    // Generate sample analytics data based on date range
    const analytics = generateSampleAnalytics(startDate, endDate, days);

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
  countryBreakdown: Array<{ country: string; countryCode: string; visitors: number; percentage: number }>;
}

function generateSampleAnalytics(startDate: string, endDate: string, days: number): AnalyticsData {
  // Generate daily data based on date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dailyData: Array<{ date: string; visitors: number; pageviews: number }> = [];
  
  let totalVisitors = 0;
  let totalPageviews = 0;
  
  // Scale base visitors based on time range
  const baseMultiplier = days <= 7 ? 1 : days <= 30 ? 1.2 : days <= 90 ? 1.5 : 2;
  
  // Generate data for each day
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Generate realistic random values scaled by multiplier
    const baseVisitors = Math.floor((5 + Math.floor(Math.random() * 15)) * baseMultiplier);
    const visitors = baseVisitors;
    const pageviews = visitors + Math.floor(Math.random() * visitors * 1.5);
    
    totalVisitors += visitors;
    totalPageviews += pageviews;
    
    dailyData.push({
      date: currentDate.toISOString().split('T')[0],
      visitors,
      pageviews,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalVisitors,
    totalPageviews,
    pageviewsPerVisit: totalVisitors > 0 ? Math.round((totalPageviews / totalVisitors) * 10) / 10 : 0,
    topPages: [
      { page: '/', views: Math.floor(totalPageviews * 0.42) },
      { page: '/login', views: Math.floor(totalPageviews * 0.14) },
      { page: '/categories', views: Math.floor(totalPageviews * 0.12) },
      { page: '/dashboard', views: Math.floor(totalPageviews * 0.10) },
      { page: '/signup', views: Math.floor(totalPageviews * 0.08) },
      { page: '/browse', views: Math.floor(totalPageviews * 0.06) },
      { page: '/book-truck', views: Math.floor(totalPageviews * 0.04) },
      { page: '/source/india', views: Math.floor(totalPageviews * 0.04) },
    ],
    topSources: [
      { source: 'Direct', count: Math.floor(totalVisitors * 0.42), percentage: 42 },
      { source: 'Google', count: Math.floor(totalVisitors * 0.28), percentage: 28 },
      { source: 'Instagram', count: Math.floor(totalVisitors * 0.12), percentage: 12 },
      { source: 'Facebook', count: Math.floor(totalVisitors * 0.10), percentage: 10 },
      { source: 'LinkedIn', count: Math.floor(totalVisitors * 0.05), percentage: 5 },
      { source: 'Twitter', count: Math.floor(totalVisitors * 0.03), percentage: 3 },
    ],
    deviceBreakdown: {
      desktop: 68,
      mobile: 28,
      tablet: 4,
    },
    dailyData,
    countryBreakdown: [
      { country: 'India', countryCode: 'IN', visitors: Math.floor(totalVisitors * 0.72), percentage: 72 },
      { country: 'United States', countryCode: 'US', visitors: Math.floor(totalVisitors * 0.12), percentage: 12 },
      { country: 'United Kingdom', countryCode: 'GB', visitors: Math.floor(totalVisitors * 0.06), percentage: 6 },
      { country: 'United Arab Emirates', countryCode: 'AE', visitors: Math.floor(totalVisitors * 0.04), percentage: 4 },
      { country: 'Singapore', countryCode: 'SG', visitors: Math.floor(totalVisitors * 0.03), percentage: 3 },
      { country: 'Germany', countryCode: 'DE', visitors: Math.floor(totalVisitors * 0.02), percentage: 2 },
      { country: 'Australia', countryCode: 'AU', visitors: Math.floor(totalVisitors * 0.01), percentage: 1 },
    ],
  };
}
