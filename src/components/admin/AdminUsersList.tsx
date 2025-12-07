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
import { Loader2, Search, Users, Package, Truck, Trash2 } from 'lucide-react';
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
}

interface AdminUsersListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 15;

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
        .select('id, company_name, contact_person, email, phone, city, state, gstin, created_at')
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
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} />
                </TabsContent>
                <TabsContent value="supplier" className="flex-1 overflow-auto mt-4">
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} />
                </TabsContent>
                <TabsContent value="logistics_partner" className="flex-1 overflow-auto mt-4">
                  <UserTable users={filteredUsers} onDelete={handleDeleteClick} />
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
    </>
  );
}

interface UserTableProps {
  users: UserWithProfile[];
  onDelete: (user: UserWithProfile) => void;
}

function UserTable({ users, onDelete }: UserTableProps) {
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
          <TableHead>Location</TableHead>
          <TableHead>GSTIN</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead className="w-[70px]">Actions</TableHead>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(user)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}