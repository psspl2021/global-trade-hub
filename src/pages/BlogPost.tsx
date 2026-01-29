import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Share2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

// Process content - detect if HTML or markdown
const processContent = (content: string): string => {
  // If content already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  
  // Otherwise, parse as markdown
  let html = content
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

// Calculate reading time
const calculateReadingTime = (content: string): number => {
  const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200); // Average reading speed: 200 words/min
};

// Count words for schema
const countWords = (content: string): number => {
  const text = content.replace(/<[^>]*>/g, '');
  return text.trim().split(/\s+/).length;
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

  const readingTime = useMemo(() => blog ? calculateReadingTime(blog.content) : 0, [blog]);
  const wordCount = useMemo(() => blog ? countWords(blog.content) : 0, [blog]);

  // SEO with dynamic content
  useSEO({
    title: blog ? `${blog.title} | ProcureSaathi Blog` : 'Blog - ProcureSaathi',
    description: blog?.excerpt || 'Read our latest insights on B2B procurement, supplier management, and trade compliance.',
    canonical: blog ? `https://procuresaathi.com/blogs/${blog.slug}` : undefined,
    keywords: blog ? `${blog.category}, ${blog.title.toLowerCase()}, B2B procurement, supplier sourcing India` : undefined,
    ogImage: blog?.cover_image || 'https://procuresaathi.com/og-image.png',
    ogType: 'article',
  });

  // Inject Article schema when blog loads
  useEffect(() => {
    if (blog) {
      // Breadcrumb schema
      injectStructuredData(getBreadcrumbSchema([
        { name: 'Home', url: 'https://procuresaathi.com' },
        { name: 'Blogs', url: 'https://procuresaathi.com/blogs' },
        { name: blog.title, url: `https://procuresaathi.com/blogs/${blog.slug}` }
      ]), 'breadcrumb-schema');

      // Article schema for rich snippets
      injectStructuredData({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": blog.title,
        "description": blog.excerpt || blog.title,
        "image": blog.cover_image || "https://procuresaathi.com/og-image.png",
        "author": {
          "@type": "Person",
          "name": blog.author_name || "ProcureSaathi Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ProcureSaathi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://procuresaathi.com/logo.png"
          }
        },
        "datePublished": blog.published_at || blog.created_at,
        "dateModified": blog.published_at || blog.created_at,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://procuresaathi.com/blogs/${blog.slug}`
        },
        "articleSection": blog.category,
        "keywords": `${blog.category}, B2B procurement, supplier sourcing`,
        "wordCount": wordCount,
        "inLanguage": "en-IN"
      }, 'article-schema');

      // BlogPosting schema for better blog SEO
      injectStructuredData({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog.title,
        "alternativeHeadline": blog.excerpt || undefined,
        "image": blog.cover_image || "https://procuresaathi.com/og-image.png",
        "author": {
          "@type": "Person",
          "name": blog.author_name || "ProcureSaathi Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "ProcureSaathi",
          "logo": {
            "@type": "ImageObject",
            "url": "https://procuresaathi.com/logo.png"
          }
        },
        "datePublished": blog.published_at || blog.created_at,
        "dateModified": blog.published_at || blog.created_at,
        "articleBody": blog.content.replace(/<[^>]*>/g, '').substring(0, 500),
        "wordCount": wordCount,
        "timeRequired": `PT${readingTime}M`,
        "url": `https://procuresaathi.com/blogs/${blog.slug}`
      }, 'blogposting-schema');
    }
  }, [blog, wordCount, readingTime]);

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
      <main className="min-h-screen bg-background py-12" aria-busy="true">
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
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog not found</h1>
          <Button asChild>
            <Link to="/blogs">Back to Blogs</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Back Button */}
      <nav className="container mx-auto px-4 py-6" aria-label="Blog navigation">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Blogs
          </Link>
        </Button>
      </nav>

      {/* Cover Image */}
      {blog.cover_image && (
        <figure className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={blog.cover_image}
            alt={`Cover image for ${blog.title}`}
            className="w-full h-full object-cover"
            width="1200"
            height="600"
          />
        </figure>
      )}

      {/* Content */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-8">
          <Badge className="mb-4">{blog.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            {blog.author_name && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                <span itemProp="author">{blog.author_name}</span>
              </span>
            )}
            <time dateTime={blog.published_at || blog.created_at} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {format(new Date(blog.published_at || blog.created_at), 'MMMM d, yyyy')}
            </time>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {readingTime} min read
            </span>
            <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share this article">
              <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Share
            </Button>
          </div>

          {/* AI Citation Intro */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              <strong>ProcureSaathi</strong> is an AI-powered B2B procurement platform that connects verified buyers and suppliers using demand intelligence.
            </p>
          </div>

          {blog.excerpt && (
            <p className="text-xl text-muted-foreground border-l-4 border-primary pl-4 italic">
              {blog.excerpt}
            </p>
          )}
        </header>

        {/* Blog Content - Process and sanitize */}
        <section 
          className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processContent(blog.content)) }}
          aria-label="Blog content"
        />

        {/* Disclaimer */}
        <aside className="mt-8 p-4 bg-muted/50 border border-border rounded-lg">
          <p className="text-sm text-muted-foreground italic">
            This content is illustrative and based on common procurement workflows on ProcureSaathi. Actual outcomes may vary depending on requirements, suppliers, and market conditions.
          </p>
        </aside>

        {/* AI Demand Feed Notice */}
        <aside className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            This content also feeds AI demand models that help suppliers identify emerging buyer needs.
          </p>
        </aside>

        {/* Related Links */}
        <nav className="mt-8 p-6 bg-card border border-border/50 rounded-lg">
          <h4 className="font-semibold mb-4 text-foreground">Related Resources</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/ai-b2b-procurement-platform-guide" className="text-primary hover:underline">
                → Complete AI B2B Procurement Guide
              </Link>
            </li>
            <li>
              <Link to="/usa/ai-b2b-procurement" className="text-primary hover:underline">
                → AI Procurement for USA Buyers
              </Link>
            </li>
            <li>
              <Link to="/europe/ai-b2b-procurement" className="text-primary hover:underline">
                → AI Procurement for European Buyers
              </Link>
            </li>
          </ul>
        </nav>

        {/* Share Section */}
        <footer className="mt-12 pt-8 border-t">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Found this helpful? Share it!</p>
            <Button onClick={handleShare} aria-label="Share this article">
              <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
              Share Article
            </Button>
          </div>
        </footer>
      </article>
    </main>
  );
};

export default BlogPost;
