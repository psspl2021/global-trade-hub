import { ExternalLink, Loader2, SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

export const SearchResults = ({ results, isLoading, error, searchQuery }: SearchResultsProps) => {
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Searching for suppliers...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-destructive/50">
        <CardContent className="p-8 text-center">
          <SearchX className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-medium mb-2">Search failed</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <Card className="mt-6">
        <CardContent className="p-8 text-center">
          <SearchX className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          <p className="text-sm text-muted-foreground mt-2">Try different keywords or broaden your search</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{results.length}</span> results for "{searchQuery}"
        </p>
      </div>
      
      <div className="grid gap-4">
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
    </div>
  );
};
