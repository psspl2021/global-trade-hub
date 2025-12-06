import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Calendar, Phone, Building, CheckCircle, Clock, Search, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const LeadsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery({
    queryKey: ["newsletter_subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: demoRequests = [], isLoading: loadingDemos } = useQuery({
    queryKey: ["demo_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateDemoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("demo_requests")
        .update({ 
          status, 
          contacted_at: status === "contacted" ? new Date().toISOString() : null 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo_requests"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const filteredSubscribers = subscribers.filter(
    (s: any) => s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDemos = demoRequests.filter(
    (d: any) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.company_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "contacted":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Contacted</Badge>;
      case "converted":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Converted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leads Dashboard</h2>
          <p className="text-muted-foreground">Manage newsletter subscribers and demo requests</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-xs text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{demoRequests.length}</p>
                <p className="text-xs text-muted-foreground">Demo Requests</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Newsletter ({subscribers.length})
          </TabsTrigger>
          <TabsTrigger value="demos" className="gap-2">
            <Calendar className="h-4 w-4" />
            Demo Requests ({demoRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Subscribers</CardTitle>
              <CardDescription>Email leads from newsletter signups</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscribers ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : filteredSubscribers.length === 0 ? (
                <p className="text-muted-foreground">No subscribers yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.map((subscriber: any) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subscriber.source}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {subscriber.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demos">
          <Card>
            <CardHeader>
              <CardTitle>Demo Requests</CardTitle>
              <CardDescription>Sales leads requesting product demos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDemos ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : filteredDemos.length === 0 ? (
                <p className="text-muted-foreground">No demo requests yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDemos.map((demo: any) => (
                      <TableRow key={demo.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{demo.name}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {demo.email}
                            </div>
                            {demo.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {demo.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {demo.company_name ? (
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {demo.company_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {demo.message || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {format(new Date(demo.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={demo.status}
                            onValueChange={(value) => updateDemoStatus.mutate({ id: demo.id, status: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
