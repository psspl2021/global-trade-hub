import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import logo from '@/assets/procuresaathi-logo.png';
import heroBgBlogs from '@/assets/hero-bg-blogs.jpg';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  category: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  'All',
  'Procurement Tips',
  'Procurement Guide',
  'Industry Insights',
  'Industry News',
  'Supplier Guide',
  'Buyer Guide',
  'Market Analysis',
  'Logistics',
  'Trade Compliance',
  'Success Stories',
];

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useSEO({
    title: 'B2B Procurement Blog | Industry Insights & Tips - ProcureSaathi',
    description: 'Expert insights on B2B procurement strategies, supplier management, logistics best practices, GST compliance, and trade tips for Indian businesses. Stay updated with ProcureSaathi blog.',
    canonical: 'https://procuresaathi.com/blogs',
    keywords: 'B2B procurement blog, supplier management tips, logistics best practices, GST compliance India, trade compliance, procurement strategies, supplier sourcing India, industrial sourcing',
    ogType: 'website',
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Inject Blog listing schema after blogs are loaded
  useEffect(() => {
    if (blogs.length === 0) return;

    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://procuresaathi.com' },
      { name: 'Blogs', url: 'https://procuresaathi.com/blogs' }
    ]), 'breadcrumb-schema');

    // Blog schema with BlogPosting items
    const blogPostings = blogs.slice(0, 10).map(blog => ({
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.excerpt || blog.title,
      "url": `https://procuresaathi.com/blogs/${blog.slug}`,
      "image": blog.cover_image || "https://procuresaathi.com/og-image.png",
      "datePublished": blog.published_at || blog.created_at,
      "author": {
        "@type": "Person",
        "name": blog.author_name || "ProcureSaathi Team"
      }
    }));

    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "ProcureSaathi Blog - B2B Procurement Insights",
      "description": "Expert insights on B2B procurement, supplier management, logistics, and trade compliance for Indian businesses",
      "url": "https://procuresaathi.com/blogs",
      "inLanguage": "en-IN",
      "publisher": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "logo": {
          "@type": "ImageObject",
          "url": "https://procuresaathi.com/logo.png"
        }
      },
      "blogPost": blogPostings
    }, 'blog-schema');

    // CollectionPage schema for better listing SEO
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "B2B Procurement Blog | ProcureSaathi",
      "description": "Expert insights on B2B procurement strategies, supplier management, logistics best practices, and trade compliance tips",
      "url": "https://procuresaathi.com/blogs",
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": blogs.length,
        "itemListElement": blogs.slice(0, 10).map((blog, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://procuresaathi.com/blogs/${blog.slug}`,
          "name": blog.title
        }))
      }
    }, 'collection-schema');
  }, [blogs]);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('id, title, slug, excerpt, cover_image, category, author_name, published_at, created_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularBlogs = blogs.slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="relative py-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgBlogs})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/90" />
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex justify-between items-start mb-6" aria-label="Blog header navigation">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              B2B Procurement Blog
            </h1>
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
          <p className="text-lg text-muted-foreground max-w-2xl">
            Expert insights on B2B procurement strategies, supplier sourcing, logistics optimization, GST compliance, and trade tips for Indian businesses.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <nav className="flex flex-col md:flex-row gap-4 mb-8" aria-label="Blog filters">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search blog posts"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
              >
                {category}
              </Button>
            ))}
          </div>
        </nav>

        {/* Popular Blogs */}
        {popularBlogs.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <section className="mb-12" aria-labelledby="popular-blogs-heading">
            <h2 id="popular-blogs-heading" className="text-2xl font-bold mb-6">Popular Blogs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {popularBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Blogs */}
        <section aria-labelledby="all-blogs-heading">
          <h2 id="all-blogs-heading" className="text-2xl font-bold mb-6">
            {selectedCategory === 'All' ? 'All Blogs' : selectedCategory}
          </h2>
          
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading blogs">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No blogs found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const BlogCard = ({ blog, featured = false }: { blog: Blog; featured?: boolean }) => {
  return (
    <article className="h-full">
      <Link to={`/blogs/${blog.slug}`} aria-label={`Read blog: ${blog.title}`}>
        <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden">
          <figure className="relative h-48 bg-muted overflow-hidden">
            {blog.cover_image ? (
              <img
                src={blog.cover_image}
                alt={`Cover image for ${blog.title}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                width="400"
                height="200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-4xl font-bold text-primary/30" aria-hidden="true">{blog.title[0]}</span>
              </div>
            )}
            <Badge className="absolute top-3 left-3" variant="secondary">
              {blog.category}
            </Badge>
          </figure>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {blog.title}
            </h3>
            {blog.excerpt && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{blog.excerpt}</p>
            )}
            <footer className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {blog.author_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" aria-hidden="true" />
                    <span>{blog.author_name}</span>
                  </span>
                )}
                <time dateTime={blog.published_at || blog.created_at} className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {format(new Date(blog.published_at || blog.created_at), 'MMM d, yyyy')}
                </time>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </footer>
          </CardContent>
        </Card>
      </Link>
    </article>
  );
};

export default Blogs;