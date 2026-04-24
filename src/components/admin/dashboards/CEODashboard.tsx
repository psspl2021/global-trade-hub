/**
 * CEO Dashboard — Strategic Intelligence (Read-only)
 * Shows: Control Tower, Demand Heatmap, AI Sales (analytics), Revenue, Invoices, Visitors
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield, TrendingUp, Sparkles, IndianRupee, FileText,
  BarChart3, RefreshCw, Monitor, Smartphone, Globe
} from 'lucide-react';

interface CEODashboardProps {
  stats: {
    pendingInvoices: number;
    pendingInvoiceAmount: number;
    totalCollected: number;
  };
  visitorStats: {
    totalVisitors: number;
    pageViews: number;
    desktopPercent: number;
    mobilePercent: number;
    pagesPerVisit: number;
    topCountries: Array<{ country: string; percentage: number }>;
    topSources: Array<{ source: string; percentage: number }>;
    lastUpdated: string;
  };
  statsLoading: boolean;
  selectedDays: number;
  onSelectedDaysChange: (days: number) => void;
  onRefresh: () => void;
  onOpenView: (view: string) => void;
  onOpenAnalyticsModal: () => void;
  userName: string;
}

export function CEODashboard({
  stats, visitorStats, statsLoading, selectedDays,
  onSelectedDaysChange, onRefresh, onOpenView, onOpenAnalyticsModal, userName
}: CEODashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Strategic Intelligence Dashboard</p>
      </div>

      {/* Row 1 — Strategic Command */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 text-white border-0">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />Control Tower
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">Platform analytics, financial metrics & KPIs</p>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => onOpenView('platform-control')}>
              <Shield className="h-4 w-4 mr-2" />Open Control Tower
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-rose-500" />Demand Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Global demand intelligence across 196 countries</p>
            <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white" onClick={() => onOpenView('demand-heatmap')}>
              <TrendingUp className="h-4 w-4 mr-2" />View Demand
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />AI Sales Analytics
              <Badge variant="outline" className="text-xs">READ-ONLY</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Conversion analytics & pipeline overview</p>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => onOpenView('revenue-growth')}>
              <Sparkles className="h-4 w-4 mr-2" />View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Financial & Visitors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4 text-emerald-500" />Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">₹{stats.totalCollected.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Platform profit collected</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-rose-500" />Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-500">{stats.pendingInvoices}</p>
            <p className="text-sm text-muted-foreground">₹{stats.pendingInvoiceAmount.toLocaleString()} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-indigo-600" />Visitor Analytics
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRefresh} disabled={statsLoading}>
                  <RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <Select value={String(selectedDays)} onValueChange={(val) => onSelectedDaysChange(Number(val))}>
                <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{visitorStats.totalVisitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Visitors</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">{visitorStats.pageViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Monitor className="h-3 w-3" />{visitorStats.desktopPercent}%</span>
              <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" />{visitorStats.mobilePercent}%</span>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={onOpenAnalyticsModal}>
              <BarChart3 className="h-4 w-4 mr-2" />View Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
