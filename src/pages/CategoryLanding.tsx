import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, CheckCircle, Users, Package, Shield, 
  ArrowRight, Phone, Mail, Star, TrendingUp 
} from 'lucide-react';
import procureSaathiLogo from '@/assets/procuresaathi-logo.jpg';
import { categoriesData } from '@/data/categories';
import { useSEO, injectStructuredData, getBreadcrumbSchema, getProductSchema } from '@/hooks/useSEO';

// Convert slug to category name
const slugToName = (slug: string) => {
  return slug.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Convert category name to URL-friendly slug
export const nameToSlug = (name: string) => {
  return name.toLowerCase()
    .replace(/[&,()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// SEO content for high-value categories
const getCategoryContent = (categoryName: string) => {
  const content: Record<string, { 
    title: string; 
    description: string; 
    keywords: string[];
    benefits: string[];
    faqs: { q: string; a: string }[];
  }> = {
    'Metals - Ferrous (Steel, Iron)': {
      title: 'Steel & Iron Suppliers India | TMT Bars, HR Coils, Steel Sheets',
      description: 'Connect with 500+ verified steel manufacturers and iron suppliers in India. Get best prices on TMT bars, HR coils, CR sheets, steel pipes, and structural steel. Bulk orders, competitive bids, quality assured.',
      keywords: ['TMT bar suppliers India', 'steel manufacturers', 'HR coil dealers', 'iron suppliers', 'steel pipes wholesale', 'structural steel India'],
      benefits: ['Direct factory prices', 'Quality certifications (BIS, ISO)', 'Pan-India delivery', 'Credit facility available'],
      faqs: [
        { q: 'What is the minimum order quantity for TMT bars?', a: 'MOQ varies by supplier, typically starting from 5 MT for bulk orders.' },
        { q: 'Do suppliers provide ISI certification?', a: 'Yes, all our verified steel suppliers provide BIS/ISI certified products.' },
        { q: 'What are the payment terms?', a: 'Most suppliers offer 30-90 days credit for verified buyers.' },
      ]
    },
    'Chemicals & Raw Materials': {
      title: 'Industrial Chemical Suppliers India | Lab Chemicals, Petrochemicals',
      description: 'Source industrial chemicals, lab reagents, dyes, solvents, and specialty chemicals from 300+ verified suppliers. Competitive pricing, MSDS documentation, bulk supply.',
      keywords: ['industrial chemicals India', 'chemical suppliers', 'lab chemicals wholesale', 'petrochemicals dealers', 'dyes pigments manufacturers'],
      benefits: ['MSDS documentation', 'Hazmat compliant shipping', 'Technical support', 'Sample availability'],
      faqs: [
        { q: 'Do suppliers provide MSDS sheets?', a: 'Yes, all chemical suppliers provide complete MSDS documentation.' },
        { q: 'Is hazardous material shipping available?', a: 'Yes, we have logistics partners specialized in hazmat transportation.' },
      ]
    },
    'Machinery & Equipment': {
      title: 'Industrial Machinery Suppliers India | CNC, Packaging, Textile Machines',
      description: 'Find CNC machines, packaging equipment, textile machinery, and industrial equipment from verified manufacturers. Installation support, warranty, after-sales service.',
      keywords: ['CNC machine suppliers', 'packaging machinery India', 'textile machinery manufacturers', 'industrial equipment dealers'],
      benefits: ['Installation support', 'Warranty coverage', 'Spare parts availability', 'Technical training'],
      faqs: [
        { q: 'Do suppliers provide installation?', a: 'Yes, most machinery suppliers include installation and training.' },
        { q: 'What warranty is typically offered?', a: 'Standard warranty ranges from 1-3 years depending on equipment.' },
      ]
    },
    'Building & Construction': {
      title: 'Construction Material Suppliers India | Cement, Tiles, Sanitary Ware',
      description: 'Source cement, tiles, flooring, sanitary ware, paints, and construction materials from 400+ verified suppliers. Project-based pricing, bulk discounts.',
      keywords: ['construction materials India', 'cement suppliers', 'tiles manufacturers', 'sanitary ware dealers', 'building materials wholesale'],
      benefits: ['Project pricing', 'Site delivery', 'Bulk discounts', 'Quality assurance'],
      faqs: [
        { q: 'Do suppliers deliver to construction sites?', a: 'Yes, most suppliers offer site delivery for bulk orders.' },
        { q: 'Are project discounts available?', a: 'Yes, significant discounts for project-based bulk orders.' },
      ]
    },
  };

  const defaultContent = {
    title: `${categoryName} Suppliers & Manufacturers India | ProcureSaathi`,
    description: `Find verified ${categoryName.toLowerCase()} suppliers and manufacturers in India. Get competitive quotes, bulk pricing, and quality products from trusted vendors.`,
    keywords: [`${categoryName.toLowerCase()} suppliers`, `${categoryName.toLowerCase()} manufacturers India`, `wholesale ${categoryName.toLowerCase()}`],
    benefits: ['Verified suppliers', 'Competitive pricing', 'Quality assured', 'Pan-India delivery'],
    faqs: [
      { q: `How to find ${categoryName.toLowerCase()} suppliers?`, a: 'Simply post your requirement on ProcureSaathi and receive competitive bids from verified suppliers.' },
      { q: 'Is there a minimum order?', a: 'MOQ varies by supplier. Many accept small orders for first-time buyers.' },
    ]
  };

  return content[categoryName] || defaultContent;
};

const CategoryLanding = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<typeof categoriesData[0] | null>(null);

  useEffect(() => {
    if (categorySlug) {
      const found = categoriesData.find(c => nameToSlug(c.name) === categorySlug);
      setCategory(found || null);
    }
  }, [categorySlug]);

  const categoryName = category?.name || slugToName(categorySlug || '');
  const subcategoryName = subcategorySlug ? slugToName(subcategorySlug) : null;
  const content = getCategoryContent(categoryName);
  
  const pageTitle = subcategoryName 
    ? `${subcategoryName} Suppliers India | ${categoryName} | ProcureSaathi`
    : content.title;
  
  const pageDescription = subcategoryName
    ? `Find verified ${subcategoryName.toLowerCase()} suppliers and manufacturers in India. Get best prices, bulk orders, quality products. Part of ${categoryName}.`
    : content.description;

  useSEO({
    title: pageTitle,
    description: pageDescription,
    canonical: `https://procuresaathi.com/category/${categorySlug}${subcategorySlug ? `/${subcategorySlug}` : ''}`,
    keywords: content.keywords.join(', ')
  });

  // Inject structured data
  useEffect(() => {
    // Breadcrumb schema
    const breadcrumbs = [
      { name: "Home", url: "https://procuresaathi.com/" },
      { name: "Categories", url: "https://procuresaathi.com/categories" },
      { name: categoryName, url: `https://procuresaathi.com/category/${categorySlug}` },
    ];
    if (subcategoryName) {
      breadcrumbs.push({ 
        name: subcategoryName, 
        url: `https://procuresaathi.com/category/${categorySlug}/${subcategorySlug}` 
      });
    }
    injectStructuredData(getBreadcrumbSchema(breadcrumbs), 'breadcrumb-schema');

    // Product schema
    injectStructuredData(getProductSchema({
      name: subcategoryName || categoryName,
      description: pageDescription,
      category: categoryName,
    }), 'product-schema');

    // FAQ schema
    if (content.faqs.length > 0) {
      injectStructuredData({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": content.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }, 'faq-schema');
    }
  }, [categorySlug, subcategorySlug, categoryName, subcategoryName]);

  if (!category && categorySlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate('/categories')}>Browse Categories</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={procureSaathiLogo} 
              alt="ProcureSaathi - B2B Marketplace" 
              className="h-16 w-auto object-contain"
              width={64}
              height={64}
            />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => navigate('/categories')}>Categories</Button>
            <Button variant="ghost" onClick={() => navigate('/book-truck')}>Logistics</Button>
            <Button variant="ghost" onClick={() => navigate('/blogs')}>Blog</Button>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button onClick={() => navigate('/signup')}>Get Started Free</Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="bg-muted/50 py-3 border-b" aria-label="Breadcrumb">
        <div className="container mx-auto px-4">
          <ol className="flex items-center gap-2 text-sm flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/" className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">Home</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <a href="/categories" className="text-muted-foreground hover:text-primary" itemProp="item">
                <span itemProp="name">Categories</span>
              </a>
              <meta itemProp="position" content="2" />
            </li>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              {subcategoryName ? (
                <a href={`/category/${categorySlug}`} className="text-muted-foreground hover:text-primary" itemProp="item">
                  <span itemProp="name">{categoryName}</span>
                </a>
              ) : (
                <span className="font-medium" itemProp="name">{categoryName}</span>
              )}
              <meta itemProp="position" content="3" />
            </li>
            {subcategoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span className="font-medium" itemProp="name">{subcategoryName}</span>
                  <meta itemProp="position" content="4" />
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/95 to-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white mb-4">Verified Suppliers</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {subcategoryName || categoryName} Suppliers & Manufacturers in India
            </h1>
            <p className="text-lg text-primary-foreground/90 mb-6">
              {pageDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/signup?role=buyer')}
              >
                Post Your Requirement <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10"
                onClick={() => navigate('/signup?role=supplier')}
              >
                Register as Supplier
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Products Listed</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">₹100 Cr+</div>
              <div className="text-sm text-muted-foreground">Trade Value</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary">4.8/5</div>
              <div className="text-sm text-muted-foreground">Buyer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategories Grid */}
      {category && !subcategorySlug && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Browse {categoryName} Subcategories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.subcategories.map((sub) => (
                <Card 
                  key={sub} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/category/${categorySlug}/${nameToSlug(sub)}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium">{sub}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why Source {subcategoryName || categoryName} from ProcureSaathi?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.benefits.map((benefit, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold">{benefit}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            How to Source {subcategoryName || categoryName}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Post Your Requirement</h3>
              <p className="text-sm text-muted-foreground">
                Describe what you need with quantity, specifications, and delivery location
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Receive Competitive Bids</h3>
              <p className="text-sm text-muted-foreground">
                Get quotes from multiple verified suppliers within 24-48 hours
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Compare & Order</h3>
              <p className="text-sm text-muted-foreground">
                Compare prices, choose the best offer, and complete your purchase securely
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {content.faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Find {subcategoryName || categoryName} Suppliers?
          </h2>
          <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto">
            Join 5,000+ businesses sourcing from verified Indian suppliers. Free to post requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => navigate(`/browse?category=${encodeURIComponent(categoryName)}`)}
            >
              View Suppliers
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-8 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <a href="tel:+918368127357" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Phone className="h-5 w-5" />
              +91 8368127357
            </a>
            <a href="mailto:sales@procuresaathi.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
              <Mail className="h-5 w-5" />
              sales@procuresaathi.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={procureSaathiLogo} alt="ProcureSaathi" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ProcureSaathi. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>Categories</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/blogs')}>Blog</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CategoryLanding;
