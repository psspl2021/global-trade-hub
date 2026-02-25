import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { industryTaxonomy, getIndustryBySlug, getProductBySlug, type IndustryNode } from '@/data/industrialProducts';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Layers, ArrowRight } from 'lucide-react';

function IndustryCard({ node, basePath }: { node: IndustryNode; basePath: string }) {
  return (
    <Link
      to={`${basePath}/${node.slug}`}
      className="border border-border rounded-xl p-6 bg-card hover:border-primary/50 transition group"
    >
      <div className="flex items-center justify-between mb-3">
        <Layers className="h-5 w-5 text-primary" />
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
      </div>
      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition mb-2">{node.name}</h2>
      <p className="text-sm text-muted-foreground line-clamp-3">{node.description}</p>
      {node.children && (
        <p className="text-xs text-primary mt-3">{node.children.length} sub-categories →</p>
      )}
      {node.productSlugs && (
        <p className="text-xs text-primary mt-3">{node.productSlugs.length} products →</p>
      )}
    </Link>
  );
}

function ProductLink({ slug }: { slug: string }) {
  const product = getProductBySlug(slug);
  if (!product) return null;
  return (
    <Link
      to={`/demand/${slug}`}
      className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition group flex items-center justify-between"
    >
      <div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.country} • Intent Score: {product.demandIntelligence.intentScore}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
    </Link>
  );
}

