import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Eye, MousePointer, AlertTriangle, Check, Search, Settings, History, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SupplierWithQuota {
  id: string;
  company_name: string;
  email: string;
  contact_person: string;
  supplier_categories: string[] | null;
  supplier_notification_subcategories: string[] | null;
  email_notifications_enabled: boolean | null;
  quota?: {
    daily_emails_sent: number;
    monthly_emails_sent: number;
    has_email_subscription: boolean;
    subscription_expires_at: string | null;
  };
  stats?: {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
  };
}

interface EmailLog {
  id: string;
  supplier_id: string;
  requirement_id: string | null;
  brevo_message_id: string | null;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  open_count: number;
  click_count: number;
}

export default function AdminEmailTracking() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithQuota | null>(null);
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [dailyAdjustment, setDailyAdjustment] = useState(0);
  const [monthlyAdjustment, setMonthlyAdjustment] = useState(0);
  const [upgradeMonths, setUpgradeMonths] = useState(1);

  // Fetch suppliers with their quotas
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["admin-suppliers-email"],
    queryFn: async () => {
      // Get all suppliers
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id, company_name, email, contact_person,
          supplier_categories, supplier_notification_subcategories,
          email_notifications_enabled
        `)
        .in("id", (
          await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "supplier")
        ).data?.map(r => r.user_id) || []);

      if (profilesError) throw profilesError;

      // Get quotas for each supplier
      const { data: quotas } = await supabase
        .from("supplier_email_quotas")
        .select("*");

      // Get email stats
      const { data: logs } = await supabase
        .from("supplier_email_logs")
        .select("supplier_id, status, delivered_at, opened_at, clicked_at, bounced_at");

      // Aggregate stats per supplier
      const statsMap = new Map<string, any>();
      logs?.forEach(log => {
        const existing = statsMap.get(log.supplier_id) || {
          total_sent: 0, total_delivered: 0, total_opened: 0, total_clicked: 0, total_bounced: 0
        };
        existing.total_sent++;
        if (log.status === "delivered" || log.delivered_at) existing.total_delivered++;
        if (log.opened_at) existing.total_opened++;
        if (log.clicked_at) existing.total_clicked++;
        if (log.status === "bounced" || log.bounced_at) existing.total_bounced++;
        statsMap.set(log.supplier_id, existing);
      });

      return profiles?.map(p => ({
        ...p,
        quota: quotas?.find(q => q.supplier_id === p.id),
        stats: statsMap.get(p.id) || { total_sent: 0, total_delivered: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 }
      })) as SupplierWithQuota[];
    },
  });

  // Fetch email logs for selected supplier
  const { data: emailLogs } = useQuery({
    queryKey: ["admin-email-logs", selectedSupplier?.id],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      const { data, error } = await supabase
        .from("supplier_email_logs")
        .select("*")
        .eq("supplier_id", selectedSupplier.id)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!selectedSupplier,
  });

  // Mutation to adjust quota
  const adjustQuotaMutation = useMutation({
    mutationFn: async ({ supplierId, daily, monthly }: { supplierId: string; daily: number; monthly: number }) => {
      // First ensure quota record exists
      const { data: existing } = await supabase
        .from("supplier_email_quotas")
        .select("id")
        .eq("supplier_id", supplierId)
        .single();

      if (!existing) {
        await supabase.from("supplier_email_quotas").insert({ supplier_id: supplierId });
      }

      const { error } = await supabase
        .from("supplier_email_quotas")
        .update({
          daily_emails_sent: daily,
          monthly_emails_sent: monthly,
        })
        .eq("supplier_id", supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quota adjusted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers-email"] });
      setAdjustmentDialog(false);
    },
    onError: (error: any) => {
      toast.error("Failed to adjust quota: " + error.message);
    },
  });

  // Mutation to upgrade to premium
  const upgradeMutation = useMutation({
    mutationFn: async ({ supplierId, months }: { supplierId: string; months: number }) => {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);

      // Ensure quota record exists
      const { data: existing } = await supabase
        .from("supplier_email_quotas")
        .select("id")
        .eq("supplier_id", supplierId)
        .single();

      if (!existing) {
        await supabase.from("supplier_email_quotas").insert({ supplier_id: supplierId });
      }

      const { error: quotaError } = await supabase
        .from("supplier_email_quotas")
        .update({
          has_email_subscription: true,
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          monthly_emails_sent: 0,
        })
        .eq("supplier_id", supplierId);

      if (quotaError) throw quotaError;

      // Record subscription history
      const { error: historyError } = await supabase
        .from("supplier_subscription_history")
        .insert({
          supplier_id: supplierId,
          plan_type: "premium",
          amount_paid: 300 * months,
          payment_status: "completed",
          plan_started_at: new Date().toISOString(),
          plan_expires_at: expiresAt.toISOString(),
          emails_allowed: 500,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      toast.success("Supplier upgraded to premium successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers-email"] });
    },
    onError: (error: any) => {
      toast.error("Failed to upgrade: " + error.message);
    },
  });

  // Mutation to downgrade to free
  const downgradeMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from("supplier_email_quotas")
        .update({
          has_email_subscription: false,
          subscription_expires_at: null,
        })
        .eq("supplier_id", supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier downgraded to free plan");
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers-email"] });
    },
    onError: (error: any) => {
      toast.error("Failed to downgrade: " + error.message);
    },
  });

  const filteredSuppliers = suppliers?.filter(s => 
    s.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>;
      case "sent":
        return <Badge variant="secondary">Sent</Badge>;
      case "opened":
        return <Badge className="bg-blue-500">Opened</Badge>;
      case "clicked":
        return <Badge className="bg-purple-500">Clicked</Badge>;
      case "bounced":
        return <Badge variant="destructive">Bounced</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (quota: any) => {
    if (!quota) return <Badge variant="outline">Free</Badge>;
    if (quota.has_email_subscription && quota.subscription_expires_at && new Date(quota.subscription_expires_at) > new Date()) {
      return <Badge className="bg-amber-500">Premium</Badge>;
    }
    return <Badge variant="outline">Free</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Supplier Email Tracking & Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-suppliers-email"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading suppliers...</div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Daily Usage</TableHead>
                    <TableHead>Monthly Usage</TableHead>
                    <TableHead>Delivery Stats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.company_name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {supplier.supplier_categories?.slice(0, 2).map(cat => (
                            <Badge key={cat} variant="outline" className="mr-1 mb-1 text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {(supplier.supplier_categories?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(supplier.supplier_categories?.length || 0) - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.email_notifications_enabled ? (
                          <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getPlanBadge(supplier.quota)}</TableCell>
                      <TableCell>
                        <span className={supplier.quota?.daily_emails_sent === 2 ? "text-red-500 font-medium" : ""}>
                          {supplier.quota?.daily_emails_sent || 0}/2
                        </span>
                      </TableCell>
                      <TableCell>
                        {supplier.quota?.has_email_subscription ? (
                          <span className={supplier.quota?.monthly_emails_sent >= 500 ? "text-red-500 font-medium" : ""}>
                            {supplier.quota?.monthly_emails_sent || 0}/500
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-xs">
                          <span title="Sent" className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{supplier.stats?.total_sent || 0}
                          </span>
                          <span title="Opened" className="flex items-center gap-1 text-blue-500">
                            <Eye className="h-3 w-3" />{supplier.stats?.total_opened || 0}
                          </span>
                          <span title="Clicked" className="flex items-center gap-1 text-purple-500">
                            <MousePointer className="h-3 w-3" />{supplier.stats?.total_clicked || 0}
                          </span>
                          <span title="Bounced" className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />{supplier.stats?.total_bounced || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedSupplier(supplier)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Email History - {supplier.company_name}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="h-[500px]">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Subject</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Opens</TableHead>
                                      <TableHead>Clicks</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {emailLogs?.map((log) => (
                                      <TableRow key={log.id}>
                                        <TableCell className="text-sm">
                                          {format(new Date(log.sent_at), "MMM dd, yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm">
                                          {log.subject}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">{log.email_type}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell>{log.open_count}</TableCell>
                                        <TableCell>{log.click_count}</TableCell>
                                      </TableRow>
                                    ))}
                                    {(!emailLogs || emailLogs.length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                          No email logs found
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={adjustmentDialog && selectedSupplier?.id === supplier.id} onOpenChange={setAdjustmentDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setDailyAdjustment(supplier.quota?.daily_emails_sent || 0);
                                  setMonthlyAdjustment(supplier.quota?.monthly_emails_sent || 0);
                                }}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage Quota - {supplier.company_name}</DialogTitle>
                              </DialogHeader>
                              <Tabs defaultValue="quota">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="quota">Adjust Quota</TabsTrigger>
                                  <TabsTrigger value="plan">Manage Plan</TabsTrigger>
                                </TabsList>
                                <TabsContent value="quota" className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Daily Emails Sent</Label>
                                    <Input
                                      type="number"
                                      value={dailyAdjustment}
                                      onChange={(e) => setDailyAdjustment(parseInt(e.target.value) || 0)}
                                      min={0}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Monthly Emails Sent</Label>
                                    <Input
                                      type="number"
                                      value={monthlyAdjustment}
                                      onChange={(e) => setMonthlyAdjustment(parseInt(e.target.value) || 0)}
                                      min={0}
                                    />
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => adjustQuotaMutation.mutate({
                                      supplierId: supplier.id,
                                      daily: dailyAdjustment,
                                      monthly: monthlyAdjustment
                                    })}
                                    disabled={adjustQuotaMutation.isPending}
                                  >
                                    Save Changes
                                  </Button>
                                </TabsContent>
                                <TabsContent value="plan" className="space-y-4">
                                  <div className="p-4 border rounded-lg">
                                    <div className="text-sm text-muted-foreground mb-2">Current Plan</div>
                                    <div className="flex items-center gap-2">
                                      {getPlanBadge(supplier.quota)}
                                      {supplier.quota?.subscription_expires_at && (
                                        <span className="text-sm text-muted-foreground">
                                          Expires: {format(new Date(supplier.quota.subscription_expires_at), "MMM dd, yyyy")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {!supplier.quota?.has_email_subscription && (
                                    <div className="space-y-2">
                                      <Label>Upgrade to Premium</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          type="number"
                                          value={upgradeMonths}
                                          onChange={(e) => setUpgradeMonths(parseInt(e.target.value) || 1)}
                                          min={1}
                                          max={12}
                                          className="w-24"
                                        />
                                        <span className="flex items-center text-sm text-muted-foreground">months (₹{300 * upgradeMonths})</span>
                                      </div>
                                      <Button 
                                        className="w-full"
                                        onClick={() => upgradeMutation.mutate({ supplierId: supplier.id, months: upgradeMonths })}
                                        disabled={upgradeMutation.isPending}
                                      >
                                        Upgrade to Premium
                                      </Button>
                                    </div>
                                  )}

                                  {supplier.quota?.has_email_subscription && (
                                    <Button 
                                      variant="destructive"
                                      className="w-full"
                                      onClick={() => downgradeMutation.mutate(supplier.id)}
                                      disabled={downgradeMutation.isPending}
                                    >
                                      Downgrade to Free
                                    </Button>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers?.filter(s => s.quota?.has_email_subscription).length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Premium Subscribers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers?.reduce((sum, s) => sum + (s.stats?.total_sent || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Emails Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {suppliers?.length ? 
                Math.round((suppliers.reduce((sum, s) => sum + (s.stats?.total_opened || 0), 0) / 
                Math.max(suppliers.reduce((sum, s) => sum + (s.stats?.total_delivered || 0), 0), 1)) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Open Rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
