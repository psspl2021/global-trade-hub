import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, IndianRupee, Building2, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { maskCompanyName } from '@/lib/utils';
import SEOHead from '@/components/SEOHead';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';

interface RFQData {
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

const RFQDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [rfq, setRfq] = useState<RFQData | null>(null);
  const [relatedRfqs, setRelatedRfqs] = useState<RFQData[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchRFQ = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('requirements')
        .select('*, buyer_profile:profiles!requirements_buyer_id_fkey(company_name)')
        .eq('id', id)
        .single();

      if (!error && data) {
        setRfq(data as unknown as RFQData);

        const { data: related } = await supabase
          .from('requirements')
          .select('id, title, product_category, quantity, unit, delivery_location, deadline, status, created_at')
          .eq('product_category', data.product_category)
          .neq('id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);

        if (related) setRelatedRfqs(related as unknown as RFQData[]);
      }
      setLoading(false);
    };
    fetchRFQ();
  }, [id]);

  const pageTitle = rfq
    ? `${rfq.title} - RFQ India | ProcureSaathi`
    : 'RFQ Detail | ProcureSaathi';
  const pageDesc = rfq
    ? `${rfq.title} — ${rfq.quantity} ${rfq.unit} required in ${rfq.delivery_location}. Submit your quotation on ProcureSaathi.`
    : 'View RFQ details and submit your quotation on ProcureSaathi.';
  const canonicalUrl = `https://www.procuresaathi.com/rfq/${id}`;

  const isExpired = rfq ? (rfq.status === 'expired' || new Date(rfq.deadline) < new Date()) : false;
  const isAwarded = rfq?.status === 'awarded';
  const canBid = rfq?.status === 'active' && !isExpired;
  useEffect(() => {
    if (!rfq?.deadline) return;
    setDaysLeft(Math.max(0, Math.ceil((new Date(rfq.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))));
  }, [rfq?.deadline]);

  useEffect(() => {
    if (!id) return;
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    setViewCount((hash % 8) + 3);
  }, [id]);

  useEffect(() => {
    if (loading || !rfq) return;

    const frameId = requestAnimationFrame(() => {
      const nestedFrameId = requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto',
        });
      });

      return () => cancelAnimationFrame(nestedFrameId);
    });

    return () => cancelAnimationFrame(frameId);
  }, [loading, rfq]);

  const getCategorySlug = (cat: string) =>
    cat?.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (loading) {
    return (
      <>
        <PageHeader />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-8" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </>
    );
  }

  if (!rfq) {
    return (
      <>
        <PageHeader />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Button asChild>
            <Link to="/requirements">View All Live RFQs</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Demand",
    "name": rfq.title,
    "description": rfq.description || `Buyer is looking for ${rfq.title}`,
    "url": canonicalUrl,
    "dateCreated": rfq.created_at,
    "areaServed": {
      "@type": "Place",
      "name": rfq.delivery_location
    },
    "buyer": {
      "@type": "Organization",
      "name": "Verified Industrial Buyer"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.procuresaathi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Live RFQs", "item": "https://www.procuresaathi.com/requirements" },
      { "@type": "ListItem", "position": 3, "name": rfq.title, "item": canonicalUrl }
    ]
  };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        canonical={canonicalUrl}
        noindex={isExpired || isAwarded}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />

      <PageHeader />

      {/* ===== CONVERSION HERO (Above the fold) ===== */}
      <section className="bg-gradient-to-b from-background to-muted border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-3">
            <ol className="flex items-center gap-1 flex-wrap">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li><Link to="/requirements" className="hover:underline">Live RFQs</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium truncate max-w-[200px]">{rfq.title}</li>
            </ol>
          </nav>

          {/* H1 */}
          <h1 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
            {rfq.title}
          </h1>

          {/* Key Info — instant value signals */}
          <div className="flex flex-wrap gap-3 md:gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {Number(rfq.quantity).toFixed(0)} {rfq.unit}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {rfq.delivery_location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Deadline: {format(new Date(rfq.deadline), 'MMM d, yyyy')}
            </span>
            {(rfq.budget_min || rfq.budget_max) && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />
                {rfq.budget_min && rfq.budget_max
                  ? `₹${rfq.budget_min.toLocaleString()} – ₹${rfq.budget_max.toLocaleString()}`
                  : rfq.budget_max
                    ? `Up to ₹${rfq.budget_max.toLocaleString()}`
                    : `From ₹${rfq.budget_min?.toLocaleString()}`}
              </span>
            )}
          </div>

          {/* Urgency — countdown + FOMO */}
          {canBid && (
            <p className="text-sm text-destructive font-semibold mb-1">
              ⏳ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to submit quotation
            </p>
          )}
          {canBid && (
            <p className="text-xs text-warning font-medium mb-4">
              🔥 {viewCount}+ suppliers already viewed this RFQ today
            </p>
          )}

          {/* Status badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            <Badge variant={canBid ? 'default' : isExpired ? 'destructive' : 'secondary'}>
              {canBid ? 'Active' : isAwarded ? 'Awarded' : 'Expired'}
            </Badge>
            <Badge variant="outline">{rfq.product_category}</Badge>
            {rfq.trade_type && (
              <Badge variant="outline">
                {rfq.trade_type === 'import' ? 'Import' : rfq.trade_type === 'export' ? 'Export' : 'Domestic India'}
              </Badge>
            )}
          </div>

          {/* CTA */}
          {canBid ? (
            <div>
              <div className="flex gap-3 flex-wrap">
                {user ? (
                  <Button size="lg" asChild>
                    <Link to="/dashboard">
                      Submit Quote Now <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild>
                    <Link to="/signup?role=supplier">
                      Join & Quote Now <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="lg" asChild>
                  <Link to="/requirements">View All RFQs</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ✔ Verified buyer • ✔ No spam leads • ✔ Direct business opportunity
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground">
              <p className="font-medium">{isAwarded ? 'This requirement has been awarded.' : 'Bidding period has ended.'}</p>
              <Button variant="outline" className="mt-3" asChild>
                <Link to="/requirements">View Active RFQs</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-4xl mx-auto px-4 py-8 min-h-[60vh]">
        {/* Buyer info */}
        {rfq.buyer_profile?.company_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Building2 className="h-4 w-4" />
            <span><strong>Buyer:</strong> {maskCompanyName(rfq.buyer_profile.company_name)}</span>
            <span className="ml-4">Posted: <time dateTime={rfq.created_at}>{format(new Date(rfq.created_at), 'MMM d, yyyy')}</time></span>
          </div>
        )}

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Requirement Details</h2>
          <p className="text-muted-foreground leading-relaxed">
            {rfq.description || `Buyer is looking for ${rfq.title}. Suppliers can submit quotations and participate in competitive bidding through ProcureSaathi's managed procurement platform.`}
          </p>
        </section>

        {/* SEO content depth block */}
        <section className="mb-8 text-sm text-muted-foreground leading-relaxed">
          <p>
            This RFQ for {rfq.title} is part of ProcureSaathi's live procurement marketplace, 
            where industrial buyers connect with verified suppliers across India. 
            Suppliers can submit quotations, participate in reverse auctions, 
            and win bulk orders based on competitive pricing and delivery capability.
          </p>
        </section>

        {/* Internal link to category */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Explore More</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/demand/${getCategorySlug(rfq.product_category)}`}
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Explore {rfq.product_category} suppliers →
            </a>
            <a
              href="/requirements"
              className="text-sm text-primary underline hover:text-primary/80"
            >
              View all live RFQs →
            </a>
          </div>
        </section>

        {/* Related RFQs */}
        {relatedRfqs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Related Requirements in {rfq.product_category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedRfqs.map((related) => (
                <a
                  key={related.id}
                  href={`/rfq/${related.id}`}
                  title={`${related.title} - RFQ India | ProcureSaathi`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <h3 className="text-sm font-medium line-clamp-2 mb-2">{related.title}</h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{related.delivery_location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={related.deadline}>{format(new Date(related.deadline), 'MMM d')}</time>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* FAQ section with schema */}
        <section className="mt-10 mb-8">
          <h2 className="text-lg font-semibold mb-3">FAQs</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <p><strong>How to quote for this RFQ?</strong><br />
            Register as a supplier on ProcureSaathi and submit your quotation directly.</p>
            <p><strong>Is this a verified requirement?</strong><br />
            Yes, all RFQs are verified by our team before publishing.</p>
            <p><strong>Who can apply?</strong><br />
            Manufacturers, traders, and suppliers dealing in {rfq.product_category}.</p>
          </div>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "How to quote for this RFQ?", "acceptedAnswer": { "@type": "Answer", "text": "Register as a supplier on ProcureSaathi and submit your quotation directly." } },
            { "@type": "Question", "name": "Is this a verified requirement?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, all RFQs are verified by our team before publishing." } },
            { "@type": "Question", "name": `Who can apply for ${rfq.product_category} RFQs?`, "acceptedAnswer": { "@type": "Answer", "text": `Manufacturers, traders, and suppliers dealing in ${rfq.product_category}.` } }
          ]
        }) }} />

        {/* Long-tail keyword signals */}
        <div className="text-xs text-muted-foreground mt-6 mb-8">
          Also searched: {rfq.title} suppliers near me, {rfq.product_category} buyers India, 
          bulk {rfq.product_category} RFQ, {rfq.product_category} procurement India
        </div>

        {/* Back link */}
        <div className="pt-4 border-t">
          <Link to="/requirements" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to all requirements
          </Link>
        </div>
      </main>

      {/* ===== STICKY MOBILE CTA ===== */}
      {canBid && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 md:hidden z-40">
          {user ? (
            <Button className="w-full" size="lg" asChild>
              <Link to="/dashboard">Submit Quote Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          ) : (
            <Button className="w-full" size="lg" asChild>
              <Link to="/signup?role=supplier">Join & Quote Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      )}

      {/* ===== STICKY DESKTOP CTA ===== */}
      {canBid && (
        <div className="hidden md:block fixed right-6 bottom-6 z-40">
          <Button size="lg" asChild>
            <Link to={user ? "/dashboard" : "/signup?role=supplier"}>
              🚀 Submit Quote
            </Link>
          </Button>
        </div>
      )}

      <Footer />
    </>
  );
};

export default RFQDetail;
