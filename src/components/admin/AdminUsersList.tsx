import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, Users, Package, Truck, Trash2, ArrowRightLeft, Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface UserWithProfile {
  user_id: string;
  role: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  gstin: string | null;
  created_at: string;
  referred_by_name: string | null;
  referred_by_phone: string | null;
}

interface AdminUsersListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 15;

type AppRole = 'buyer' | 'supplier' | 'logistics_partner';

export function AdminUsersList({ open, onOpenChange }: AdminUsersListProps) {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('buyer');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({ buyer: 0, supplier: 0, logistics_partner: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState<UserWithProfile | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('buyer');
  const [transferring, setTransferring] = useState(false);
  const [editReferralDialogOpen, setEditReferralDialogOpen] = useState(false);
  const [userToEditReferral, setUserToEditReferral] = useState<UserWithProfile | null>(null);
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');
  const [savingReferral, setSavingReferral] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTabCounts();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchUsers(activeTab as 'buyer' | 'supplier' | 'logistics_partner');
    }
  }, [open, activeTab, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const fetchTabCounts = async () => {
    try {
      const { data: roles } = await supabase.from('user_roles').select('role');
      if (roles) {
        setTabCounts({
          buyer: roles.filter(r => r.role === 'buyer').length,
          supplier: roles.filter(r => r.role === 'supplier').length,
          logistics_partner: roles.filter(r => r.role === 'logistics_partner').length,
        });
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchUsers = async (role: 'buyer' | 'supplier' | 'logistics_partner') => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: roles, count } = await supabase
        .from('user_roles')
        .select('user_id, role', { count: 'exact' })
        .eq('role', role)
        .range(from, to);

      if (!roles) {
        setUsers([]);
        setTotalCount(0);
        return;
      }

      setTotalCount(count || 0);

      const userIds = roles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone, city, state, gstin, created_at, referred_by_name, referred_by_phone')
        .in('id', userIds);

      const combined: UserWithProfile[] = roles.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role,
          company_name: profile?.company_name || '',
          contact_person: profile?.contact_person || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
          city: profile?.city || null,
          state: profile?.state || null,
          gstin: profile?.gstin || null,
          created_at: profile?.created_at || '',
          referred_by_name: profile?.referred_by_name || null,
          referred_by_phone: profile?.referred_by_phone || null,
        };
      });

      setUsers(combined);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: UserWithProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleTransferClick = (user: UserWithProfile) => {
    setUserToTransfer(user);
    // Set default new role to something different from current
    const currentRole = user.role as AppRole;
    if (currentRole === 'buyer') setNewRole('supplier');
    else if (currentRole === 'supplier') setNewRole('buyer');
    else setNewRole('buyer');
    setTransferDialogOpen(true);
  };

  const handleTransferConfirm = async () => {
    if (!userToTransfer || newRole === userToTransfer.role) return;

    setTransferring(true);
    try {
      // Update the user's role in user_roles table
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userToTransfer.user_id)
        .eq('role', userToTransfer.role as AppRole);

      if (error) throw error;

      // If transferring to supplier/logistics_partner, ensure subscription exists
      if (newRole === 'supplier' || newRole === 'logistics_partner') {
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userToTransfer.user_id)
          .single();

        if (!existingSub) {
          await supabase
            .from('subscriptions')
            .insert({ user_id: userToTransfer.user_id, tier: 'free', bids_limit: 5 });
        }
      }

      toast.success(`${userToTransfer.company_name} transferred to ${newRole.replace('_', ' ')}`);
      
      // Refresh the list
      fetchUsers(activeTab as AppRole);
      fetchTabCounts();
      
    } catch (error) {
      console.error('Error transferring user:', error);
      toast.error('Failed to transfer user role');
    } finally {
      setTransferring(false);
      setTransferDialogOpen(false);
      setUserToTransfer(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to delete users');
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.user_id }
      });

      if (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete user: ' + error.message);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`${userToDelete.company_name} has been deleted`);
      
      // Refresh the list
      fetchUsers(activeTab as 'buyer' | 'supplier' | 'logistics_partner');
      fetchTabCounts();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditReferralClick = (user: UserWithProfile) => {
    setUserToEditReferral(user);
    setReferralName(user.referred_by_name || '');
    setReferralPhone(user.referred_by_phone || '');
    setEditReferralDialogOpen(true);
  };

  const handleSaveReferral = async () => {
    if (!userToEditReferral) return;

    setSavingReferral(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          referred_by_name: referralName || null,
          referred_by_phone: referralPhone || null,
        })
        .eq('id', userToEditReferral.user_id);

      if (error) throw error;

      toast.success('Referral information updated');
      
      // Refresh the list
      fetchUsers(activeTab as AppRole);
      
    } catch (error) {
      console.error('Error updating referral:', error);
      toast.error('Failed to update referral information');
    } finally {
      setSavingReferral(false);
      setEditReferralDialogOpen(false);
      setUserToEditReferral(null);
    }
  };

  const filteredUsers = users.filter(user => {
    return search === '' || 
      user.company_name.toLowerCase().includes(search.toLowerCase()) ||
      user.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="buyer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Buyers ({tabCounts.buyer})
              </TabsTrigger>
              <TabsTrigger value="supplier" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Suppliers ({tabCounts.supplier})
              </TabsTrigger>
              <TabsTrigger value="logistics_partner" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logistics ({tabCounts.logistics_partner})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <TabsContent value="buyer" className="flex-1 overflow-auto mt-4">
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} onTransfer={handleTransferClick} onEditReferral={handleEditReferralClick} />
                </TabsContent>
                <TabsContent value="supplier" className="flex-1 overflow-auto mt-4">
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} onTransfer={handleTransferClick} onEditReferral={handleEditReferralClick} />
                </TabsContent>
                <TabsContent value="logistics_partner" className="flex-1 overflow-auto mt-4">
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} onTransfer={handleTransferClick} onEditReferral={handleEditReferralClick} />
                </TabsContent>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {getPageNumbers().map((page, idx) =>
                          page === 'ellipsis' ? (
                            <PaginationItem key={`ellipsis-${idx}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          ) : (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.company_name}</strong>? 
              This action cannot be undone. All associated data including bids, requirements, and documents will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer User Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Transfer <strong>{userToTransfer?.company_name}</strong> from {userToTransfer?.role?.replace('_', ' ')} to a different role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">New Role</label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer" disabled={userToTransfer?.role === 'buyer'}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Buyer
                  </div>
                </SelectItem>
                <SelectItem value="supplier" disabled={userToTransfer?.role === 'supplier'}>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Supplier
                  </div>
                </SelectItem>
                <SelectItem value="logistics_partner" disabled={userToTransfer?.role === 'logistics_partner'}>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Logistics Partner
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferConfirm}
              disabled={transferring || newRole === userToTransfer?.role}
            >
              {transferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editReferralDialogOpen} onOpenChange={setEditReferralDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Referred By
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Editing referral for <strong>{userToEditReferral?.company_name}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="referral-name">Referrer Name</Label>
              <Input
                id="referral-name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                placeholder="Enter referrer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral-phone">Referrer Phone</Label>
              <Input
                id="referral-phone"
                value={referralPhone}
                onChange={(e) => setReferralPhone(e.target.value)}
                placeholder="Enter referrer phone"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditReferralDialogOpen(false)} disabled={savingReferral}>
              Cancel
            </Button>
            <Button onClick={handleSaveReferral} disabled={savingReferral}>
              {savingReferral ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface UserTableProps {
  users: UserWithProfile[];
  onDelete: (user: UserWithProfile) => void;
  onTransfer: (user: UserWithProfile) => void;
  onEditReferral: (user: UserWithProfile) => void;
}

function UserTable({ users, onDelete, onTransfer, onEditReferral }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company Name</TableHead>
          <TableHead>Contact Person</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Referred By</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>GSTIN</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.user_id}>
            <TableCell className="font-medium">{user.company_name}</TableCell>
            <TableCell>{user.contact_person}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {user.referred_by_name ? (
                  <div className="text-sm">
                    <div>{user.referred_by_name}</div>
                    {user.referred_by_phone && (
                      <div className="text-muted-foreground text-xs">{user.referred_by_phone}</div>
                    )}
                  </div>
                ) : <span className="text-muted-foreground">-</span>}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onEditReferral(user)}
                  title="Edit Referral"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
            <TableCell>
              {user.city && user.state ? `${user.city}, ${user.state}` : user.city || user.state || '-'}
            </TableCell>
            <TableCell>
              {user.gstin ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {user.gstin}
                </Badge>
              ) : '-'}
            </TableCell>
            <TableCell>
              {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '-'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTransfer(user)}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  title="Transfer Role"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(user)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete User"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}