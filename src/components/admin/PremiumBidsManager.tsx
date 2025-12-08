import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star, Search, Plus, History } from 'lucide-react';
import { format } from 'date-fns';

interface UserWithSubscription {
  id: string;
  email: string;
  company_name: string;
  role: string;
  premium_bids_balance: number;
  subscription_id: string | null;
}

interface ActivityLog {
  id: string;
  created_at: string;
  action_type: string;
  target_details: {
    company_name?: string;
    bids_added?: number;
    new_balance?: number;
  };
}

interface PremiumBidsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

export function PremiumBidsManager({ open, onOpenChange, adminId }: PremiumBidsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [bidsToAdd, setBidsToAdd] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Search profiles by company name or email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, company_name')
        .or(`company_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profiles.map(p => p.id));

      // Get subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, user_id, premium_bids_balance')
        .in('user_id', profiles.map(p => p.id));

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const subsMap = new Map(subscriptions?.map(s => [s.user_id, s]) || []);

      const usersWithData: UserWithSubscription[] = profiles.map(p => ({
        id: p.id,
        email: p.email,
        company_name: p.company_name,
        role: rolesMap.get(p.id) || 'unknown',
        premium_bids_balance: subsMap.get(p.id)?.premium_bids_balance || 0,
        subscription_id: subsMap.get(p.id)?.id || null,
      }));

      // Filter to only show suppliers and logistics partners (users who can bid)
      setUsers(usersWithData.filter(u => u.role === 'supplier' || u.role === 'logistics_partner'));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchRecentActivity = async () => {
    const { data } = await supabase
      .from('admin_activity_logs')
      .select('id, created_at, action_type, target_details')
      .eq('action_type', 'add_premium_bids')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecentActivity((data as ActivityLog[]) || []);
  };

  useEffect(() => {
    if (open) {
      fetchRecentActivity();
    }
  }, [open]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddBids = async (user: UserWithSubscription) => {
    const bidsCount = bidsToAdd[user.id] || 0;
    if (bidsCount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid number of bids', variant: 'destructive' });
      return;
    }

    setSubmitting(user.id);
    try {
      const newBalance = user.premium_bids_balance + bidsCount;

      if (user.subscription_id) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({ premium_bids_balance: newBalance })
          .eq('id', user.subscription_id);
        if (error) throw error;
      } else {
        // Create new subscription for the user
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free',
            bids_limit: 5,
            premium_bids_balance: bidsCount,
          });
        if (error) throw error;
      }

      // Log the activity
      await supabase.from('admin_activity_logs').insert({
        admin_id: adminId,
        action_type: 'add_premium_bids',
        target_type: 'subscription',
        target_id: user.id,
        target_details: {
          company_name: user.company_name,
          bids_added: bidsCount,
          new_balance: newBalance,
        },
      });

      toast({ 
        title: 'Success', 
        description: `Added ${bidsCount} premium bids to ${user.company_name}. New balance: ${newBalance}` 
      });

      // Reset and refresh
      setBidsToAdd(prev => ({ ...prev, [user.id]: 0 }));
      fetchUsers();
      fetchRecentActivity();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Premium Bids Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map(user => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{user.company_name}</p>
                          <Badge variant="outline" className="text-xs capitalize">{user.role.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-bold text-lg">{user.premium_bids_balance}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Current balance</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="50"
                            className="w-20"
                            min={1}
                            value={bidsToAdd[user.id] || ''}
                            onChange={(e) => setBidsToAdd(prev => ({ 
                              ...prev, 
                              [user.id]: parseInt(e.target.value) || 0 
                            }))}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddBids(user)}
                            disabled={submitting === user.id || !bidsToAdd[user.id]}
                          >
                            {submitting === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-center text-muted-foreground py-8">No suppliers or logistics partners found</p>
          ) : (
            <p className="text-center text-muted-foreground py-8">Search for users to manage their premium bids</p>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {recentActivity.map(log => (
                  <div key={log.id} className="text-sm text-muted-foreground flex justify-between">
                    <span>
                      Added <strong>{log.target_details?.bids_added}</strong> bids to{' '}
                      <strong>{log.target_details?.company_name}</strong>
                      {' '}(new balance: {log.target_details?.new_balance})
                    </span>
                    <span className="text-xs">{format(new Date(log.created_at), 'PP p')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
