import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Globe, Monitor, Smartphone, Tablet, TrendingUp, Eye, FileText, Users, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VisitorAnalytics {
  totalVisitors: number;
  totalPageviews: number;
  pageviewsPerVisit: number;
  avgTimeSpentSeconds?: number;
  avgTimePerPage?: Array<{ page: string; avgSeconds: number; visits: number }>;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  dailyData: Array<{ date: string; visitors: number; pageviews: number }>;
  countryBreakdown: Array<{ country: string; countryCode: string; visitors: number; percentage: number }>;
}

interface VisitorAnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: VisitorAnalytics | null;
  selectedDays?: number;
}

// Country code to flag emoji mapping
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export function VisitorAnalyticsModal({ open, onOpenChange, analytics, selectedDays = 7 }: VisitorAnalyticsModalProps) {
  if (!analytics) return null;

  // Format daily data for the chart
  const chartData = analytics.dailyData.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Format time spent
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDateRangeLabel = () => {
    if (selectedDays === 365) return 'Last 365 days';
    if (selectedDays === 90) return 'Last 90 days';
    if (selectedDays === 30) return 'Last 30 days';
    return 'Last 7 days';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Detailed Visitor Analytics
            <span className="ml-auto text-sm text-muted-foreground font-normal">{getDateRangeLabel()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs text-muted-foreground">Total Visitors</span>
                </div>
                <div className="text-2xl font-bold text-indigo-600 mt-1">{analytics.totalVisitors}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">Page Views</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{analytics.totalPageviews}</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Pages/Visit</span>
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">{analytics.pageviewsPerVisit}</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Avg Time/Visit</span>
                </div>
                <div className="text-2xl font-bold text-amber-600 mt-1">
                  {formatTime(analytics.avgTimeSpentSeconds || 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">Countries</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-1">{analytics.countryBreakdown?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trends Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Visitor Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="visitors" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2 }}
                      name="Visitors"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pageviews" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      name="Page Views"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No daily data available
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Geographic Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Geographic Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.countryBreakdown && analytics.countryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.countryBreakdown.map((country, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span>{getCountryFlag(country.countryCode)}</span>
                            <span>{country.country}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {country.visitors} ({country.percentage}%)
                          </span>
                        </div>
                        <Progress value={country.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No geographic data available</p>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        Desktop
                      </span>
                      <span className="text-muted-foreground">{analytics.deviceBreakdown.desktop}%</span>
                    </div>
                    <Progress value={analytics.deviceBreakdown.desktop} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        Mobile
                      </span>
                      <span className="text-muted-foreground">{analytics.deviceBreakdown.mobile}%</span>
                    </div>
                    <Progress value={analytics.deviceBreakdown.mobile} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Tablet className="h-4 w-4 text-purple-600" />
                        Tablet
                      </span>
                      <span className="text-muted-foreground">{analytics.deviceBreakdown.tablet}%</span>
                    </div>
                    <Progress value={analytics.deviceBreakdown.tablet} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topPages.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topPages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]" title={page.page}>
                          {page.page || '/'}
                        </span>
                        <span className="text-muted-foreground">{page.views} views</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No page data available</p>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topSources.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topSources.slice(0, 5).map((source, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{source.source}</span>
                          <span className="text-muted-foreground">{source.percentage}%</span>
                        </div>
                        <Progress value={source.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No source data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Time Per Page */}
          {analytics.avgTimePerPage && analytics.avgTimePerPage.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Average Time Per Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.avgTimePerPage.slice(0, 8).map((page, index) => {
                    const maxTime = analytics.avgTimePerPage?.[0]?.avgSeconds || 1;
                    const percentage = (page.avgSeconds / maxTime) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[250px]" title={page.page}>
                            {page.page || '/'}
                          </span>
                          <span className="text-muted-foreground">
                            {formatTime(page.avgSeconds)} ({page.visits} visits)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
