import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { industryTaxonomy, getProductBySlug, type IndustryNode } from '@/data/industrialProducts';
import { ArrowRight, ChevronRight, Layers } from 'lucide-react';

const BASE = 'https://www.procuresaathi.com';

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

/** Renders authority content sections */
function AuthoritySections({ sections }: { sections: { heading: string; content: string }[] }) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-3xl mb-10 space-y-8">
      {sections.map((section, i) => (
        <div key={i}>
          <h2 className="text-2xl font-bold text-foreground mb-3">{section.heading}</h2>
          {section.content.split('\n\n').map((para, j) => (
            <p key={j} className="text-muted-foreground mb-4 whitespace-pre-line">{para}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Build CollectionPage + ItemList schema */
function buildCategorySchemas(
  name: string,
  description: string,
  canonical: string,
  productSlugs: string[],
  breadcrumbItems: { name: string; url: string }[]
) {
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": name,
    "description": description,
    "url": canonical,
    "isPartOf": { "@type": "WebSite", "name": "ProcureSaathi", "url": BASE }
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Products in ${name}`,
    "itemListElement": productSlugs.map((slug, index) => {
      const product = getProductBySlug(slug);
      return {
        "@type": "ListItem",
        "position": index + 1,
        "url": `${BASE}/demand/${slug}`,
        "name": product?.name || slug
      };
    })
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return { collectionPageSchema, itemListSchema, breadcrumbSchema };
}

/** /industries — Top-level index */
function IndustriesIndex() {
  const breadcrumbItems = [
    { name: 'Home', url: `${BASE}/` },
    { name: 'Industries', url: `${BASE}/industries` }
  ];

  const allProductSlugs = industryTaxonomy.flatMap(i =>
    i.children?.flatMap(c => c.productSlugs || []) || i.productSlugs || []
  );

  const { collectionPageSchema, itemListSchema, breadcrumbSchema } = buildCategorySchemas(
    'Industrial Procurement by Industry',
    'AI-powered industrial procurement across metals, polymers, and industrial supplies with verified suppliers.',
    `${BASE}/industries`,
    allProductSlugs,
    breadcrumbItems
  );

  return (
    <>
      <Helmet>
        <title>Industrial Procurement by Industry — AI Verified Suppliers | ProcureSaathi</title>
        <meta name="description" content="Explore AI-powered industrial procurement across metals, polymers, and industrial supplies. Verified suppliers, competitive pricing, and managed procurement for every industry vertical." />
        <link rel="canonical" href={`${BASE}/industries`} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(collectionPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
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
              Whether you are sourcing <Link to="/demand/ms-plates-india" className="text-primary hover:underline">MS Plates</Link> for a construction project,
              <Link to="/demand/hdpe-granules-india" className="text-primary hover:underline"> HDPE granules</Link> for pipe manufacturing,
              or <Link to="/demand/industrial-valves-india" className="text-primary hover:underline"> industrial valves</Link> for an oil refinery,
              our managed procurement model ensures transparent, competitive, and auditable sourcing.
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
  const canonical = `${BASE}/industries/${industry.slug}`;

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE}/` },
    { name: 'Industries', url: `${BASE}/industries` },
    { name: industry.name, url: canonical }
  ];

  const { collectionPageSchema, itemListSchema, breadcrumbSchema } = buildCategorySchemas(
    industry.name,
    industry.description,
    canonical,
    allProducts,
    breadcrumbItems
  );

  return (
    <>
      <Helmet>
        <title>{industry.metaTitle}</title>
        <meta name="description" content={industry.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(collectionPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {industry.h1 || industry.name}
            </h1>

            {industry.authoritySections && industry.authoritySections.length > 0 ? (
              <AuthoritySections sections={industry.authoritySections} />
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-3xl mb-10">
                <p className="text-muted-foreground">{industry.description}</p>
              </div>
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                  {allProducts.map(slug => <ProductLink key={slug} slug={slug} />)}
                </div>
              </>
            )}

            <div className="mt-10 text-center">
              <Link
                to="/post-rfq"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                Submit RFQ for {industry.name} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
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

  const canonical = `${BASE}/industries/${industrySlug}/${subIndustrySlug}`;
  const productSlugs = subIndustry.productSlugs || [];

  const breadcrumbItems = [
    { name: 'Home', url: `${BASE}/` },
    { name: 'Industries', url: `${BASE}/industries` },
    { name: industry.name, url: `${BASE}/industries/${industrySlug}` },
    { name: subIndustry.name, url: canonical }
  ];

  const { collectionPageSchema, itemListSchema, breadcrumbSchema } = buildCategorySchemas(
    subIndustry.name,
    subIndustry.description,
    canonical,
    productSlugs,
    breadcrumbItems
  );

  return (
    <>
      <Helmet>
        <title>{subIndustry.metaTitle}</title>
        <meta name="description" content={subIndustry.metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(collectionPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {subIndustry.h1 || subIndustry.name}
            </h1>

            {subIndustry.authoritySections && subIndustry.authoritySections.length > 0 ? (
              <AuthoritySections sections={subIndustry.authoritySections} />
            ) : (
              <div className="prose prose-lg dark:prose-invert max-w-3xl mb-10">
                <p className="text-muted-foreground">{subIndustry.description}</p>
              </div>
            )}

            {productSlugs.length > 0 && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-6">Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productSlugs.map(slug => <ProductLink key={slug} slug={slug} />)}
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
