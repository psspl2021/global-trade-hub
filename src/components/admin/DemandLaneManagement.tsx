/**
 * ============================================================
 * DEMAND LANE MANAGEMENT (ADMIN)
 * ============================================================
 * 
 * Manages high-intent lane locks and supplier assignments.
 * When intent >= 7, lanes can be locked to top 3 suppliers.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Lock, 
  Unlock, 
  Users, 
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface LaneLock {
  id: string;
  category: string;
  country: string;
  intent_threshold: number;
  max_suppliers: number;
  is_active: boolean;
  locked_at: string;
  expires_at: string;
  assignments?: LaneAssignment[];
}

interface LaneAssignment {
  id: string;
  supplier_id: string;
  priority_rank: number;
  assigned_at: string;
  supplier_name?: string;
}

export function DemandLaneManagement() {
  const [lanes, setLanes] = useState<LaneLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLane, setNewLane] = useState({ category: '', country: '' });

  const fetchLanes = useCallback(async () => {
    try {
      const { data: lanesData, error: lanesError } = await supabase
        .from('demand_lane_locks')
        .select('*')
        .order('created_at', { ascending: false });

      if (lanesError) throw lanesError;

      // Fetch assignments for each lane
      const lanesWithAssignments = await Promise.all(
        (lanesData || []).map(async (lane: any) => {
          const { data: assignments } = await supabase
            .from('lane_supplier_assignments')
            .select('*')
            .eq('lane_lock_id', lane.id)
            .eq('is_active', true)
            .order('priority_rank');

          return {
            ...lane,
            assignments: assignments || [],
          };
        })
      );

      setLanes(lanesWithAssignments as LaneLock[]);
    } catch (err) {
      console.error('[DemandLaneManagement] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLane = useCallback(async () => {
    if (!newLane.category || !newLane.country) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('demand_lane_locks')
        .insert({
          category: newLane.category,
          country: newLane.country,
          intent_threshold: 7,
          max_suppliers: 3,
        });

      if (error) throw error;
      toast.success('Lane locked successfully');
      setCreateDialogOpen(false);
      setNewLane({ category: '', country: '' });
      fetchLanes();
    } catch (err: any) {
      console.error('[DemandLaneManagement] Create error:', err);
      toast.error(err.message || 'Failed to create lane lock');
    }
  }, [newLane, fetchLanes]);

  const toggleLaneActive = useCallback(async (laneId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('demand_lane_locks')
        .update({ is_active: !currentActive })
        .eq('id', laneId);

      if (error) throw error;
      toast.success(currentActive ? 'Lane unlocked' : 'Lane locked');
      fetchLanes();
    } catch (err) {
      console.error('[DemandLaneManagement] Toggle error:', err);
    }
  }, [fetchLanes]);

  const removeAssignment = useCallback(async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('lane_supplier_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;
      toast.success('Supplier removed from lane');
      fetchLanes();
    } catch (err) {
      console.error('[DemandLaneManagement] Remove error:', err);
    }
  }, [fetchLanes]);

  useEffect(() => {
    fetchLanes();
  }, [fetchLanes]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Demand Lane Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading lanes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Demand Lane Management
        </CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Lock Lane
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lock High-Intent Lane</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newLane.category}
                  onChange={(e) => setNewLane({ ...newLane, category: e.target.value })}
                  placeholder="e.g., Industrial Consumables"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country Code</label>
                <Input
                  value={newLane.country}
                  onChange={(e) => setNewLane({ ...newLane, country: e.target.value })}
                  placeholder="e.g., IN, AE, NG"
                />
              </div>
              <Button onClick={createLane} className="w-full">
                <Lock className="h-4 w-4 mr-1" />
                Lock Lane
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {lanes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Unlock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No locked lanes</p>
            <p className="text-sm mt-1">
              Lock lanes when intent reaches 7+ to restrict to top suppliers
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Suppliers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lanes.map((lane) => (
                <TableRow key={lane.id}>
                  <TableCell className="font-medium">{lane.category}</TableCell>
                  <TableCell>{lane.country}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {lane.assignments?.length || 0} / {lane.max_suppliers}
                      </span>
                    </div>
                    {lane.assignments && lane.assignments.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {lane.assignments.map((a) => (
                          <div key={a.id} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              #{a.priority_rank}
                            </Badge>
                            <span className="truncate max-w-[100px]">
                              {a.supplier_id.slice(0, 8)}...
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => removeAssignment(a.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lane.is_active ? 'default' : 'secondary'}>
                      {lane.is_active ? 'Locked' : 'Unlocked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lane.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLaneActive(lane.id, lane.is_active)}
                    >
                      {lane.is_active ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default DemandLaneManagement;
