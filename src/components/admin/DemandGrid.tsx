/**
 * ============================================================
 * DEMAND GRID COMPONENT
 * ============================================================
 * 
 * Auto-generated demand intelligence grid using existing SEO taxonomy.
 * NO new URLs created - purely for internal demand visualization.
 * 
 * Architecture:
 * - Uses countries.ts (195 countries)
 * - Uses categories.ts (all categories + subcategories)
 * - GEO-SAFE language (no fake numbers, no revenue claims)
 */

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Filter, 
  Search,
  TrendingUp,
  Zap,
  RefreshCw,
  Info,
  Package,
  MapPin,
  Layers
} from "lucide-react";
import {
  getFilteredDemandGrid,
  getDemandGridStats,
  getAllCountriesForGrid,
  getAllCategoriesForGrid,
  getSubcategoriesForCategory,
  getTopCategoriesByDetection,
  logDemandGridStats,
  type DemandGridRow,
  type DemandGridFilters,
  type DemandGridStats
} from "@/lib/demandGridGenerator";
import { IllustrativeDisclaimer } from "@/components/IllustrativeDisclaimer";

// ============= COMPONENT =============

export function DemandGrid() {
  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data
  const [gridRows, setGridRows] = useState<DemandGridRow[]>([]);
  const [stats, setStats] = useState<DemandGridStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dropdown options
  const allCountries = useMemo(() => getAllCountriesForGrid(), []);
  const allCategories = useMemo(() => getAllCategoriesForGrid(), []);
  const subcategories = useMemo(() => 
    categoryFilter !== 'all' ? getSubcategoriesForCategory(categoryFilter) : [],
    [categoryFilter]
  );
  
  // Top categories for insights
  const topCategories = useMemo(() => getTopCategoriesByDetection(5), []);
  
  // Fetch stats on mount
  useEffect(() => {
    const statsData = getDemandGridStats();
    setStats(statsData);
    
    // Log stats in DEV mode
    logDemandGridStats();
  }, []);
  
  // Fetch filtered data when filters change
  useEffect(() => {
    setLoading(true);
    
    const filters: DemandGridFilters = {
      country: countryFilter,
      category: categoryFilter,
      subcategory: subcategoryFilter,
      status: statusFilter as any,
    };
    
    // Get filtered rows
    let rows = getFilteredDemandGrid(filters, 200);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      rows = rows.filter(row => 
        row.subcategory_name.toLowerCase().includes(query) ||
        row.category_name.toLowerCase().includes(query) ||
        row.country_name.toLowerCase().includes(query)
      );
    }
    
    setGridRows(rows);
    setLoading(false);
  }, [countryFilter, categoryFilter, subcategoryFilter, statusFilter, searchQuery]);
  
  // Reset subcategory when category changes
  useEffect(() => {
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  // Format functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Lane Active':
        return <Badge className="bg-green-600 text-white">Lane Active</Badge>;
      case 'Lane Pending':
        return <Badge className="bg-amber-500 text-white">Lane Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">No Lane</Badge>;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'Detected':
        return <Badge className="bg-blue-600 text-white">Detected</Badge>;
      default:
        return <Badge variant="outline">No Signal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Global Demand Grid</h2>
            <p className="text-sm text-muted-foreground">
              Auto-generated from SEO taxonomy • {stats?.totalCountries || 0} countries × {stats?.totalProducts || 0} products
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            <Layers className="w-3 h-3 mr-1" />
            {stats?.totalGridRows?.toLocaleString() || '0'} rows available
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setCountryFilter("all");
              setCategoryFilter("all");
              setSubcategoryFilter("all");
              setStatusFilter("all");
              setSearchQuery("");
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* AI INSIGHTS PANEL */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats?.totalCountries || 0}</p>
              <p className="text-xs text-blue-600/70 uppercase tracking-wide">Countries Covered</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{stats?.totalCategories || 0}</p>
              <p className="text-xs text-green-600/70 uppercase tracking-wide">Categories</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats?.totalProducts || 0}</p>
              <p className="text-xs text-purple-600/70 uppercase tracking-wide">Products</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{gridRows.length}</p>
              <p className="text-xs text-amber-600/70 uppercase tracking-wide">Filtered Rows</p>
            </div>
          </div>
        </Card>
      </div>

      {/* TOP CATEGORIES INSIGHT */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm">AI Insight: Top Categories by Product Coverage</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {topCategories.map((cat, idx) => (
                <Badge 
                  key={cat.categorySlug} 
                  variant={idx === 0 ? "default" : "outline"}
                  className={idx === 0 ? "bg-blue-600" : ""}
                >
                  {cat.category.split(' ')[0]}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              These categories have the highest product coverage across all {stats?.totalCountries} countries.
            </p>
          </div>
        </div>
      </Card>

      {/* FILTERS */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          {/* Country Filter - ALL 195 COUNTRIES */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">🌍 All Countries ({allCountries.length})</SelectItem>
              {allCountries.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Category Filter - ALL CATEGORIES */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">📦 All Categories ({allCategories.length})</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Subcategory Filter - DYNAMIC */}
          {categoryFilter !== 'all' && subcategories.length > 0 && (
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">All Products ({subcategories.length})</SelectItem>
                {subcategories.map(sub => (
                  <SelectItem key={sub.slug} value={sub.slug}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="No Lane">No Lane</SelectItem>
              <SelectItem value="Lane Active">Lane Active</SelectItem>
              <SelectItem value="Lane Pending">Lane Pending</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          Showing {gridRows.length} of {stats?.totalGridRows?.toLocaleString() || 0} available rows
          {countryFilter !== 'all' && ` • Country: ${allCountries.find(c => c.code === countryFilter)?.name || countryFilter}`}
          {categoryFilter !== 'all' && ` • Category: ${allCategories.find(c => c.slug === categoryFilter)?.name || categoryFilter}`}
        </div>
      </Card>

      {/* DEMAND GRID TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin opacity-50" />
              <p>Loading demand grid...</p>
            </div>
          ) : gridRows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No rows found</p>
              <p className="text-sm">Adjust filters or reset to see all data.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px]">Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">State</TableHead>
                    <TableHead className="text-center">Intent</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gridRows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{row.country_name}</span>
                          <span className="text-xs text-muted-foreground">({row.country_code})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {row.category_name.length > 25 
                            ? row.category_name.substring(0, 25) + '...' 
                            : row.category_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{row.subcategory_name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStateBadge(row.state)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">₹0</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(row.status)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          disabled={row.status !== 'No Lane'}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Activate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* DISCLAIMER */}
      <IllustrativeDisclaimer variant="compact" />
    </div>
  );
}
