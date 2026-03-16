import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuctionTrackerCard() {
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    completed: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuctionTrackerCard mounted");
    load();
  }, []);

  async function load() {
    try {
      const [total, live, completed, revenue] = await Promise.all([
        supabase.from("reverse_auctions").select("*", { count: "exact", head: true }),
        supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("reverse_auctions").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.rpc("auction_total_revenue" as any),
      ]);

      setStats({
        total: total.count || 0,
        live: live.count || 0,
        completed: completed.count || 0,
        revenue: typeof revenue.data === "number" ? revenue.data : 0,
      });
    } catch (err) {
      console.error("AuctionTrackerCard error:", err);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl shadow p-6 border border-border bg-card text-card-foreground md:col-span-2 lg:col-span-3">
        Loading Auction Intelligence...
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow p-6 border border-border bg-card text-card-foreground md:col-span-2 lg:col-span-3">
      <h2 className="text-lg font-semibold mb-4">Auction Intelligence</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Auctions</div>
        </div>
        <div>
          <div className="text-xl font-bold">{stats.live}</div>
          <div className="text-sm text-muted-foreground">Live Auctions</div>
        </div>
        <div>
          <div className="text-xl font-bold">{stats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div>
          <div className="text-xl font-bold">
            ₹{stats.revenue.toLocaleString("en-IN")}
          </div>
          <div className="text-sm text-muted-foreground">Revenue</div>
        </div>
      </div>
    </div>
  );
}
