/**
 * Team Management Component
 * Allows CFO/CEO/Manager to add/manage team members with roles
 * for PO approval workflows.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Shield, Trash2, Loader2, KeyRound, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  email?: string;
  contact_person?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  buyer_purchaser: { label: 'Purchaser', color: 'bg-slate-500', description: 'Can create RFQs & manage procurement' },
  buyer_manager: { label: 'Manager', color: 'bg-blue-600', description: 'Approves POs (Level 1)' },
  buyer_cfo: { label: 'CFO / Director', color: 'bg-indigo-600', description: 'Approves POs (Level 2) + Financial governance' },
  buyer_ceo: { label: 'CEO', color: 'bg-purple-700', description: 'Final approval authority + Full access' },
};

export function TeamManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New member form
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('buyer_manager');

  // Password reset state
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string; email: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);
  const [callerRole, setCallerRole] = useState<string | null>(null);

  // Authority: who is allowed to reset whom
  const EXEC_RESETTERS = new Set(['buyer_ceo', 'buyer_cfo', 'buyer_vp', 'buyer_purchase_head']);
  const MANAGER_CAN_RESET = new Set(['buyer_purchaser']);
  const canResetMember = (memberRole: string): boolean => {
    if (!callerRole) return false;
    if (EXEC_RESETTERS.has(callerRole)) return true;
    if (callerRole === 'buyer_manager' && MANAGER_CAN_RESET.has(memberRole)) return true;
    return false;
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('reset-team-member-password', {
        body: { targetUserId: resetTarget.user_id },
      });
      if (error) throw error;
      if (!data?.tempPassword) throw new Error(data?.error || 'No password returned');
      setResetResult({ tempPassword: data.tempPassword, email: resetTarget.email || '' });
      toast({
        title: 'Password reset',
        description: 'Share the temp password with the user. They must change it on next login.',
      });
    } catch (err: any) {
      toast({
        title: 'Reset failed',
        description: err.message || 'Could not reset password.',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  const closeResetDialog = () => {
    setResetTarget(null);
    setResetResult(null);
    setResetCopied(false);
  };


  useEffect(() => {
    if (user?.id) fetchMembers();
  }, [user?.id]);

  const fetchMembers = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Get caller's company + role (role drives who can reset whom)
      const { data: membership } = await supabase
        .from('buyer_company_members')
        .select('company_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        setIsLoading(false);
        return;
      }
      setCompanyId(membership.company_id);
      setCallerRole(membership.role);

      // Get all members with profile info
      const { data: companyMembers, error } = await supabase
        .from('buyer_company_members')
        .select('id, user_id, role, is_active, created_at')
        .eq('company_id', membership.company_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profile data for each member
      const memberIds = (companyMembers || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, contact_person')
        .in('id', memberIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      setMembers((companyMembers || []).map(m => ({
        ...m,
        email: profileMap.get(m.user_id)?.email || '',
        contact_person: profileMap.get(m.user_id)?.contact_person || '',
      })));
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      toast({ title: 'Error', description: 'Failed to load team members.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newEmail || !newRole || !companyId) return;
    setIsSubmitting(true);

    try {
      // Find user by email in profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileErr || !profile) {
        toast({
          title: 'User Not Found',
          description: 'No account found with this email. The user must sign up first.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check if already a member
      const existing = members.find(m => m.user_id === profile.id);
      if (existing) {
        toast({
          title: 'Already a Member',
          description: `This user is already in your team as ${ROLE_LABELS[existing.role]?.label || existing.role}.`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Add member
      const { error: insertErr } = await supabase
        .from('buyer_company_members')
        .insert({
          company_id: companyId,
          user_id: profile.id,
          role: newRole,
          is_active: true,
        });

      if (insertErr) throw insertErr;

      toast({
        title: 'Member Added',
        description: `${newEmail} added as ${ROLE_LABELS[newRole]?.label || newRole}.`,
      });

      setNewEmail('');
      setNewRole('buyer_manager');
      setIsAddOpen(false);
      fetchMembers();
    } catch (err: any) {
      console.error('Failed to add member:', err);
      toast({
        title: 'Failed to Add',
        description: err.message || 'Could not add team member.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === user?.id) {
      toast({ title: 'Cannot Remove', description: 'You cannot remove yourself.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('buyer_company_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: 'Member Removed', description: 'Team member has been removed.' });
      fetchMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to remove member.', variant: 'destructive' });
    }
  };

  const handleRoleChange = async (memberId: string, memberUserId: string, newRoleValue: string) => {
    if (memberUserId === user?.id) {
      toast({ title: 'Cannot Change', description: 'You cannot change your own role.', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('buyer_company_members')
        .update({ role: newRoleValue })
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: 'Role Updated', description: `Role changed to ${ROLE_LABELS[newRoleValue]?.label || newRoleValue}.` });
      fetchMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update role.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Loading team...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Team & Approval Roles</CardTitle>
                <CardDescription>
                  Manage who can approve Purchase Orders. Notifications will be sent to Manager & CEO-level approvers.
                </CardDescription>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add an existing user to your company team. They must have a ProcureSaathi account first.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="manager@company.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer_manager">
                          Manager — PO Approval Level 1
                        </SelectItem>
                        <SelectItem value="buyer_cfo">
                          CFO / Director — PO Approval Level 2
                        </SelectItem>
                        <SelectItem value="buyer_ceo">
                          CEO — Final Approval Authority
                        </SelectItem>
                        <SelectItem value="buyer_purchaser">
                          Purchaser — Procurement Execution
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[newRole]?.description}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMember} disabled={isSubmitting || !newEmail}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Role Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(ROLE_LABELS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <Badge className={`${val.color} text-white text-xs`}>{val.label}</Badge>
                <span className="text-xs text-muted-foreground hidden md:inline">{val.description}</span>
              </div>
            ))}
          </div>

          {/* Members Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const roleInfo = ROLE_LABELS[member.role] || { label: member.role, color: 'bg-gray-500' };
                const isCurrentUser = member.user_id === user?.id;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {member.contact_person || 'Unknown'}
                          {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <Badge className={`${roleInfo.color} text-white`}>{roleInfo.label}</Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, member.user_id, val)}
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer_purchaser">Purchaser</SelectItem>
                            <SelectItem value="buyer_manager">Manager</SelectItem>
                            <SelectItem value="buyer_cfo">CFO / Director</SelectItem>
                            <SelectItem value="buyer_ceo">CEO</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'default' : 'secondary'}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isCurrentUser && canResetMember(member.role) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            title="Reset password (issues a new temp password)"
                            onClick={() => setResetTarget(member)}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id, member.user_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No team members yet. Add your first member above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>PO Approval Flow:</strong> When a reverse auction completes, Manager and CEO/CFO-level approvers receive automated email notifications to create and approve the Purchase Order.</p>
              <p><strong>Approval Chain:</strong> Purchaser creates PO → Manager approves (Level 1) → Director/CFO approves (Level 2) → PO locked.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
