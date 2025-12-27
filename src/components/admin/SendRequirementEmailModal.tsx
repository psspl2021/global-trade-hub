import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  supplier_categories: string[] | null;
}

interface Requirement {
  id: string;
  title: string;
  product_category: string;
  quantity: number;
  unit: string;
  deadline: string;
  delivery_location: string;
}

interface SendRequirementEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirement: Requirement;
}

export function SendRequirementEmailModal({ open, onOpenChange, requirement }: SendRequirementEmailModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchSuppliers();
      setSelectedSuppliers(new Set());
    }
  }, [open]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Fetch all suppliers (users with supplier role)
      const { data: supplierRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supplier');

      if (!supplierRoles || supplierRoles.length === 0) {
        setSuppliers([]);
        return;
      }

      const supplierIds = supplierRoles.map(r => r.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, company_name, contact_person, email, supplier_categories')
        .in('id', supplierIds)
        .order('company_name');

      setSuppliers(profiles || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = search === '' ||
      s.company_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Suppliers matching the requirement category
  const matchingSuppliers = filteredSuppliers.filter(s => 
    s.supplier_categories?.includes(requirement.product_category)
  );

  // Other suppliers
  const otherSuppliers = filteredSuppliers.filter(s => 
    !s.supplier_categories?.includes(requirement.product_category)
  );

  const toggleSupplier = (id: string) => {
    const newSelected = new Set(selectedSuppliers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSuppliers(newSelected);
  };

  const selectAll = (supplierList: Supplier[]) => {
    const newSelected = new Set(selectedSuppliers);
    supplierList.forEach(s => newSelected.add(s.id));
    setSelectedSuppliers(newSelected);
  };

  const deselectAll = () => {
    setSelectedSuppliers(new Set());
  };

  const sendEmails = async () => {
    if (selectedSuppliers.size === 0) {
      toast.error('Please select at least one supplier');
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Get requirement items
      const { data: items } = await supabase
        .from('requirement_items')
        .select('item_name')
        .eq('requirement_id', requirement.id);

      const itemNames = items?.map(i => i.item_name).join(', ') || requirement.title;

      const selectedSuppliersList = suppliers.filter(s => selectedSuppliers.has(s.id));

      for (const supplier of selectedSuppliersList) {
        try {
          const { error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to: supplier.email,
              subject: `New Requirement: ${requirement.title}`,
              type: 'new_requirement',
              data: {
                requirement_title: requirement.title,
                category: requirement.product_category,
                quantity: requirement.quantity,
                unit: requirement.unit,
                location: requirement.delivery_location,
                deadline: requirement.deadline,
                items: itemNames,
                requirement_id: requirement.id,
              },
            },
          });

          if (error) {
            console.error(`Failed to send email to ${supplier.email}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error sending to ${supplier.email}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Sent ${successCount} email(s) successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to send ${failCount} email(s)`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error sending emails:', error);
      toast.error('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const SupplierRow = ({ supplier }: { supplier: Supplier }) => (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
      onClick={() => toggleSupplier(supplier.id)}
    >
      <Checkbox 
        checked={selectedSuppliers.has(supplier.id)}
        onCheckedChange={() => toggleSupplier(supplier.id)}
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{supplier.company_name}</div>
        <div className="text-sm text-muted-foreground truncate">{supplier.email}</div>
      </div>
      {supplier.supplier_categories?.includes(requirement.product_category) && (
        <Badge variant="secondary" className="shrink-0">Category Match</Badge>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Requirement to Suppliers
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <p className="font-medium">{requirement.title}</p>
          <p className="text-sm text-muted-foreground">
            {requirement.product_category} • {requirement.quantity} {requirement.unit}
          </p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => selectAll(matchingSuppliers)}
            disabled={matchingSuppliers.length === 0}
          >
            Select Matching ({matchingSuppliers.length})
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => selectAll(filteredSuppliers)}
          >
            Select All ({filteredSuppliers.length})
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={deselectAll}
            disabled={selectedSuppliers.size === 0}
          >
            Deselect All
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[300px] border rounded-lg">
            {matchingSuppliers.length > 0 && (
              <div>
                <div className="sticky top-0 bg-background p-2 border-b">
                  <span className="text-sm font-medium text-primary">
                    Matching Category ({matchingSuppliers.length})
                  </span>
                </div>
                {matchingSuppliers.map(s => <SupplierRow key={s.id} supplier={s} />)}
              </div>
            )}
            
            {otherSuppliers.length > 0 && (
              <div>
                <div className="sticky top-0 bg-background p-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">
                    Other Suppliers ({otherSuppliers.length})
                  </span>
                </div>
                {otherSuppliers.map(s => <SupplierRow key={s.id} supplier={s} />)}
              </div>
            )}

            {filteredSuppliers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No suppliers found
              </div>
            )}
          </ScrollArea>
        )}

        <DialogFooter className="mt-4">
          <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
            {selectedSuppliers.size} supplier(s) selected
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={sendEmails} 
            disabled={sending || selectedSuppliers.size === 0}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Emails
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
