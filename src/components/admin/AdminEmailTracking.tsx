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
import { Mail, Eye, MousePointer, AlertTriangle, Check, Search, Settings, History, RefreshCw, CreditCard, Calendar, Truck, ShoppingCart, Package } from "lucide-react";
import { format } from "date-fns";

interface UserWithQuota {
  id: string;
  company_name: string;
  email: string;
  contact_person: string;
  user_type: 'supplier' | 'buyer' | 'logistics_partner';
  supplier_categories: string[] | null;
  supplier_notification_subcategories: string[] | null;
  email_notifications_enabled: boolean | null;
  quota?: {
    daily_emails_sent: number;
    monthly_emails_sent: number;
    has_email_subscription: boolean;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    last_daily_reset: string | null;
    last_monthly_reset: string | null;
  };
  stats?: {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
  };
  latestPayment?: {
    status: string;
    amount: number;
    paid_at: string | null;
  };
}

interface EmailLog {
  id: string;
  supplier_id: string;
  user_id: string | null;
  user_type: string | null;
  requirement_id: string | null;
  logistics_requirement_id: string | null;
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
  const [selectedUser, setSelectedUser] = useState<UserWithQuota | null>(null);
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [dailyAdjustment, setDailyAdjustment] = useState(0);
  const [monthlyAdjustment, setMonthlyAdjustment] = useState(0);
  const [upgradeMonths, setUpgradeMonths] = useState(1);
  const [activeTab, setActiveTab] = useState<'supplier' | 'buyer' | 'logistics_partner'>('supplier');