/** /industries — Top-level index */
function IndustriesIndex() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.procuresaathi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Industries", "item": "https://www.procuresaathi.com/industries" }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Industrial Procurement by Industry — AI Verified Suppliers | ProcureSaathi</title>
        <meta name="description" content="Explore AI-powered industrial procurement across metals, polymers, and industrial supplies. Verified suppliers, competitive pricing, and managed procurement for every industry vertical." />
        <link rel="canonical" href="https://www.procuresaathi.com/industries" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      <main className="min-h-screen bg-background">
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Industries</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Industrial Procurement by Industry</h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
              ProcureSaathi provides AI-powered managed procurement across India's core industrial sectors. 
              Each industry vertical features verified suppliers, competitive pricing intelligence, and governance-compliant procurement workflows. 
              Our platform aggregates live demand signals from buyers and matches them with qualified suppliers through sealed bidding and immutable audit trails.
            </p>
            <p className="text-muted-foreground mb-10 max-w-3xl">
              India's industrial economy spans metals and steel production exceeding 140 million MT annually, a rapidly growing polymer processing sector, 
              and a diverse industrial supplies ecosystem serving oil & gas, water infrastructure, power generation, and construction sectors. 
              ProcureSaathi's demand intelligence engine continuously monitors procurement intent across these verticals, 
              identifying high-confidence demand corridors and connecting buyers with the most capable suppliers. 
              Whether you are sourcing MS Plates for a construction project, HDPE granules for pipe manufacturing, 
              or industrial valves for an oil refinery, our managed procurement model ensures transparent, competitive, and auditable sourcing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industryTaxonomy.map(industry => (
                <IndustryCard key={industry.slug} node={industry} basePath="/industries" />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/** /industries/:industry — Industry detail page */
function IndustryDetailPage({ industrySlug }: { industrySlug: string }) {
  const industry = industryTaxonomy.find(i => i.slug === industrySlug);
  if (!industry) return <Navigate to="/industries" replace />;

  const allProducts = industry.children?.flatMap(c => c.productSlugs || []) || industry.productSlugs || [];
  const canonical = `https://www.procuresaathi.com/industries/${industry.slug}`;

  return (
    <>
      <Helmet>
        <title>{industry.metaTitle}</title>
        <meta name="description" content={industry.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>
      <main className="min-h-screen bg-background">
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/industries" className="hover:text-primary">Industries</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{industry.name}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{industry.name}</h1>
            <div className="prose prose-lg dark:prose-invert max-w-3xl mb-10">
              <p className="text-muted-foreground">{industry.description}</p>
              <p className="text-muted-foreground">
                ProcureSaathi's AI-powered procurement engine serves as the single counterparty for all {industry.name.toLowerCase()} transactions, 
                ensuring price transparency through sealed bidding, quality assurance through verified supplier networks, 
                and governance compliance through immutable audit trails. Whether you are an EPC contractor, manufacturer, 
                or institutional buyer, our managed procurement model eliminates the information asymmetry and intermediary margins 
                that characterize traditional industrial sourcing in India.
              </p>
              <p className="text-muted-foreground">
                The platform continuously monitors procurement intent across the {industry.name.toLowerCase()} sector, 
                detecting demand signals from buyer searches, RFQ submissions, and market activity data. 
                This intelligence drives proactive supplier activation and ensures competitive pricing for every procurement corridor. 
                Our governance framework — featuring two-way anonymity, AI-driven L1 supplier ranking, and sealed competitive bidding — 
                sets a new standard for industrial procurement integrity in India and global trade corridors.
              </p>
            </div>

            {industry.children && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-6">Sub-Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  {industry.children.map(child => (
                    <IndustryCard key={child.slug} node={child} basePath={`/industries/${industry.slug}`} />
                  ))}
                </div>
              </>
            )}

            {allProducts.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-6">Products in {industry.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allProducts.map(slug => <ProductLink key={slug} slug={slug} />)}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

/** /industries/:industry/:subIndustry — Sub-industry detail */
function SubIndustryDetailPage({ industrySlug, subIndustrySlug }: { industrySlug: string; subIndustrySlug: string }) {
  const industry = industryTaxonomy.find(i => i.slug === industrySlug);
  if (!industry) return <Navigate to="/industries" replace />;
  
  const subIndustry = industry.children?.find(c => c.slug === subIndustrySlug);
  if (!subIndustry) return <Navigate to={`/industries/${industrySlug}`} replace />;

  const canonical = `https://www.procuresaathi.com/industries/${industrySlug}/${subIndustrySlug}`;

  return (
    <>
      <Helmet>
        <title>{subIndustry.metaTitle}</title>
        <meta name="description" content={subIndustry.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>
      <main className="min-h-screen bg-background">
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-1">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to="/industries" className="hover:text-primary">Industries</Link>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/industries/${industrySlug}`} className="hover:text-primary">{industry.name}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{subIndustry.name}</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{subIndustry.name}</h1>
            <div className="prose prose-lg dark:prose-invert max-w-3xl mb-10">
              <p className="text-muted-foreground">{subIndustry.description}</p>
              <p className="text-muted-foreground">
                ProcureSaathi serves as the definitive procurement intelligence and managed sourcing platform for {subIndustry.name.toLowerCase()} in India and global trade corridors. 
                Our AI engine processes thousands of procurement signals daily, matching buyer requirements with verified supplier capabilities through a transparent, governance-compliant workflow. 
                Every transaction is processed through sealed competitive bidding with immutable audit trails, 
                ensuring that procurement decisions are driven by objective supplier evaluation rather than relationship-based trading.
              </p>
              <p className="text-muted-foreground">
                The platform's demand intelligence continuously tracks procurement patterns, pricing trends, and supply-demand dynamics 
                across the {subIndustry.name.toLowerCase()} segment. This data powers real-time market insights for buyers, 
                enabling informed procurement decisions backed by live competitive pricing and verified supplier quality records. 
                Whether sourcing for domestic consumption or international trade corridors, ProcureSaathi's managed procurement model 
                delivers cost optimization, quality assurance, and complete procurement governance.
              </p>
            </div>

            {subIndustry.productSlugs && subIndustry.productSlugs.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-6">Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subIndustry.productSlugs.map(slug => <ProductLink key={slug} slug={slug} />)}
                </div>
              </>
            )}

            <div className="mt-10 text-center">
              <Link 
                to="/post-rfq" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                Submit RFQ for {subIndustry.name} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/** Router entry — handles /industries, /industries/:industry, /industries/:industry/:subIndustry */
export default function IndustriesPage() {
  const { industry, subIndustry } = useParams<{ industry?: string; subIndustry?: string }>();
  
  if (!industry) return <IndustriesIndex />;
  if (!subIndustry) return <IndustryDetailPage industrySlug={industry} />;
  return <SubIndustryDetailPage industrySlug={industry} subIndustrySlug={subIndustry} />;
}
