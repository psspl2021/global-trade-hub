import { useState, useEffect, useCallback } from 'react';
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
  Globe, Tag, RefreshCw, CheckCircle, XCircle, Factory, Pencil
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { categoriesData } from '@/data/categories';
import { 
  categorySubcategoryMap, 
  getSubcategoriesForCategory, 
  getIndustriesForSubcategory, 
  getAllIndustriesForCategory,
  prettyLabel 
} from '@/data/categorySubcategoryMap';

interface Lead {
  id: string;
  company_name: string;
  buyer_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  category: string;
  subcategory: string;  // ✅ NEW: Subcategory
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
    subcategory: '',  // ✅ NEW: Subcategory filter
    country: '',
    status: '',
    company_role: '',
    search: '',
    industry: '',
  });

  // Get all category names for dropdown (only those with subcategory mapping)
  const categoryOptions = Object.keys(categorySubcategoryMap);

  // ✅ Dynamic subcategory options based on selected category
  const subcategoryOptions = filters.category 
    ? getSubcategoriesForCategory(filters.category) 
    : [];

  // ✅ Dynamic industry options based on selected subcategory (or category fallback)
  const industryOptions = filters.subcategory && filters.category
    ? getIndustriesForSubcategory(filters.category, filters.subcategory)
    : filters.category 
      ? getAllIndustriesForCategory(filters.category)
      : [];
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

  // ✅ Edit lead state
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // ✅ Listen for filter changes from dashboard KPI cards
  useEffect(() => {
    const handleFilterChange = (e: CustomEvent<{ status: string | null }>) => {
      if (e.detail.status) {
        setFilters(prev => ({ ...prev, status: e.detail.status || '' }));
      }
    };
    
    // Check sessionStorage for initial filter
    const storedFilter = sessionStorage.getItem('ai_sales_status_filter');
    if (storedFilter) {
      setFilters(prev => ({ ...prev, status: storedFilter }));
      sessionStorage.removeItem('ai_sales_status_filter');
    }
    
    window.addEventListener('ai-sales-filter-change', handleFilterChange as EventListener);
    return () => {
      window.removeEventListener('ai-sales-filter-change', handleFilterChange as EventListener);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { 
          action: 'get_leads',
          category: filters.category?.toLowerCase() || '',
          subcategory: filters.subcategory?.toLowerCase() || '', // ✅ NEW: Pass subcategory
          country: filters.country?.toLowerCase() || '',
          industry: filters.industry?.toLowerCase() || '',
          status: filters.status || '',
          company_role: filters.company_role || '',
          search: filters.search || '',
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

  // Debounce search to prevent too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    fetchLeads();
  }, [filters.category, filters.subcategory, filters.country, filters.status, filters.company_role, filters.industry, debouncedSearch]); // ✅ Added subcategory dependency

  const handleAddLead = async () => {
    // ✅ Validate required fields
    if (!newLead.category) {
      toast.error('Please select a category');
      return;
    }
    if (!newLead.company_name.trim()) {
      toast.error('Please enter company name');
      return;
    }
    
    try {
      // ✅ Normalize category/country to lowercase for DB consistency
      const safeLead = {
        ...newLead,
        category: newLead.category.toLowerCase(),
        country: newLead.country.toLowerCase(),
        city: newLead.city.toLowerCase(),
      };
      
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { action: 'create_lead', lead: safeLead },
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

  // ✅ Handle editing a lead
  const handleEditLead = async () => {
    if (!editLead) return;
    
    setEditLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-sales-discover', {
        body: { 
          action: 'update_lead', 
          id: editLead.id,
          buyer_name: editLead.buyer_name,
          email: editLead.email,
          phone: editLead.phone,
          city: editLead.city,
          notes: editLead.notes,
          status: editLead.status,
        },
      });

      if (response.error) throw response.error;
      toast.success('Lead updated successfully');
      setShowEditDialog(false);
      setEditLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setEditLoading(false);
    }
  };

  // ✅ Open edit dialog when row is clicked
  const handleRowClick = (lead: Lead, e: React.MouseEvent) => {
    // Don't open edit if clicking on checkbox
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
    setEditLead(lead);
    setShowEditDialog(true);
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

  // Since backend now handles all filtering, just use leads directly
  const filteredLeads = leads;

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

          {/* Category */}
          <Select 
            value={filters.category} 
            onValueChange={(v) => {
              const cat = v === 'all' ? '' : v;
              // Reset subcategory and industry when category changes
              const firstSubcategory = cat ? getSubcategoriesForCategory(cat)[0] || '' : '';
              const firstIndustry = cat && firstSubcategory 
                ? getIndustriesForSubcategory(cat, firstSubcategory)[0] || '' 
                : '';
              setFilters({
                ...filters, 
                category: cat, 
                subcategory: firstSubcategory,
                industry: firstIndustry
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {prettyLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* ✅ NEW: Subcategory (dynamic based on category) */}
          <Select 
            value={filters.subcategory} 
            onValueChange={(v) => {
              const sub = v === 'all' ? '' : v;
              // Reset industry when subcategory changes
              const firstIndustry = filters.category && sub 
                ? getIndustriesForSubcategory(filters.category, sub)[0] || '' 
                : '';
              setFilters({...filters, subcategory: sub, industry: firstIndustry});
            }}
            disabled={!filters.category}
          >
            <SelectTrigger className={!filters.category ? 'opacity-50' : ''}>
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategoryOptions.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {prettyLabel(sub)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Industry Segment (dynamic based on subcategory - disabled until subcategory selected) */}
          <div className="relative">
            <Select 
              value={filters.industry} 
              onValueChange={(v) => setFilters({...filters, industry: v === 'all' ? '' : v})}
              disabled={!filters.subcategory} // ✅ FIXED: Require subcategory before industry
            >
              <SelectTrigger className={!filters.subcategory ? 'opacity-50' : ''}>
                <SelectValue placeholder={filters.subcategory ? "Industry" : "Select subcategory first"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Industries</SelectItem>
                {industryOptions.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {prettyLabel(ind)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.subcategory && filters.industry && (
              <span className="absolute -top-2 right-2 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                ✨ Auto
              </span>
            )}
          </div>

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
              subcategory: '',
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
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => handleRowClick(lead, e)}
                  >
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
                      <div className="font-medium flex items-center gap-1">
                        {lead.company_name}
                        <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-xs text-muted-foreground">{lead.buyer_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {lead.email || '-'}
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
                      <div>
                        <Badge variant="outline">{prettyLabel(lead.category || '')}</Badge>
                        {lead.subcategory && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {prettyLabel(lead.subcategory)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.industry_segment ? (
                        <Badge variant="secondary">
                          <Factory className="w-3 h-3 mr-1" />
                          {prettyLabel(lead.industry_segment)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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

        {/* ✅ Edit Lead Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Edit Lead: {editLead?.company_name}
              </DialogTitle>
            </DialogHeader>
            {editLead && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input 
                      value={editLead.company_name}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input 
                      value={editLead.buyer_name || ''}
                      onChange={(e) => setEditLead({...editLead, buyer_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={editLead.email || ''}
                      onChange={(e) => setEditLead({...editLead, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={editLead.phone || ''}
                      onChange={(e) => setEditLead({...editLead, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input 
                      value={editLead.city || ''}
                      onChange={(e) => setEditLead({...editLead, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select 
                      value={editLead.status} 
                      onValueChange={(v) => setEditLead({...editLead, status: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="rfq_created">RFQ Created</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="ignored">Ignored</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea 
                    value={editLead.notes || ''}
                    onChange={(e) => setEditLead({...editLead, notes: e.target.value})}
                    placeholder="Add notes about this lead..."
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Category:</span> {prettyLabel(editLead.category || '')} | 
                    <span className="font-medium ml-2">Country:</span> {editLead.country} |
                    <span className="font-medium ml-2">Industry:</span> {prettyLabel(editLead.industry_segment || '')}
                  </div>
                  <Button onClick={handleEditLead} disabled={editLoading}>
                    {editLoading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
