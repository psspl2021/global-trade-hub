import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  MousePointerClick, 
  TrendingUp, 
  Globe, 
  RefreshCw, 
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Search
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SEMAnalytics {
  totalUtmVisits: number;
  googleAdsClicks: number;
  activeCampaigns: number;
  topSource: { name: string; visits: number } | null;
  campaignBreakdown: Array<{
    campaign: string;
    source: string;
    medium: string;
    visits: number;
    percentage: number;
  }>;
  sourceBreakdown: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  mediumBreakdown: Array<{
    medium: string;
    visits: number;
    percentage: number;
  }>;
  keywordPerformance: Array<{
    term: string;
    visits: number;
    campaign: string;
  }>;
  dailyCampaignData: Array<{
    date: string;
    campaign: string;
    visits: number;
  }>;
}

interface SEMAnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

export function SEMAnalyticsDashboard({ open, onOpenChange }: SEMAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [semData, setSemData] = useState<SEMAnalytics | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const fetchSEMAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: { days: selectedDays, includeSEM: true },
      });

      if (error) {
        console.error('Error fetching SEM analytics:', error);
        return;
      }

      if (data?.semAnalytics) {
        setSemData(data.semAnalytics);
      }
    } catch (error) {
      console.error('Error fetching SEM analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSEMAnalytics();
    }
  }, [open, selectedDays]);

  // Process daily campaign data for line chart
  const processedDailyData = () => {
    if (!semData?.dailyCampaignData) return [];
    
    const dateMap: Record<string, Record<string, number>> = {};
    semData.dailyCampaignData.forEach(item => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = {};
      }
      dateMap[item.date][item.campaign] = item.visits;
    });

    return Object.entries(dateMap)
      .map(([date, campaigns]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...campaigns,
      }))
      .slice(-14); // Last 14 days
  };

  // Get unique campaigns for line chart
  const getUniqueCampaigns = () => {
    if (!semData?.dailyCampaignData) return [];
    return [...new Set(semData.dailyCampaignData.map(d => d.campaign))].slice(0, 5);
  };

  const exportToCSV = () => {
    if (!semData) return;

    const campaignData = semData.campaignBreakdown.map(c => ({
      Campaign: c.campaign,
      Source: c.source,
      Medium: c.medium,
      Visits: c.visits,
      'Percentage': `${c.percentage}%`,
    }));

    const csvContent = [
      Object.keys(campaignData[0] || {}).join(','),
      ...campaignData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sem-analytics-${selectedDays}days.csv`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-6 w-6 text-primary" />
            SEM Analytics Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <Select value={String(selectedDays)} onValueChange={(val) => setSelectedDays(Number(val))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSEMAnalytics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!semData}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : semData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-indigo-500/20 bg-indigo-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs text-muted-foreground">UTM Visits</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">{semData.totalUtmVisits.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-muted-foreground">Google Ads Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-600">{semData.googleAdsClicks.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Active Campaigns</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{semData.activeCampaigns}</div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-purple-600" />
                    <span className="text-xs text-muted-foreground">Top Source</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600 truncate">
                    {semData.topSource?.name || 'N/A'}
                  </div>
                  {semData.topSource && (
                    <div className="text-xs text-muted-foreground">{semData.topSource.visits} visits</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="campaigns" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {semData.campaignBreakdown.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Medium</TableHead>
                            <TableHead className="text-right">Visits</TableHead>
                            <TableHead className="w-[120px]">Share</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {semData.campaignBreakdown.map((campaign, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {campaign.campaign}
                                </Badge>
                              </TableCell>
                              <TableCell>{campaign.source}</TableCell>
                              <TableCell>{campaign.medium}</TableCell>
                              <TableCell className="text-right font-medium">{campaign.visits}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={campaign.percentage} className="h-2 w-16" />
                                  <span className="text-xs text-muted-foreground w-8">{campaign.percentage}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No campaign data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sources Tab */}
              <TabsContent value="sources" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        Traffic by Source
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {semData.sourceBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={semData.sourceBreakdown}
                              dataKey="visits"
                              nameKey="source"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ source, percentage }) => `${source}: ${percentage}%`}
                              labelLine={false}
                            >
                              {semData.sourceBreakdown.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No source data</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Traffic by Medium
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {semData.mediumBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={semData.mediumBreakdown} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="medium" type="category" width={80} />
                            <Tooltip />
                            <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No medium data</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Campaign Trends (Last 14 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {processedDailyData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedDailyData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {getUniqueCampaigns().map((campaign, idx) => (
                            <Line
                              key={campaign}
                              type="monotone"
                              dataKey={campaign}
                              stroke={COLORS[idx % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No trend data available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Keywords Tab */}
              <TabsContent value="keywords" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Keyword Performance (UTM Term)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {semData.keywordPerformance.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Keyword</TableHead>
                            <TableHead>Campaign</TableHead>
                            <TableHead className="text-right">Visits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {semData.keywordPerformance.map((keyword, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {keyword.term}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{keyword.campaign}</TableCell>
                              <TableCell className="text-right font-medium">{keyword.visits}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No keyword data available. Use utm_term parameter in your campaigns to track keywords.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">Unable to load SEM analytics</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
