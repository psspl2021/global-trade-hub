import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar
} from "recharts";
import { useGovernanceAccess } from "@/hooks/useGovernanceAccess";
import { AccessDenied } from "@/components/purchaser/AccessDenied";
import { Loader2, TrendingUp, Radio, CheckCircle2, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  totalAuctions: number;
  liveAuctions: number;
  completedAuctions: number;
  totalRevenue: number;
}

interface RevenueDay {
  date: string;
  revenue: number;
}

interface Auction {
  id: string;
  title: string;
  status: string;
  auction_start: string | null;
  auction_end: string | null;
  created_at: string;
}

interface BuyerRevenue {
  buyer_id: string;
  auctions: number;
  revenue: number;
  base_revenue: number;
  total_gst: number;
}

const ADMIN_ROLES = ["ps_admin", "admin"];

const statusColor: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  completed: "bg-blue-500/15 text-blue-700 border-blue-300",
  scheduled: "bg-amber-500/15 text-amber-700 border-amber-300",
  cancelled: "bg-red-500/15 text-red-700 border-red-300",
  draft: "bg-muted text-muted-foreground border-border",
};

export default function AuctionAdminDashboard() {
  const { isLoading: accessLoading, primaryRole } = useGovernanceAccess();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueDay[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [buyerRevenue, setBuyerRevenue] = useState<BuyerRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessLoading && ADMIN_ROLES.includes(primaryRole)) {
      Promise.all([fetchStats(), fetchRevenue(), fetchAuctions(), fetchBuyerRevenue()])
        .finally(() => setLoading(false));
    }
  }, [accessLoading, primaryRole]);

  async function fetchStats() {
    const [totalRes, liveRes, completedRes, revenueRes] = await Promise.all([
      supabase.from("reverse_auctions").select("*", { count: "exact", head: true }),
      supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "live"),
      supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("auction_payments").select("total_amount").eq("payment_status", "consumed"),
    ]);

    const totalRevenue = (revenueRes.data || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);

    setStats({
      totalAuctions: totalRes.count || 0,
      liveAuctions: liveRes.count || 0,
      completedAuctions: completedRes.count || 0,
      totalRevenue,
    });
  }

  async function fetchRevenue() {
    const { data } = await supabase.rpc("auction_revenue_daily");
    setRevenueChart((data as RevenueDay[]) || []);
  }

  async function fetchAuctions() {
    const { data } = await supabase
      .from("reverse_auctions")
      .select("id,title,status,auction_start,auction_end,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setAuctions((data as Auction[]) || []);
  }

  async function fetchBuyerRevenue() {
    const { data } = await supabase
      .from("buyer_auction_revenue")
      .select("*")
      .order("revenue", { ascending: false })
      .limit(10);
    setBuyerRevenue((data as BuyerRevenue[]) || []);
  }

  if (accessLoading || loading) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (!ADMIN_ROLES.includes(primaryRole)) {
    return (
      <main className="min-h-screen pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <AccessDenied variant="404" />
        </div>
      </main>
    );
  }

  const kpis = [
    { label: "Total Auctions", value: stats?.totalAuctions ?? 0, icon: TrendingUp, color: "text-primary" },
    { label: "Live Now", value: stats?.liveAuctions ?? 0, icon: Radio, color: "text-emerald-600" },
    { label: "Completed", value: stats?.completedAuctions ?? 0, icon: CheckCircle2, color: "text-blue-600" },
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-amber-600" },
  ];

  return (
    <main className="min-h-screen bg-muted/30 pt-20 pb-16 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Auction & Payment Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Reverse auction monetization dashboard</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Daily Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center">No revenue data yet</p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Buyer Revenue */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Buyers by Auction Spend</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {buyerRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={buyerRevenue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="buyer_id" type="category" tick={{ fontSize: 10 }} width={80} tickFormatter={(v) => v.slice(0, 8)} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-10 text-center">No buyer data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Lifecycle */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Payment Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Auctions</TableHead>
                    <TableHead>Base Fee</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyerRevenue.length > 0 ? buyerRevenue.map((b) => (
                    <TableRow key={b.buyer_id}>
                      <TableCell className="font-mono text-xs">{b.buyer_id.slice(0, 8)}…</TableCell>
                      <TableCell>{b.auctions}</TableCell>
                      <TableCell>₹{b.base_revenue?.toLocaleString("en-IN")}</TableCell>
                      <TableCell>₹{b.total_gst?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="font-semibold">₹{b.revenue?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No payments yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Auction Status Table */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Auctions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auctions.length > 0 ? auctions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id.slice(0, 8)}…</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[a.status] || ""}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{a.auction_start ? new Date(a.auction_start).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell className="text-xs">{a.auction_end ? new Date(a.auction_end).toLocaleDateString("en-IN") : "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(a.created_at).toLocaleDateString("en-IN")}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No auctions yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
