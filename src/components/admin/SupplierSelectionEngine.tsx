import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Brain, TrendingUp, Shield, Zap, Search, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SupplierSelectionEngineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectionLog {
  id: string;
  requirement_id: string;
  selection_mode: string;
  selected_supplier_id: string;
  total_landed_cost: number;
  material_cost: number;
  logistics_cost: number;
  delivery_success_probability: number;
  quality_risk_score: number;
  ai_reasoning: any;
  runner_up_suppliers: any;
  fallback_triggered: boolean;
  fallback_reason: string | null;
  created_at: string;
  requirements?: {
    title: string;
    product_category: string;
    quantity: number;
    unit: string;
  };
}

interface SupplierPerformance {
  id: string;
  supplier_id: string;
  total_orders: number;
  successful_deliveries: number;
  on_time_deliveries: number;
  late_deliveries: number;
  quality_rejections: number;
  quality_complaints: number;
  quality_risk_score: number; // 0 = low risk, 1 = high risk
  avg_delivery_days: number | null;
  last_order_date: string | null;
  profiles?: {
    company_name: string;
  };
}

interface Requirement {
  id: string;
  title: string;
  product_category: string;
  quantity: number;
  status: string;
}

export function SupplierSelectionEngine({ open, onOpenChange }: SupplierSelectionEngineProps) {
  const [activeTab, setActiveTab] = useState("selection");
  const [selectionLogs, setSelectionLogs] = useState<SelectionLog[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [pendingRequirements, setPendingRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState<"bidding" | "auto_assign">("bidding");
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch selection logs
      const { data: logs } = await supabase
        .from("supplier_selection_log")
        .select(`
          *,
          requirements (
            title,
            product_category,
            quantity,
            unit
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      setSelectionLogs((logs as SelectionLog[]) || []);

      // Fetch supplier performance
      const { data: performance } = await supabase
        .from("supplier_performance")
        .select("*")
        .order("total_orders", { ascending: false })
        .limit(50);

      setSupplierPerformance((performance as SupplierPerformance[]) || []);

      // Fetch pending requirements for manual selection
      const { data: requirements } = await supabase
        .from("requirements")
        .select("id, title, product_category, quantity, status")
        .in("status", ["active"])
        .order("created_at", { ascending: false })
        .limit(20);

      setPendingRequirements((requirements as Requirement[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runSelection = async () => {
    if (!selectedRequirement) {
      toast.error("Please select a requirement");
      return;
    }

    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("supplier-selection", {
        body: {
          requirementId: selectedRequirement,
          mode: selectionMode
        }
      });

      if (error) throw error;

      toast.success("Supplier selection completed!", {
        description: `Final price: ₹${data.finalPrice?.toLocaleString()} | Est. delivery: ${data.estimatedDeliveryDays} days`
      });

      fetchData();
    } catch (error: any) {
      toast.error("Selection failed", { description: error.message });
    } finally {
      setRunning(false);
    }
  };

  const filteredLogs = selectionLogs.filter(log => 
    log.requirements?.title?.toLowerCase().includes(search.toLowerCase()) ||
    log.requirements?.product_category?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPerformance = supplierPerformance.filter(perf =>
    perf.supplier_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Supplier Selection Engine
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Run Selection
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Selection History
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Supplier Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Supplier Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Requirement</label>
                    <Select value={selectedRequirement} onValueChange={setSelectedRequirement}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingRequirements.map(req => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.title} ({req.product_category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selection Mode</label>
                    <Select value={selectionMode} onValueChange={(v: "bidding" | "auto_assign") => setSelectionMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bidding">
                          Mode A: From Bids (L1 Logic)
                        </SelectItem>
                        <SelectItem value="auto_assign">
                          Mode B: Auto-Assign (AI Direct)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">Selection Logic:</p>
                  {selectionMode === "bidding" ? (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Calculates Total Landed Cost = Material + Logistics</li>
                      <li>Applies AI scoring: Delivery Probability + Quality Risk</li>
                      <li>Selects L1 with best composite score</li>
                      <li>Auto-fallback if risk thresholds exceeded</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Uses historical L1 win data for category</li>
                      <li>Checks current inventory availability</li>
                      <li>Considers supplier proximity and performance</li>
                      <li>Optimizes for delivery reliability over cost</li>
                    </ul>
                  )}
                </div>

                <Button 
                  onClick={runSelection} 
                  disabled={running || !selectedRequirement}
                  className="w-full"
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running AI Selection...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Run Supplier Selection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{selectionLogs.length}</div>
                  <p className="text-sm text-muted-foreground">Total Selections</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {selectionLogs.filter(l => l.selection_mode === "bidding").length}
                  </div>
                  <p className="text-sm text-muted-foreground">From Bids</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {selectionLogs.filter(l => l.selection_mode === "auto_assign").length}
                  </div>
                  <p className="text-sm text-muted-foreground">Auto-Assigned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-amber-600">
                    {selectionLogs.filter(l => l.fallback_triggered).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Fallbacks</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <Card key={log.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {log.requirements?.title || "Unknown Requirement"}
                            </span>
                            <Badge variant={log.selection_mode === "bidding" ? "default" : "secondary"}>
                              {log.selection_mode === "bidding" ? "Mode A: Bidding" : "Mode B: Auto"}
                            </Badge>
                            {log.fallback_triggered && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Fallback
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.requirements?.product_category} • {log.requirements?.quantity} {log.requirements?.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">₹{log.total_landed_cost?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Material:</span>
                          <span className="ml-1 font-medium">₹{log.material_cost?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Logistics:</span>
                          <span className="ml-1 font-medium">₹{log.logistics_cost?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delivery Prob:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {(log.delivery_success_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quality Risk:</span>
                          <span className={`ml-1 font-medium ${log.quality_risk_score > 0.3 ? 'text-amber-600' : 'text-green-600'}`}>
                            {(log.quality_risk_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {log.ai_reasoning?.reasoning && (
                        <div className="mt-3 bg-muted/50 p-2 rounded text-xs">
                          <span className="font-medium">AI Reasoning: </span>
                          {log.ai_reasoning.reasoning.slice(0, 3).join(" | ")}
                        </div>
                      )}

                      {log.fallback_reason && (
                        <div className="mt-2 text-xs text-amber-600">
                          ⚠️ {log.fallback_reason}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No selection logs found
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by supplier ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredPerformance.map(perf => (
                  <Card key={perf.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium font-mono text-sm">
                            {perf.supplier_id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {perf.total_orders} total orders
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {perf.total_orders > 0 ? ((perf.successful_deliveries / perf.total_orders) * 100).toFixed(0) : 85}% Delivery
                          </Badge>
                          <Badge variant="outline" className={`${(perf.quality_risk_score || 0) > 0.3 ? 'text-amber-600 border-amber-600' : 'text-blue-600 border-blue-600'}`}>
                            {((1 - (perf.quality_risk_score || 0)) * 100).toFixed(0)}% Quality
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Successful:</span>
                          <span className="ml-1 font-medium text-green-600">{perf.successful_deliveries}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">On-Time:</span>
                          <span className="ml-1 font-medium">{perf.on_time_deliveries}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Late:</span>
                          <span className="ml-1 font-medium text-amber-600">{perf.late_deliveries}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rejections:</span>
                          <span className="ml-1 font-medium text-red-600">{perf.quality_rejections}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Complaints:</span>
                          <span className="ml-1 font-medium text-orange-600">{perf.quality_complaints}</span>
                        </div>
                      </div>

                      {perf.last_order_date && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last order: {format(new Date(perf.last_order_date), "dd MMM yyyy")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {filteredPerformance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No supplier performance data available
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
