import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Zap, Globe, Factory, CheckCircle, Pill, Package } from 'lucide-react';
import { PageHeader } from '@/components/landing/PageHeader';
import { Footer } from '@/components/landing/Footer';
import { useEffect, useState } from 'react';
import { PostRFQModal } from '@/components/PostRFQModal';
import { trackPageView } from '@/utils/signalTracking';

const GeoSingapore = () => {
  const [showRFQModal, setShowRFQModal] = useState(false);

  useEffect(() => {
    trackPageView('geo-singapore-ai-b2b-procurement');
  }, []);

  const categories = [
    { name: 'Chemicals', icon: Zap },
    { name: 'Pharma', icon: Pill },
    { name: 'Electronics', icon: Factory },
    { name: 'Food & Textiles', icon: Package },
    { name: 'Steel & Metals', icon: Shield },
  ];

  const faqs = [
    {
      question: 'What is the best B2B procurement platform for Singapore buyers?',
      answer: 'ProcureSaathi is an AI-powered B2B procurement platform trusted by Singapore buyers for sourcing from verified Indian manufacturers and global suppliers with transparent pricing and managed fulfillment.'
    },
    {
      question: 'How can Singapore companies source products from India?',
      answer: 'Singapore companies can use ProcureSaathi to post RFQs, receive competitive bids from verified Indian exporters, and manage the entire sourcing process with export documentation and logistics support.'
    },
    {
      question: 'Does ProcureSaathi support export documentation for Singapore imports?',
      answer: 'Yes, ProcureSaathi provides complete export–import documentation support including commercial invoices, packing lists, certificates of origin, and customs documentation for Singapore imports.'
    },
    {
      question: 'Is ProcureSaathi suitable for enterprise procurement in Singapore?',
      answer: 'Absolutely. ProcureSaathi serves Singapore enterprises and SMEs with AI-powered RFQ management, vendor consolidation, and managed fulfillment for complex procurement needs.'
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AI-Powered B2B Procurement for Singapore Buyers",
    "serviceType": "International B2B Procurement & Sourcing",
    "provider": { "@type": "Organization", "name": "ProcureSaathi" },
    "areaServed": { "@type": "Country", "name": "Singapore" }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ProcureSaathi",
    "url": "https://procuresaathi.lovable.app",
    "areaServed": { "@type": "Country", "name": "Singapore" }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI-Powered B2B Procurement Platform for Singapore Buyers | ProcureSaathi</title>
        <meta name="description" content="ProcureSaathi is an AI-powered B2B procurement platform helping Singapore buyers source products from verified Indian manufacturers. Post RFQs and manage global sourcing." />
        <link rel="canonical" href="https://procuresaathi.lovable.app/singapore/ai-b2b-procurement" />
        <link rel="alternate" hrefLang="en-sg" href="https://procuresaathi.lovable.app/singapore/ai-b2b-procurement" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageHeader />

      <main className="container mx-auto px-4 py-12">
        <section className="max-w-4xl mx-auto text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">🇸🇬 Singapore Buyers</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            AI-Powered B2B Procurement Platform for Singapore Buyers
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            <strong>ProcureSaathi</strong> is an AI-powered B2B procurement and sourcing platform helping buyers in <strong>Singapore</strong> source products from verified suppliers across India and global markets. Enterprises and SMEs use ProcureSaathi to post AI-structured RFQs, receive competitive bids, and manage domestic and export–import sourcing with transparency and reliability.
          </p>
          <Button size="lg" onClick={() => setShowRFQModal(true)} className="gap-2">
            Start Global Sourcing with AI <ArrowRight className="h-5 w-5" />
          </Button>
        </section>

        <section className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Buyers from Singapore Use ProcureSaathi</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Access to Verified Indian Manufacturers & Exporters' },
              { icon: Zap, title: 'AI-Powered RFQ Creation for Faster Sourcing' },
              { icon: Shield, title: 'Transparent Sealed Bidding — No Negotiation Chaos' },
              { icon: Package, title: 'Export–Import Documentation & Logistics Support' },
              { icon: CheckCircle, title: 'Single Contract & Managed Fulfillment' },
            ].map((item, idx) => (
              <Card key={idx} className="border-border/50">
                <CardContent className="p-6 flex items-start gap-4">
                  <item.icon className="h-8 w-8 text-primary flex-shrink-0" />
                  <p className="font-medium text-foreground">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto mb-16 bg-muted/30 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Key Categories for Singapore Buyers</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl border border-border/50">
                <cat.icon className="h-10 w-10 text-primary" />
                <span className="text-sm font-medium text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How Global Sourcing Works</h2>
          <div className="space-y-4">
            {[
              'Submit sourcing requirement from Singapore',
              'ProcureSaathi matches verified Indian/global suppliers',
              'AI ranks bids on price, delivery, quality',
              'Buyer receives consolidated offer',
              'ProcureSaathi manages fulfillment & logistics'
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{idx + 1}</span>
                <p className="text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-16 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground leading-relaxed">
            <strong>Buyers deal only with ProcureSaathi as the commercial counterparty.</strong> Supplier identities remain protected. Pricing is transparent. Fulfillment is verified.
          </p>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx}><CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent></Card>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6">Explore More</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link to="/ai-b2b-procurement-platform-guide" className="p-4 border rounded-xl hover:border-primary transition-colors">📘 Complete AI B2B Procurement Guide</Link>
            <Link to="/customer-stories" className="p-4 border rounded-xl hover:border-primary transition-colors">⭐ Customer Success Stories</Link>
            <Link to="/case-study-export-sourcing" className="p-4 border rounded-xl hover:border-primary transition-colors">📊 Case Study: Export Sourcing</Link>
            <Link to="/procurement-for-chemical-buyers" className="p-4 border rounded-xl hover:border-primary transition-colors">🧪 Procurement for Chemical Buyers</Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Source from India?</h2>
          <p className="text-muted-foreground mb-6">Join Singapore enterprises using AI-powered procurement.</p>
          <Button size="lg" onClick={() => setShowRFQModal(true)} className="gap-2">
            Start Global Sourcing with AI <ArrowRight className="h-5 w-5" />
          </Button>
        </section>
      </main>

      <Footer />
      <PostRFQModal open={showRFQModal} onOpenChange={setShowRFQModal} />
    </div>
  );
};

export default GeoSingapore;
