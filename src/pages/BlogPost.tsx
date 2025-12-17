import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSEO } from '@/hooks/useSEO';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

// Simple markdown to HTML converter
const parseMarkdown = (markdown: string): string => {
  let html = markdown
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and Italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs - wrap non-tag lines
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li')) return trimmed;
      // Wrap lists in ul
      if (trimmed.includes('<li>')) {
        return `<ul>${trimmed}</ul>`;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
  
  return html;
};

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: blog ? `${blog.title} - ProcureSaathi Blog` : 'Blog - ProcureSaathi',
    description: blog?.excerpt || 'Read our latest blog post',
  });

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: blog?.title,
        text: blog?.excerpt || '',
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8 rounded-lg" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog not found</h1>
          <Button asChild>
            <Link to="/blogs">Back to Blogs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
      </div>

      {/* Cover Image */}
      {blog.cover_image && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={blog.cover_image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Badge className="mb-4">{blog.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            {blog.author_name && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {blog.author_name}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(blog.published_at || blog.created_at), 'MMMM d, yyyy')}
            </span>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {blog.excerpt && (
            <p className="text-xl text-muted-foreground border-l-4 border-primary pl-4 italic">
              {blog.excerpt}
            </p>
          )}
        </div>

        {/* Blog Content - Parse markdown and sanitize */}
        <div 
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(parseMarkdown(blog.content)) }}
        />

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Found this helpful? Share it!</p>
            <Button onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
