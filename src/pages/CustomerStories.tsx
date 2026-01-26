import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/landing/PageHeader";
import { Footer } from "@/components/landing/Footer";
import { useSEO, injectStructuredData, getBreadcrumbSchema } from "@/hooks/useSEO";
import { 
  ArrowRight, 
  Sparkles,
  Star,
  Quote,
  Building2,
  TrendingDown,
  Clock,
  Shield
} from "lucide-react";

const testimonials = [
  {
    quote: "ProcureSaathi helped our enterprise reduce sourcing cost by 18% through transparent sealed bidding. We discovered competitive suppliers we didn't know existed.",
    author: "Procurement Director",
    company: "Manufacturing Enterprise, Maharashtra",
    metric: "18% Cost Reduction",
    industry: "Manufacturing",
    rating: 5,
  },
  {
    quote: "Within 48 hours of posting our RFQ, we received 5 verified quotes for steel plates. The AI-structured RFQ saved us hours of documentation work.",
    author: "Purchase Manager",
    company: "Construction Company, Gujarat",
    metric: "48hr Quote Turnaround",
    industry: "Construction",
    rating: 5,
  },
  {
    quote: "As an MSME, we struggled to get attention from quality suppliers. ProcureSaathi's verified network gave us access to the same suppliers that serve large enterprises.",
    author: "Founder",
    company: "Chemical Trading MSME, Tamil Nadu",
    metric: "Enterprise-Grade Suppliers",
    industry: "Chemicals",
    rating: 5,
  },
  {
    quote: "The transparent bidding process eliminated negotiations and ensured we always get fair market pricing. Our procurement cycle reduced from 3 weeks to 4 days.",
    author: "Supply Chain Head",
    company: "Electronics Manufacturer, Karnataka",
    metric: "85% Faster Procurement",
    industry: "Electronics",
    rating: 5,
  },
  {
    quote: "Export documentation used to be our biggest pain point. ProcureSaathi's managed fulfillment handled customs, logistics, and documentation seamlessly.",
    author: "Export Manager",
    company: "Textile Exporter, Delhi NCR",
    metric: "Seamless Export Handling",
    industry: "Textiles",
    rating: 5,
  },
];

const caseStudies = [
  {
    title: "How an MSME Reduced Procurement Cost by 20%",
    description: "A manufacturing MSME in Gujarat achieved significant cost savings through AI-powered RFQs and transparent bidding.",
    url: "/case-study-procurement-cost-reduction",
    icon: TrendingDown,
  },
  {
    title: "How an Exporter Found 5 Verified Suppliers in 48 Hours",
    description: "Learn how quick supplier discovery helped an exporter meet urgent international demand.",
    url: "/case-study-export-sourcing",
    icon: Clock,
  },
];

const CustomerStories = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Customer Stories & Testimonials | ProcureSaathi Success Stories",
    description: "Read success stories from businesses using ProcureSaathi for B2B procurement. Real testimonials from manufacturers, exporters, and MSMEs across India.",
    keywords: "ProcureSaathi reviews, B2B procurement testimonials, customer success stories, procurement platform reviews",
    canonical: "https://procuresaathi.com/customer-stories",
  });

  useEffect(() => {
    // Review schema for each testimonial
    const reviewSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "ProcureSaathi",
      "description": "AI-powered B2B procurement and sourcing platform",
      "brand": {
        "@type": "Brand",
        "name": "ProcureSaathi"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": testimonials.length.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": testimonials.map((t, idx) => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": t.rating.toString(),
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": t.author
        },
        "reviewBody": t.quote,
        "datePublished": "2026-01-01"
      }))
    };
    injectStructuredData(reviewSchema, "customer-reviews-schema");

    injectStructuredData(getBreadcrumbSchema([
      { name: "Home", url: "https://procuresaathi.com" },
      { name: "Customer Stories", url: "https://procuresaathi.com/customer-stories" },
    ]), "customer-stories-breadcrumb");

    // FAQ Schema
    injectStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What results do businesses achieve with ProcureSaathi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Businesses using ProcureSaathi report 15-20% cost reduction through transparent bidding, 85% faster procurement cycles, and access to verified enterprise-grade suppliers regardless of company size."
          }
        },
        {
          "@type": "Question",
          "name": "Is ProcureSaathi suitable for MSMEs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, ProcureSaathi is designed to give MSMEs access to the same verified supplier networks and transparent bidding that large enterprises use. The platform is free for buyers to post RFQs."
          }
        }
      ]
    }, "customer-stories-faq-schema");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">CUSTOMER STORIES</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
              Trusted by Businesses Across India
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Hear from manufacturers, exporters, and MSMEs who transformed their procurement with <strong>ProcureSaathi</strong>.
            </p>

            {/* Rating Summary */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border/50 rounded-full">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">4.8/5</span>
              <span className="text-muted-foreground">from verified customers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <Quote className="h-8 w-8 text-primary/20 mb-3" />
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  
                  {/* Metric Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold mb-4">
                    {testimonial.metric}
                  </div>
                  
                  {/* Author */}
                  <div className="border-t border-border/50 pt-4">
                    <p className="font-semibold text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
            Detailed Case Studies
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {caseStudies.map((study) => (
              <Link key={study.url} to={study.url} className="block">
                <Card className="border-border/50 hover:shadow-lg hover:border-primary/30 transition-all h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <study.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{study.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{study.description}</p>
                    <span className="text-primary font-medium text-sm inline-flex items-center">
                      Read Case Study <ArrowRight className="ml-1 h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12">
              Why Businesses Trust ProcureSaathi
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Verified Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  All suppliers are pre-verified with documentation and performance tracking.
                </p>
              </div>
              <div className="text-center p-6">
                <TrendingDown className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Transparent Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  Sealed bidding ensures fair market pricing without manipulation.
                </p>
              </div>
              <div className="text-center p-6">
                <Building2 className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Managed Fulfillment</h3>
                <p className="text-sm text-muted-foreground">
                  End-to-end support from procurement to delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Join Successful Businesses on ProcureSaathi
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Experience AI-powered procurement with transparent bidding and verified suppliers.
          </p>
          <Button 
            size="lg"
            className="h-14 px-10 text-lg font-semibold gradient-primary"
            onClick={() => navigate('/signup')}
          >
            Get Started – Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CustomerStories;
