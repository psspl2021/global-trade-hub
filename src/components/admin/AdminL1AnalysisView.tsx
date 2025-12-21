import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LineItemL1View } from '@/components/LineItemL1View';

interface Requirement {
  id: string;
  title: string;
  product_category: string;
  status: string;
  trade_type?: string;
  created_at: string;
}

interface AdminL1AnalysisViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'closed', label: 'Closed' },
];

export function AdminL1AnalysisView({ open, onOpenChange }: AdminL1AnalysisViewProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (open) {
      fetchRequirements();
    }
  }, [open]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      // Trigger auto-expire first
      await supabase.rpc('auto_expire_requirements');
      
      const { data, error } = await supabase
        .from('requirements')
        .select('id, title, product_category, status, trade_type, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRequirements((data || []) as Requirement[]);
      
      // Auto-select first requirement if available
      if (data && data.length > 0 && !selectedRequirement) {
        setSelectedRequirement(data[0] as Requirement);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase()) ||
      req.product_category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
      case 'expired':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Expired</Badge>;
      case 'awarded':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Awarded</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            L1 Supplier Analysis (Line-Item Level)
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedRequirement?.id || ''}
            onValueChange={(value) => {
              const req = requirements.find(r => r.id === value);
              setSelectedRequirement(req || null);
            }}
          >
            <SelectTrigger className="w-[350px]">
              <SelectValue placeholder="Select a requirement" />
            </SelectTrigger>
            <SelectContent>
              {filteredRequirements.map((req) => (
                <SelectItem key={req.id} value={req.id}>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[250px]">{req.title}</span>
                    {getStatusBadge(req.status)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !selectedRequirement ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a requirement to view L1 analysis
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-3">
                <span>Viewing:</span>
                <span className="font-medium text-foreground">{selectedRequirement.title}</span>
                {getStatusBadge(selectedRequirement.status)}
                <Badge variant="outline">{selectedRequirement.product_category}</Badge>
              </div>

              <LineItemL1View 
                requirementId={selectedRequirement.id} 
                tradeType={selectedRequirement.trade_type}
                showAllSuppliers={true}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