  // Fetch all users (suppliers, buyers, logistics partners) with their quotas
  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["admin-users-email", activeTab],
    queryFn: async () => {
      // Get user IDs for the active role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", activeTab);
      
      const userIds = roleData?.map(r => r.user_id) || [];
      
      if (userIds.length === 0) return [];

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id, company_name, email, contact_person,
          supplier_categories, supplier_notification_subcategories,
          email_notifications_enabled
        `)
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Get quotas (only for suppliers)
      const { data: quotas } = await supabase
        .from("supplier_email_quotas")
        .select("*");

      // Get email stats per user from logs
      const { data: logs } = await supabase
        .from("supplier_email_logs")
        .select("user_id, supplier_id, user_type, status, delivered_at, opened_at, clicked_at, bounced_at");

      // Get latest payments for suppliers
      const { data: payments } = activeTab === 'supplier' ? await supabase
        .from("email_subscription_payments")
        .select("supplier_id, status, amount, paid_at")
        .order("created_at", { ascending: false }) : { data: [] };

      // Map latest payment per supplier
      const paymentsMap = new Map<string, any>();
      payments?.forEach(p => {
        if (!paymentsMap.has(p.supplier_id)) {
          paymentsMap.set(p.supplier_id, p);
        }
      });

      // Aggregate stats per user
      const statsMap = new Map<string, any>();
      logs?.forEach(log => {
        const userId = log.user_id || log.supplier_id;
        if (!userId) return;
        const existing = statsMap.get(userId) || {
          total_sent: 0, total_delivered: 0, total_opened: 0, total_clicked: 0, total_bounced: 0
        };
        existing.total_sent++;
        if (log.status === "delivered" || log.delivered_at) existing.total_delivered++;
        if (log.opened_at) existing.total_opened++;
        if (log.clicked_at) existing.total_clicked++;
        if (log.status === "bounced" || log.bounced_at) existing.total_bounced++;
        statsMap.set(userId, existing);
      });

      return profiles?.map(p => ({
        ...p,
        user_type: activeTab,
        quota: quotas?.find(q => q.supplier_id === p.id),
        stats: statsMap.get(p.id) || { total_sent: 0, total_delivered: 0, total_opened: 0, total_clicked: 0, total_bounced: 0 },
        latestPayment: paymentsMap.get(p.id)
      })) as UserWithQuota[];
    },
  });

  // Fetch email logs for selected user
  const { data: emailLogs } = useQuery({
    queryKey: ["admin-email-logs", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from("supplier_email_logs")
        .select("*")
        .or(`user_id.eq.${selectedUser.id},supplier_id.eq.${selectedUser.id}`)
        .order("sent_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailLog[];
    },
    enabled: !!selectedUser,
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
      queryClient.invalidateQueries({ queryKey: ["admin-users-email"] });
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
      toast.success("User upgraded to premium successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users-email"] });
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
      toast.success("User downgraded to free plan");
      queryClient.invalidateQueries({ queryKey: ["admin-users-email"] });
    },
    onError: (error: any) => {
      toast.error("Failed to downgrade: " + error.message);
    },
  });

  const filteredUsers = allUsers?.filter(s => 
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

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'Suppliers';
      case 'buyer': return 'Buyers';
      case 'logistics_partner': return 'Logistics Partners';
      default: return type;
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier': return <Package className="h-4 w-4" />;
      case 'buyer': return <ShoppingCart className="h-4 w-4" />;
      case 'logistics_partner': return <Truck className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Tracking & Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* User Type Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="supplier" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Suppliers
              </TabsTrigger>
              <TabsTrigger value="buyer" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Buyers
              </TabsTrigger>
              <TabsTrigger value="logistics_partner" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logistics Partners
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${getUserTypeLabel(activeTab).toLowerCase()} by name or email...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users-email"] })}
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
                    <TableHead>Plan Period</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Daily Usage</TableHead>
                    <TableHead>Monthly Usage</TableHead>
                    <TableHead>Delivery Stats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.company_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {user.supplier_categories?.slice(0, 2).map(cat => (
                            <Badge key={cat} variant="outline" className="mr-1 mb-1 text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {(user.supplier_categories?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(user.supplier_categories?.length || 0) - 2} more
                            </Badge>
                          )}
                          {!user.supplier_categories?.length && (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.email_notifications_enabled ? (
                          <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>{activeTab === 'supplier' ? getPlanBadge(user.quota) : <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell>
                        {activeTab === 'supplier' && user.quota?.has_email_subscription ? (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>Start: {user.quota?.subscription_started_at ? format(new Date(user.quota.subscription_started_at), "MMM dd, yy") : "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className={user.quota?.subscription_expires_at && new Date(user.quota.subscription_expires_at) < new Date() ? "text-red-500" : ""}>
                                Exp: {user.quota?.subscription_expires_at ? format(new Date(user.quota.subscription_expires_at), "MMM dd, yy") : "N/A"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{activeTab === 'supplier' ? 'Free Plan' : 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'supplier' && user.latestPayment ? (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <Badge 
                              variant={user.latestPayment.status === "completed" ? "default" : "secondary"}
                              className={user.latestPayment.status === "completed" ? "bg-green-500" : user.latestPayment.status === "pending" ? "bg-yellow-500" : ""}
                            >
                              {user.latestPayment.status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{activeTab === 'supplier' ? 'No payments' : 'N/A'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'supplier' ? (
                          <span className={user.quota?.daily_emails_sent === 2 ? "text-red-500 font-medium" : ""}>
                            {user.quota?.daily_emails_sent || 0}/2
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'supplier' && user.quota?.has_email_subscription ? (
                          <span className={user.quota?.monthly_emails_sent >= 500 ? "text-red-500 font-medium" : ""}>
                            {user.quota?.monthly_emails_sent || 0}/500
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 text-xs">
                          <span title="Sent" className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{user.stats?.total_sent || 0}
                          </span>
                          <span title="Opened" className="flex items-center gap-1 text-blue-500">
                            <Eye className="h-3 w-3" />{user.stats?.total_opened || 0}
                          </span>
                          <span title="Clicked" className="flex items-center gap-1 text-purple-500">
                            <MousePointer className="h-3 w-3" />{user.stats?.total_clicked || 0}
                          </span>
                          <span title="Bounced" className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />{user.stats?.total_bounced || 0}
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
                                onClick={() => setSelectedUser(user)}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Email History - {user.company_name}</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="h-[500px]">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>RFQ / Subject</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Brevo ID</TableHead>
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
                                        <TableCell>
                                          <div className="max-w-[180px]">
                                            <div className="text-sm truncate font-medium">{log.subject}</div>
                                            {log.requirement_id && (
                                              <div className="text-xs text-muted-foreground truncate">
                                                RFQ: {log.requirement_id.substring(0, 8)}...
                                              </div>
                                            )}
                                            {log.logistics_requirement_id && (
                                              <div className="text-xs text-muted-foreground truncate">
                                                Logistics: {log.logistics_requirement_id.substring(0, 8)}...
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">{log.email_type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          <span className="text-xs text-muted-foreground font-mono">
                                            {log.brevo_message_id ? log.brevo_message_id.substring(0, 12) + "..." : "N/A"}
                                          </span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell>{log.open_count || 0}</TableCell>
                                        <TableCell>{log.click_count || 0}</TableCell>
                                      </TableRow>
                                    ))}
                                    {(!emailLogs || emailLogs.length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                          No email logs found
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>

                          {activeTab === 'supplier' && (
                            <Dialog open={adjustmentDialog && selectedUser?.id === user.id} onOpenChange={setAdjustmentDialog}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDailyAdjustment(user.quota?.daily_emails_sent || 0);
                                    setMonthlyAdjustment(user.quota?.monthly_emails_sent || 0);
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage Quota - {user.company_name}</DialogTitle>
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
                                        supplierId: user.id,
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
                                        {getPlanBadge(user.quota)}
                                        {user.quota?.subscription_expires_at && (
                                          <span className="text-sm text-muted-foreground">
                                            Expires: {format(new Date(user.quota.subscription_expires_at), "MMM dd, yyyy")}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {!user.quota?.has_email_subscription && (
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
                                          onClick={() => upgradeMutation.mutate({ supplierId: user.id, months: upgradeMonths })}
                                          disabled={upgradeMutation.isPending}
                                        >
                                          Upgrade to Premium
                                        </Button>
                                      </div>
                                    )}

                                    {user.quota?.has_email_subscription && (
                                      <Button 
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => downgradeMutation.mutate(user.id)}
                                        disabled={downgradeMutation.isPending}
                                      >
                                        Downgrade to Free
                                      </Button>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                          )}
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
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total {getUserTypeLabel(activeTab)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {activeTab === 'supplier' ? (allUsers?.filter(s => s.quota?.has_email_subscription).length || 0) : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Premium Subscribers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {allUsers?.reduce((sum, s) => sum + (s.stats?.total_sent || 0), 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Emails Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {allUsers?.length ? 
                Math.round((allUsers.reduce((sum, s) => sum + (s.stats?.total_opened || 0), 0) / 
                Math.max(allUsers.reduce((sum, s) => sum + (s.stats?.total_delivered || 0), 0), 1)) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Open Rate</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
