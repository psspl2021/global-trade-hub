import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Loader2, Search, SearchX, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
}

interface ExternalSupplierSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEARCH_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'freshdi', label: 'Freshdi' },
  { value: 'alibaba', label: 'Alibaba' },
  { value: 'indiamart', label: 'IndiaMART' },
  { value: 'tradeindia', label: 'TradeIndia' },
];

export const ExternalSupplierSearch = ({ open, onOpenChange }: ExternalSupplierSearchProps) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [searchSource, setSearchSource] = useState('freshdi');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('Please enter a search keyword');
      return;
    }

    setIsLoading(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-suppliers', {
        body: { keyword, category, country, searchSource },
      });

      if (error) throw error;

      setResults(data.results || []);
      setSearchQuery(data.query || keyword);
      
      if (data.results?.length === 0) {
        toast.info('No suppliers found. Try different keywords.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Find Vendors from B2B Marketplaces
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product / Keyword *</label>
              <Input
                placeholder="e.g., Rice, Steel, Textiles..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select value={searchSource} onValueChange={setSearchSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category (Optional)</label>
              <Input
                placeholder="e.g., Agriculture, Manufacturing..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country (Optional)</label>
              <Input
                placeholder="e.g., India, Vietnam..."
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Vendors
              </>
            )}
          </Button>

          {/* Results */}
          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Searching for suppliers on {SEARCH_SOURCES.find(s => s.value === searchSource)?.label}...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && results.length === 0 && searchQuery && (
            <Card>
              <CardContent className="p-8 text-center">
                <SearchX className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">Try different keywords or select a different source</p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-semibold text-foreground">{results.length}</span> results for "{searchQuery}"
              </p>
              
              {results.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.description}
                        </p>
                        <p className="text-xs text-primary truncate">
                          {result.source}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
