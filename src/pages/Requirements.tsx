import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, MapPin, IndianRupee, Building2, FileText, ArrowRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';
import { maskCompanyName } from '@/lib/utils';
import logo from '@/assets/procuresaathi-logo.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Requirement {
  id: string;
  title: string;
  description: string;
  product_category: string;
  trade_type?: 'import' | 'export' | 'domestic_india';
  quantity: number;
  unit: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string;
  delivery_location: string;
  status: string;
  created_at: string;
  buyer_profile?: {
    company_name: string;
  };
}

const TRADE_TYPES = [
  { value: 'all', label: 'All Trade Types' },
  { value: 'domestic_india', label: 'Domestic India' },
  { value: 'import', label: 'Import' },
  { value: 'export', label: 'Export' },
];

const getTradeTypeLabel = (tradeType: string | undefined) => {
  switch (tradeType) {
    case 'import': return 'Import';
    case 'export': return 'Export';
    case 'domestic_india': return 'Domestic India';
    default: return 'Domestic India';
  }
};

const Requirements = () => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeType, setSelectedTradeType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useSEO({
    title: 'Live RFQs & Buyer Requirements | B2B Procurement - ProcureSaathi',
    description: 'Browse active RFQs and buyer requirements for industrial materials, chemicals, steel, polymers, and more. Submit competitive bids on ProcureSaathi B2B marketplace.',
    canonical: 'https://procuresaathi.com/requirements',
    keywords: 'RFQ, buyer requirements, B2B procurement, industrial materials, steel requirements, chemical requirements, supplier bidding, tender, quotation request',
    ogType: 'website',
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Inject schemas after requirements are loaded
  useEffect(() => {
    if (requirements.length === 0) return;

    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://procuresaathi.com' },
      { name: 'Live Requirements', url: 'https://procuresaathi.com/requirements' }
    ]), 'breadcrumb-schema');

    // ItemList schema for requirements
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Live B2B Buyer Requirements",
      "description": "Active RFQs and procurement requirements from verified buyers",
      "numberOfItems": requirements.length,
      "itemListElement": requirements.slice(0, 20).map((req, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Demand",
          "name": req.title,
          "description": req.description.substring(0, 200),
          "areaServed": req.delivery_location,
          "availabilityStarts": req.created_at,
          "availabilityEnds": req.deadline
        }
      }))
    }, 'requirements-schema');

    // Extract unique categories
    const uniqueCategories = [...new Set(requirements.map(r => r.product_category))];
    setCategories(uniqueCategories);
  }, [requirements]);

  const fetchRequirements = async () => {
    setLoading(true);
    
    const { data: reqData, error: reqError } = await supabase
      .from('requirements')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('Error fetching requirements:', reqError);
      setLoading(false);
      return;
    }

    if (reqData && reqData.length > 0) {
      const buyerIds = [...new Set(reqData.map(r => r.buyer_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, company_name')
        .in('id', buyerIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const reqsWithProfiles = reqData.map(req => ({
        ...req,
        buyer_profile: profilesMap.get(req.buyer_id) || undefined
      }));
      
      setRequirements(reqsWithProfiles as Requirement[]);
    } else {
      setRequirements([]);
    }

    setLoading(false);
  };

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.product_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.delivery_location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTradeType = selectedTradeType === 'all' || req.trade_type === selectedTradeType;
    const matchesCategory = selectedCategory === 'all' || req.product_category === selectedCategory;
    
    return matchesSearch && matchesTradeType && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <nav className="flex justify-between items-start mb-6" aria-label="Requirements header">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Live RFQs & Requirements
              </h1>
              <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
                Browse active buyer requirements for industrial materials, chemicals, steel, polymers, and more. Submit competitive bids to win orders.
              </p>
            </div>
            <Link to="/" className="inline-block" aria-label="Go to ProcureSaathi homepage">
              <img 
                src={logo} 
                alt="ProcureSaathi - B2B Procurement Platform" 
                className="h-20 md:h-24 hover:opacity-80 transition-opacity" 
                width="96"
                height="96"
              />
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <nav className="flex flex-col md:flex-row gap-4 mb-8" aria-label="Requirements filters">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search requirements by title, category, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search requirements"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedTradeType} onValueChange={setSelectedTradeType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trade Type" />
              </SelectTrigger>
              <SelectContent>
                {TRADE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </nav>

        {/* Stats */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{filteredRequirements.length}</strong> active requirements available for bidding
          </p>
        </div>

        {/* Requirements List */}
        <section aria-labelledby="requirements-heading">
          <h2 id="requirements-heading" className="sr-only">Active Requirements</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
              <p className="text-muted-foreground">No requirements found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequirements.map((req) => (
                <RequirementCard key={req.id} requirement={req} isLoggedIn={!!user} />
              ))}
            </div>
          )}
        </section>

        {/* CTA for guests */}
        {!user && filteredRequirements.length > 0 && (
          <section className="mt-12 p-8 bg-primary/10 rounded-lg text-center" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="text-2xl font-bold mb-4">Ready to Submit Your Bid?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Sign up as a supplier to submit competitive bids on these requirements and win orders from verified buyers.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Sign Up as Supplier</Link>
            </Button>
          </section>
        )}
      </div>
    </main>
  );
};

const RequirementCard = ({ requirement, isLoggedIn }: { requirement: Requirement; isLoggedIn: boolean }) => {
  return (
    <article>
      <Card className="h-full hover:shadow-lg transition-shadow group">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {requirement.title}
            </CardTitle>
            <Badge variant="secondary" className="shrink-0">
              {getTradeTypeLabel(requirement.trade_type)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{requirement.product_category}</Badge>
            {requirement.buyer_profile && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" aria-hidden="true" />
                {maskCompanyName(requirement.buyer_profile.company_name)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{requirement.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" aria-hidden="true" />
              <span>{Number(requirement.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {requirement.unit}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{requirement.delivery_location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={requirement.deadline}>
                {format(new Date(requirement.deadline), 'MMM d, yyyy')}
              </time>
            </div>
            {(requirement.budget_min || requirement.budget_max) && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" aria-hidden="true" />
                <span>
                  {requirement.budget_min && requirement.budget_max 
                    ? `${requirement.budget_min.toLocaleString()} - ${requirement.budget_max.toLocaleString()}`
                    : requirement.budget_max 
                      ? `Up to ${requirement.budget_max.toLocaleString()}`
                      : `From ${requirement.budget_min?.toLocaleString()}`
                  }
                </span>
              </div>
            )}
          </div>

          <footer className="pt-3 border-t">
            {isLoggedIn ? (
              <Button size="sm" className="w-full group-hover:bg-primary/90" asChild>
                <Link to="/dashboard">
                  View & Bid <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="w-full" asChild>
                <Link to="/signup?role=supplier">Sign Up to Bid</Link>
              </Button>
            )}
          </footer>
        </CardContent>
      </Card>
    </article>
  );
};

export default Requirements;