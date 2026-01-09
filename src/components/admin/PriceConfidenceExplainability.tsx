import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Activity,
  Percent,
} from "lucide-react";
import { format } from "date-fns";

interface PriceConfidenceScore {
  id: string;
  requirement_id: string;
  bid_id: string | null;
  buyer_visible_price: number;
  confidence_score: number;
  confidence_label: string;
  buyer_message: string;
  selection_mode: string;
  price_position: number | null;
  market_stability: number | null;
  competition_score: number | null;
  price_spread_ratio: number | null;
  margin_type: string | null;
  total_bids: number | null;
  historical_price_variance: number | null;
  created_at: string;
}

interface MarketIndex {
  id: string;
  product_category: string;
  min_market_price: number;
  max_market_price: number;
  average_market_price: number;
  price_std_deviation: number;
  demand_index: number;
  supply_index: number;
  volatility_index: number;
  data_source: string;
  last_updated: string;
}

export const PriceConfidenceExplainability = () => {
  const [scores, setScores] = useState<PriceConfidenceScore[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScore, setSelectedScore] = useState<PriceConfidenceScore | null>(null);
  const [activeTab, setActiveTab] = useState<"scores" | "indices">("scores");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scoresRes, indicesRes] = await Promise.all([
        supabase
          .from("price_confidence_scores")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("market_price_indices")
          .select("*")
          .order("last_updated", { ascending: false }),
      ]);

      if (scoresRes.error) throw scoresRes.error;
      if (indicesRes.error) throw indicesRes.error;

      setScores(scoresRes.data || []);
      setMarketIndices(indicesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (label: string) => {
    switch (label) {
      case "HIGH":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOW":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getConfidenceIcon = (label: string) => {
    switch (label) {
      case "HIGH":
        return <TrendingUp className="h-4 w-4" />;
      case "MEDIUM":
        return <Minus className="h-4 w-4" />;
      case "LOW":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredScores = scores.filter(
    (s) =>
      s.requirement_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.confidence_label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIndices = marketIndices.filter((i) =>
    i.product_category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Price Confidence Explainability
        </h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "scores" ? "default" : "outline"}
          onClick={() => setActiveTab("scores")}
        >
          Confidence Scores ({scores.length})
        </Button>
        <Button
          variant={activeTab === "indices" ? "default" : "outline"}
          onClick={() => setActiveTab("indices")}
        >
          Market Indices ({marketIndices.length})
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            activeTab === "scores"
              ? "Search by requirement ID or confidence..."
              : "Search by category..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {activeTab === "scores" ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Confidence Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell className="font-mono text-xs">
                      {score.requirement_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>₹{score.buyer_visible_price.toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{score.confidence_score}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getConfidenceColor(score.confidence_label)}
                      >
                        {getConfidenceIcon(score.confidence_label)}
                        <span className="ml-1">{score.confidence_label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {score.selection_mode === "bidding" ? "Bidding" : "Auto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(score.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedScore(score)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredScores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No confidence scores found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Market Price Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Min Price</TableHead>
                  <TableHead>Max Price</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Volatility</TableHead>
                  <TableHead>Demand</TableHead>
                  <TableHead>Supply</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndices.map((index) => (
                  <TableRow key={index.id}>
                    <TableCell className="font-medium">{index.product_category}</TableCell>
                    <TableCell>₹{index.min_market_price.toLocaleString()}</TableCell>
                    <TableCell>₹{index.max_market_price.toLocaleString()}</TableCell>
                    <TableCell>₹{index.average_market_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          index.volatility_index > 0.5
                            ? "bg-red-100 text-red-800"
                            : index.volatility_index > 0.3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }
                      >
                        {(index.volatility_index * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{(index.demand_index * 100).toFixed(0)}%</TableCell>
                    <TableCell>{(index.supply_index * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(index.last_updated), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredIndices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No market indices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedScore} onOpenChange={() => setSelectedScore(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Internal Explainability
            </DialogTitle>
          </DialogHeader>

          {selectedScore && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">Confidence Score</Label>
                    <div className="text-3xl font-bold mt-1 flex items-center gap-2">
                      {selectedScore.confidence_score}
                      <Badge className={getConfidenceColor(selectedScore.confidence_label)}>
                        {selectedScore.confidence_label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">Buyer Visible Price</Label>
                    <div className="text-3xl font-bold mt-1">
                      ₹{selectedScore.buyer_visible_price.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Scoring Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Price Position</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(selectedScore.price_position || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono">
                          {((selectedScore.price_position || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower is better (closer to min market price)
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Market Stability</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(selectedScore.market_stability || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono">
                          {((selectedScore.market_stability || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher is better (low volatility)
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Competition Score</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{
                              width: `${(selectedScore.competition_score || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-mono">
                          {((selectedScore.competition_score || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Higher is better (more competition)
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price Spread Ratio</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-mono">
                          {((selectedScore.price_spread_ratio || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Market price range spread
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">Selection Mode</Label>
                    <Badge variant="secondary" className="mt-2">
                      {selectedScore.selection_mode === "bidding"
                        ? "Competitive Bidding"
                        : "Auto Assign"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">Margin Type</Label>
                    <div className="text-sm font-medium mt-2">
                      {selectedScore.margin_type || "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">
                      {selectedScore.selection_mode === "bidding"
                        ? "Total Bids"
                        : "Historical Variance"}
                    </Label>
                    <div className="text-sm font-medium mt-2">
                      {selectedScore.selection_mode === "bidding"
                        ? selectedScore.total_bids || 0
                        : `${((selectedScore.historical_price_variance || 0) * 100).toFixed(1)}%`}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <Label className="text-xs text-muted-foreground">Buyer Message</Label>
                  <p className="mt-1 font-medium">{selectedScore.buyer_message}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceConfidenceExplainability;
