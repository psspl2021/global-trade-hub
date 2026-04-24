/**
 * Sales Dashboard — Growth & Conversion
 * Shows: AI Sales, Leads, Visitors, Credits, Blogs, Premium Bids, Referrals
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Mail, BarChart3, PenTool, Gift, Eye,
  RefreshCw, Monitor, Smartphone, Globe
} from 'lucide-react';
import { CreditLeadsSummaryCard } from '@/components/admin/CreditLeadsSummaryCard';

interface SalesDashboardProps {
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
  onShowPremiumBids: () => void;
  onShowReferrals: () => void;
  userName: string;
}

export function SalesDashboard({
  visitorStats, statsLoading, selectedDays,
  onSelectedDaysChange, onRefresh, onOpenView, onOpenAnalyticsModal,
  onShowPremiumBids, onShowReferrals, userName
}: SalesDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Sales & Growth Dashboard</p>
      </div>

      {/* Row 1 — Growth Engines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />AI Sales Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">AI-powered buyer discovery, outreach & conversion</p>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => onOpenView('revenue-growth')}>
              <Sparkles className="h-4 w-4 mr-2" />Open AI Sales
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-slate-600" />Leads Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Newsletter subscribers & demo requests</p>
            <Button variant="outline" className="w-full" onClick={() => onOpenView('revenue-growth')}>
              <Eye className="h-4 w-4 mr-2" />View Leads
            </Button>
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
                  <SelectItem value="365">365 days</SelectItem>
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

      {/* Row 2 — Credits + Content + Growth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CreditLeadsSummaryCard />

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenTool className="h-4 w-4 text-violet-500" />Blog Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Create and manage SEO blog posts</p>
            <Button variant="outline" className="w-full" onClick={() => onOpenView('content-studio')}>
              <PenTool className="h-4 w-4 mr-2" />Manage Blogs
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-emerald-500" />Email Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Supplier email quotas & Brevo tracking</p>
            <Button variant="outline" className="w-full" onClick={() => onOpenView('email-tracking')}>
              <Mail className="h-4 w-4 mr-2" />Manage Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Premium & Referrals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-amber-500" />Premium Bids
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Manage premium bids for suppliers & transporters</p>
            <Button variant="outline" className="w-full" onClick={onShowPremiumBids}>
              <Sparkles className="h-4 w-4 mr-2" />Manage Premium Bids
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-rose-500" />Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">View referral stats & top referrers leaderboard</p>
            <Button variant="outline" className="w-full" onClick={onShowReferrals}>
              <Eye className="h-4 w-4 mr-2" />View Referral Stats
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
