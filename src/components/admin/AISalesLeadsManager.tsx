import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Search, Mail, Phone, Building, 
  Globe, Tag, RefreshCw, CheckCircle, XCircle, Factory
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { categoriesData } from '@/data/categories';

interface Lead {
  id: string;
  company_name: string;
  buyer_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  category: string;
  industry_segment: string;
  buyer_type: string;
  company_role: string;
  lead_source: string;
  confidence_score: number;
  status: string;
  notes: string;
  discovered_at: string;
}

export function AISalesLeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    country: '',
    status: '',
    company_role: '',
    search: '',
    industry: '',
  });

  // Get all category names for dropdown
  const categoryOptions = categoriesData.map(cat => cat.name);

  // Industry segments commonly used
  const industryOptions = [
    'construction & infrastructure',
    'fabrication & structural steel',
    'machinery manufacturing',
    'heavy engineering',
    'automotive manufacturing',
    'aerospace & defense',
    'oil & gas',
    'power & energy',
    'railways',
    'shipbuilding',
    'mining',
    'pharmaceuticals',
    'textiles',
    'food processing',
    'paper & pulp',
    'water treatment',
    'agriculture',
    'cement',
    'glass & ceramics',
    'plastics & polymers',
  ];
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: '',
    buyer_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    category: '',
    buyer_type: 'manufacturer',
    lead_source: 'manual',
    confidence_score: 0.7,
    notes: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { 
          action: 'get_leads',
          ...filters,
        },
      });

      if (response.error) throw response.error;
      setLeads(response.data.leads || []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters.category, filters.country, filters.status, filters.company_role]);

  const handleAddLead = async () => {
    try {
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { action: 'create_lead', lead: newLead },
      });

      if (response.error) throw response.error;
      toast.success('Lead added successfully');
      setShowAddDialog(false);
      setNewLead({
        company_name: '',
        buyer_name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        category: '',
        buyer_type: 'manufacturer',
        lead_source: 'manual',
        confidence_score: 0.7,
        notes: '',
      });
      fetchLeads();
    } catch (error) {
      console.error('Failed to add lead:', error);
      toast.error('Failed to add lead');
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedLeads.length === 0) {
      toast.error('Select leads first');
      return;
    }

    try {
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { 
          action: 'bulk_update_status', 
          ids: selectedLeads, 
          status: newStatus 
        },
      });

      if (response.error) throw response.error;
      toast.success(`Updated ${response.data.updated} leads to ${newStatus}`);
      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      console.error('Failed to update leads:', error);
      toast.error('Failed to update leads');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      rfq_created: 'bg-purple-100 text-purple-800',
      closed: 'bg-green-100 text-green-800',
      ignored: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !filters.search || 
      lead.company_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.buyer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      lead.industry_segment?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesIndustry = !filters.industry || 
      lead.industry_segment?.toLowerCase().includes(filters.industry.toLowerCase());
    
    return matchesSearch && matchesIndustry;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Sales Leads</CardTitle>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company Name</Label>
                      <Input 
                        value={newLead.company_name}
                        onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Buyer Name</Label>
                      <Input 
                        value={newLead.buyer_name}
                        onChange={(e) => setNewLead({...newLead, buyer_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={newLead.phone}
                        onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Country</Label>
                      <Input 
                        value={newLead.country}
                        onChange={(e) => setNewLead({...newLead, country: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input 
                        value={newLead.city}
                        onChange={(e) => setNewLead({...newLead, city: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select 
                        value={newLead.category} 
                        onValueChange={(v) => setNewLead({...newLead, category: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px]">
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat.toLowerCase()}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Buyer Type</Label>
                      <Select 
                        value={newLead.buyer_type} 
                        onValueChange={(v) => setNewLead({...newLead, buyer_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="trader">Trader</SelectItem>
                          <SelectItem value="importer">Importer</SelectItem>
                          <SelectItem value="retailer">Retailer</SelectItem>
                          <SelectItem value="distributor">Distributor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      value={newLead.notes}
                      onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleAddLead}>Add Lead</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={fetchLeads}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {/* Search */}
          <div className="col-span-2 md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
          </div>

          {/* Category - All ProcureSaathi Categories */}
          <Select 
            value={filters.category} 
            onValueChange={(v) => setFilters({...filters, category: v === 'all' ? '' : v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Industry Segment */}
          <Select 
            value={filters.industry} 
            onValueChange={(v) => setFilters({...filters, industry: v === 'all' ? '' : v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Industries</SelectItem>
              {industryOptions.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  <span className="capitalize">{ind}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select 
            value={filters.status} 
            onValueChange={(v) => setFilters({...filters, status: v === 'all' ? '' : v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="rfq_created">RFQ Created</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>

          {/* Role */}
          <Select 
            value={filters.company_role} 
            onValueChange={(v) => setFilters({...filters, company_role: v === 'all' ? '' : v})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilters({
              category: '',
              country: '',
              status: '',
              company_role: '',
              search: '',
              industry: '',
            })}
            className="h-10"
          >
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="flex gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm">{selectedLeads.length} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('contacted')}>
              <Mail className="w-3 h-3 mr-1" /> Mark Contacted
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('ignored')}>
              <XCircle className="w-3 h-3 mr-1" /> Ignore
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedLeads([])}>
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedLeads(checked ? filteredLeads.map(l => l.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No leads found. Add leads manually or run AI discovery.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          setSelectedLeads(
                            checked 
                              ? [...selectedLeads, lead.id]
                              : selectedLeads.filter(id => id !== lead.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.company_name}</div>
                      <div className="text-xs text-muted-foreground">{lead.buyer_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {lead.country}
                      </div>
                      {lead.city && <div className="text-xs text-muted-foreground">{lead.city}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm capitalize">
                        <Factory className="w-3 h-3 text-muted-foreground" />
                        {lead.industry_segment || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.company_role === 'buyer' ? 'default' : 
                        lead.company_role === 'supplier' ? 'secondary' : 'outline'
                      } className="capitalize">
                        {lead.company_role || 'buyer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{lead.buyer_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${
                        lead.confidence_score >= 0.7 ? 'text-green-600' : 
                        lead.confidence_score >= 0.4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(lead.confidence_score * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
