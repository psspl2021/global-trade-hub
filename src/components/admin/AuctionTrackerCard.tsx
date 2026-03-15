import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Gavel,
  Radio,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  Percent,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface AuctionStats {
  total: number;
  live: number;
  completed: number;
  revenue: number;
  successRate: number;
  avgSavings: number;
  avgSuppliers: number;
  totalBuyerSavings: number;
  auctionsWithoutPayment: number;
  paymentsWithoutAuction: number;
}

export default function AuctionTrackerCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AuctionStats>({
    total: 0,
    live: 0,
    completed: 0,
    revenue: 0,
    successRate: 0,
    avgSavings: 0,
    avgSuppliers: 0,
    totalBuyerSavings: 0,
    auctionsWithoutPayment: 0,
    paymentsWithoutAuction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [total, live, completed, revenue, success, savings, supplierData, buyerSavings, integrity] =
        await Promise.all([
          supabase.from("reverse_auctions").select("*", { count: "exact", head: true }),
          supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "live"),
          supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("auction_payments").select("total_amount").eq("payment_status", "consumed"),
          supabase.rpc("auction_success_metrics" as any),
          supabase.rpc("auction_savings" as any),
          supabase.rpc("supplier_bid_activity" as any),
          supabase.rpc("buyer_procurement_savings" as any),
          supabase.rpc("verify_auction_payments" as any),
        ]);

      const revenueTotal = (revenue.data || []).reduce(
        (s: number, r: any) => s + (r.total_amount || 0),
        0
      );

      const savingsData = savings.data || [];
      const avgSavings = savingsData.length
        ? savingsData.reduce((s: number, r: any) => s + (r.savings_percent || 0), 0) / savingsData.length
        : 0;

      const supplierArr = supplierData.data || [];
      const avgSuppliers = supplierArr.length
        ? supplierArr.reduce((s: number, r: any) => s + (r.supplier_count || 0), 0) / supplierArr.length
        : 0;

      setStats({
        total: total.count || 0,
        live: live.count || 0,
        completed: completed.count || 0,
        revenue: revenueTotal,
        successRate: success.data?.[0]?.success_rate || 0,
        avgSavings,
        avgSuppliers,
        totalBuyerSavings: buyerSavings.data?.[0]?.total_savings || 0,
        auctionsWithoutPayment: integrity.data?.[0]?.auctions_without_payment || 0,
        paymentsWithoutAuction: integrity.data?.[0]?.payments_without_auction || 0,
      });
    } catch (err) {
      console.error("[AuctionTrackerCard] Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const hasIntegrityIssue = stats.auctionsWithoutPayment > 0 || stats.paymentsWithoutAuction > 0;

  if (loading) {
    return (
      <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 md:col-span-2 lg:col-span-3">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-orange-500/5 md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gavel className="h-5 w-5 text-amber-600" />
          Auction & Payment Intelligence
          {hasIntegrityIssue && (
            <span className="ml-auto flex items-center gap-1 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Integrity Alert
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1 — Core metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricBlock icon={<Gavel className="h-4 w-4 text-amber-600" />} value={stats.total} label="Total Auctions" />
          <MetricBlock icon={<Radio className="h-4 w-4 text-green-600" />} value={stats.live} label="Live Now" highlight />
          <MetricBlock icon={<CheckCircle2 className="h-4 w-4 text-blue-600" />} value={stats.completed} label="Completed" />
          <MetricBlock
            icon={<IndianRupee className="h-4 w-4 text-emerald-600" />}
            value={`₹${stats.revenue.toLocaleString("en-IN")}`}
            label="Revenue"
          />
        </div>

        {/* Row 2 — Performance metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricBlock
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            value={`${stats.successRate}%`}
            label="Success Rate"
          />
          <MetricBlock
            icon={<Percent className="h-4 w-4 text-violet-600" />}
            value={`${stats.avgSavings.toFixed(1)}%`}
            label="Avg Savings"
          />
          <MetricBlock
            icon={<Users className="h-4 w-4 text-cyan-600" />}
            value={stats.avgSuppliers.toFixed(1)}
            label="Avg Suppliers / Auction"
          />
          <MetricBlock
            icon={<IndianRupee className="h-4 w-4 text-green-700" />}
            value={`₹${stats.totalBuyerSavings.toLocaleString("en-IN")}`}
            label="Total Buyer Savings"
          />
        </div>

        {/* Row 3 — Payment integrity + deep link */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <ShieldCheck className={`h-4 w-4 ${hasIntegrityIssue ? "text-destructive" : "text-green-600"}`} />
            {hasIntegrityIssue ? (
              <span className="text-destructive">
                {stats.auctionsWithoutPayment} auction(s) missing payment · {stats.paymentsWithoutAuction} orphan payment(s)
              </span>
            ) : (
              <span>All payments verified</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/auction-dashboard")}
          >
            Full Dashboard
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricBlock({
  icon,
  value,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-xl font-bold ${highlight ? "text-green-600" : ""}`}>
          {value}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
