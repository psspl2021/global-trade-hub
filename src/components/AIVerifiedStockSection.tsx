import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Package, 
  Shield,
  TrendingUp,
  Minus,
  TrendingDown,
  Search,
  User
} from 'lucide-react';
import { AIInventoryRFQModal } from '@/components/AIInventoryRFQModal';

interface VerifiedStock {
  id: string;
  productName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  matchStrength: 'high' | 'medium' | 'low';
  isFeatured: boolean;
}

interface AIVerifiedStockSectionProps {
  userId?: string;
  isLoggedIn: boolean;
  categoryFilter?: string;
}

const getMatchStrengthConfig = (strength: 'high' | 'medium' | 'low') => {
  const configs = {
    high: {
      label: 'High Demand',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      icon: TrendingUp,
    },
    medium: {
      label: 'Available',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      icon: Minus,
    },
    low: {
      label: 'In Stock',
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted',
      icon: TrendingDown,
    },
  };
  return configs[strength];
};

export function AIVerifiedStockSection({ 
  userId, 
  isLoggedIn,
  categoryFilter 
}: AIVerifiedStockSectionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<VerifiedStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<VerifiedStock | null>(null);

  useEffect(() => {
    fetchVerifiedStock();
  }, [categoryFilter]);

  const fetchVerifiedStock = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('buyer_inventory_discovery')
        .select('*')
        .limit(50);

      if (categoryFilter) {
        query = query.ilike('category', `%${categoryFilter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedStocks: VerifiedStock[] = (data || []).map(item => ({
        id: item.product_id,
        productName: item.product_name,
        category: item.category,
        availableQuantity: item.available_quantity,
        unit: item.unit || 'units',
        matchStrength: (item.match_strength || 'low') as 'high' | 'medium' | 'low',
        isFeatured: item.is_featured || false,
      }));

      // Sort: featured first, then high demand, then quantity
      mappedStocks.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        
        const strengthOrder = { high: 3, medium: 2, low: 1 };
        if (strengthOrder[a.matchStrength] !== strengthOrder[b.matchStrength]) {
          return strengthOrder[b.matchStrength] - strengthOrder[a.matchStrength];
        }
        
        return b.availableQuantity - a.availableQuantity;
      });

      // Extract categories
      const categories = [...new Set(mappedStocks.map(s => s.category))];
      setAvailableCategories(categories);
      setStocks(mappedStocks);
    } catch (error) {
      console.error('Error fetching verified stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = !searchQuery || 
        stock.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || stock.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, selectedCategory]);

  const handleRequestQuote = (stock: VerifiedStock) => {
    if (!isLoggedIn) {
      // Store intent and redirect to signup
      sessionStorage.setItem('rfqIntent', JSON.stringify({
        productId: stock.id,
        productName: stock.productName,
        category: stock.category,
      }));
      navigate('/signup?intent=rfq');
      return;
    }
    
    setSelectedStock(stock);
    setRfqModalOpen(true);
  };

  // Don't render anything if no verified stock and not loading
  if (!loading && stocks.length === 0) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {availableCategories.length > 1 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Stock Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStocks.map((stock) => {
          const config = getMatchStrengthConfig(stock.matchStrength);
          const MatchIcon = config.icon;

          return (
            <Card 
              key={stock.id} 
              className={`relative overflow-hidden transition-all hover:shadow-md ${
                stock.isFeatured ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              {stock.isFeatured && (
                <div className="absolute top-0 right-0 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-bl-lg">
                  Featured
                </div>
              )}
              
              <CardContent className="p-4 space-y-3">
                {/* Product Info */}
                <div>
                  <h3 className="font-semibold line-clamp-1">{stock.productName}</h3>
                  <p className="text-sm text-muted-foreground">{stock.category}</p>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    AI Verified
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
                    <MatchIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>

                {/* Stock Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{stock.availableQuantity.toLocaleString()} {stock.unit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <User className="h-3 w-3" />
                    <span>Supplier Anonymous</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  className="w-full gap-2"
                  onClick={() => handleRequestQuote(stock)}
                >
                  <Sparkles className="h-4 w-4" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RFQ Modal */}
      {selectedStock && userId && (
        <AIInventoryRFQModal
          open={rfqModalOpen}
          onOpenChange={setRfqModalOpen}
          stock={{
            id: selectedStock.id,
            productName: selectedStock.productName,
            category: selectedStock.category,
            availableQuantity: selectedStock.availableQuantity,
            unit: selectedStock.unit,
            matchStrength: selectedStock.matchStrength,
          }}
          userId={userId}
        />
      )}
    </div>
  );
}