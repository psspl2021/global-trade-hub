import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useSEO } from '@/hooks/useSEO';

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
  'Industry News',
  'Supplier Guide',
  'Buyer Guide',
  'Logistics',
  'Trade Compliance',
  'Success Stories',
];

const Blogs = () => {
  useSEO({
    title: 'Blogs - ProcureSaathi',
    description: 'Get latest information about B2B procurement, supplier management, logistics, and trade compliance.',
  });

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchBlogs();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Blogs</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Get latest information about B2B procurement, supplier management, logistics, and trade compliance.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Popular Blogs */}
        {popularBlogs.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Popular Blogs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {popularBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Blogs */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory === 'All' ? 'All Blogs' : selectedCategory}
          </h2>
          
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
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
              <p className="text-muted-foreground">No blogs found.</p>
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
    </div>
  );
};

const BlogCard = ({ blog, featured = false }: { blog: Blog; featured?: boolean }) => {
  return (
    <Link to={`/blogs/${blog.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow group overflow-hidden">
        <div className="relative h-48 bg-muted overflow-hidden">
          {blog.cover_image ? (
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-4xl font-bold text-primary/30">{blog.title[0]}</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3" variant="secondary">
            {blog.category}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{blog.excerpt}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {blog.author_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {blog.author_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(blog.published_at || blog.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Blogs;
