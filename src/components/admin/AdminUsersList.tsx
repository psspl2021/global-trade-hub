import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Users, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';

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

export function AdminUsersList({ open, onOpenChange }: AdminUsersListProps) {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('buyer');

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (!roles) return;

      const userIds = roles.map(r => r.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, phone, city, state, gstin, created_at')
        .in('id', userIds);

      if (!profiles) return;

      const combined: UserWithProfile[] = roles.map(role => {
        const profile = profiles.find(p => p.id === role.user_id);
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

  const filteredUsers = users.filter(user => {
    const matchesRole = user.role === activeTab;
    const matchesSearch = search === '' || 
      user.company_name.toLowerCase().includes(search.toLowerCase()) ||
      user.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const counts = {
    buyer: users.filter(u => u.role === 'buyer').length,
    supplier: users.filter(u => u.role === 'supplier').length,
    logistics_partner: users.filter(u => u.role === 'logistics_partner').length,
  };

  return (
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
              Buyers ({counts.buyer})
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Suppliers ({counts.supplier})
            </TabsTrigger>
            <TabsTrigger value="logistics_partner" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Logistics ({counts.logistics_partner})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="buyer" className="flex-1 overflow-auto mt-4">
                <UserTable users={filteredUsers} />
              </TabsContent>
              <TabsContent value="supplier" className="flex-1 overflow-auto mt-4">
                <UserTable users={filteredUsers} />
              </TabsContent>
              <TabsContent value="logistics_partner" className="flex-1 overflow-auto mt-4">
                <UserTable users={filteredUsers} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UserTable({ users }: { users: UserWithProfile[] }) {
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
