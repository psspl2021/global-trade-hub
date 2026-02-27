import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getProductBySlug, getIndustryBreadcrumb, type IndustrialProduct } from '@/data/industrialProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, Shield, Brain, ArrowRight, CheckCircle2, 
  Factory, Globe, BarChart3, FileCheck, Building2, 
  Lock, Truck, ChevronRight, HelpCircle, AlertTriangle, Activity,
  Wrench, Package, Ship
} from 'lucide-react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from '@/components/ui/table';
import { PostRFQModal } from '@/components/PostRFQModal';
import { useState } from 'react';

function BreadcrumbNav({ product }: { product: IndustrialProduct }) {
  const crumbs = getIndustryBreadcrumb(product.industrySlug, product.subIndustrySlug);
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.procuresaathi.com/" },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem", "position": i + 2, "name": c.name, "item": `https://www.procuresaathi.com${c.slug}`
      })),
      { "@type": "ListItem", "position": crumbs.length + 2, "name": product.name, "item": `https://www.procuresaathi.com/demand/${product.slug}` }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav className="text-sm text-muted-foreground mb-6 flex flex-wrap items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {crumbs.map((c, i) => (
          <span key={c.slug} className="flex items-center gap-1">
            <Link to={`/industries${c.slug}`} className="hover:text-primary">{c.name}</Link>
            <ChevronRight className="h-3 w-3" />
          </span>
        ))}
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>
    </>
  );
}

function HeroSection({ product, onOpenRFQ }: { product: IndustrialProduct; onOpenRFQ: () => void }) {
  return (
    <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <BreadcrumbNav product={product} />
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 gap-1">
                <Shield className="h-3.5 w-3.5" /> AI Verified Suppliers
              </Badge>
              <Badge className="bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 gap-1">
                <Brain className="h-3.5 w-3.5" /> Live Demand Intelligence
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">{product.h1}</h1>
            <p className="text-lg text-muted-foreground mb-6">{product.introText}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onOpenRFQ} className="gap-2 text-lg px-8 py-6">
                Submit RFQ <ArrowRight className="h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 text-lg px-8 py-6">
                <Link to="/seller">List as Supplier</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden border border-border bg-card">
            <img
              src={product.heroImage}
              alt={product.heroImageAlt}
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductOverviewSection({ product }: { product: IndustrialProduct }) {
  const { sections } = product;
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <h2 className="text-2xl font-bold text-foreground mb-4">What are {product.name}?</h2>
          {sections.whatIs.split('\n\n').map((p, i) => <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>)}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Grades & Standards</h2>
          {sections.grades.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Specifications & Dimensions</h2>
          {sections.specifications.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Applications</h2>
          {sections.applications.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Market Trends in {product.country}</h2>
          {sections.marketTrends.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Procurement Challenges</h2>
          {sections.procurementChallenges.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Pricing Factors</h2>
          {sections.pricingFactors.split('\n\n').map((p, i) => (
            <div key={i} className="text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
          ))}

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-foreground">HSN Codes:</span>
            {product.hsnCodes.map(code => <Badge key={code} variant="outline">{code}</Badge>)}
            <span className="text-sm font-medium text-foreground ml-4">Standards:</span>
            {product.standards.map(std => <Badge key={std} variant="secondary">{std}</Badge>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function DemandIntelligenceSection({ product }: { product: IndustrialProduct }) {
  const { demandIntelligence: di } = product;
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> AI Demand Intelligence — {product.name}
          </h2>
          <p className="text-muted-foreground mb-6">Live procurement signals detected by ProcureSaathi's AI engine.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="pt-6 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">{di.intentScore}</p>
              <p className="text-xs text-muted-foreground">Intent Score</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <Shield className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-foreground">{di.confidencePercent}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <FileCheck className="h-5 w-5 mx-auto mb-2 text-orange-500" />
              <p className="text-3xl font-bold text-foreground">{di.recentRFQs}</p>
              <p className="text-xs text-muted-foreground">Recent RFQs</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <Factory className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-foreground">{di.avgDealSize}</p>
              <p className="text-xs text-muted-foreground">Avg Deal Size</p>
            </CardContent></Card>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-foreground">Active Corridors:</span>
            {di.corridors.map(c => (
              <Badge key={c} variant="outline" className="gap-1"><Globe className="h-3 w-3" />{c}</Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            * Illustrative demand intelligence. Actual signals are computed from live RFQ activity and supplier response data within ProcureSaathi's managed procurement ecosystem.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhyProcureSaathiSection() {
  const features = [
    { icon: Brain, title: 'AI Supplier Matching', desc: 'Our AI engine evaluates supplier capability, capacity, quality records, and pricing competitiveness to match your requirements with the most suitable verified suppliers.' },
    { icon: Building2, title: 'Trade Finance', desc: 'Bridge payment term gaps between suppliers and buyers through ProcureSaathi\'s managed trade finance solutions, enabling credit-term procurement from advance-payment suppliers.' },
    { icon: Lock, title: 'Governance Workflow', desc: 'Sealed bidding, immutable audit trails, and two-way anonymity ensure procurement integrity. Every transaction is auditable and manipulation-proof.' },
    { icon: CheckCircle2, title: 'Verified Suppliers', desc: 'Every supplier undergoes verification for BIS/ISO/API certifications, production capacity, financial health, and delivery track record before being activated on the platform.' },
    { icon: Truck, title: 'Export Desk', desc: 'For international procurement, ProcureSaathi\'s managed export desk handles documentation, customs, quality inspection, and logistics from Indian ports to global destinations.' },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Why Source via ProcureSaathi?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.title} className="flex gap-4 p-4 rounded-lg border border-border bg-card">
                <f.icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection({ product }: { product: IndustrialProduct }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": product.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  return (
    <section className="py-12 bg-muted/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions — {product.name}
          </h2>
          <div className="space-y-4">
            {product.faqs.map((faq, i) => (
              <details key={i} className="group border border-border rounded-lg bg-card">
                <summary className="cursor-pointer p-4 font-medium text-foreground flex items-center justify-between">
                  {faq.question}
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepSKUSections({ product }: { product: IndustrialProduct }) {
  const { sections } = product;
  const hasDeep = sections.gradeTable || sections.thicknessChart || sections.complianceMatrix || sections.procurementRiskInsights || sections.indiaDemandIntelligence || sections.sizeTable || sections.widthToleranceTable || sections.bendProperties || sections.seismicPerformance || sections.loadBearingInsights || sections.fabricationImplications || sections.downstreamApplications || sections.exportCompliance;
  if (!hasDeep) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Grade Table — supports tensileStrength and elongation columns dynamically */}
          {sections.gradeTable && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Grade Comparison Table</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Yield Strength</TableHead>
                    {sections.gradeTable.some(g => g.tensileStrength) && <TableHead>Tensile Strength</TableHead>}
                    {sections.gradeTable.some(g => g.elongation) && <TableHead>Elongation</TableHead>}
                    <TableHead>Application</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.gradeTable.map((g, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{g.grade}</TableCell>
                      <TableCell>{g.yieldStrength}</TableCell>
                      {sections.gradeTable!.some(g => g.tensileStrength) && <TableCell>{g.tensileStrength || '—'}</TableCell>}
                      {sections.gradeTable!.some(g => g.elongation) && <TableCell>{g.elongation || '—'}</TableCell>}
                      <TableCell>{g.application}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Thickness Chart */}
          {sections.thicknessChart && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Thickness & Weight Chart</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thickness</TableHead>
                    <TableHead>Weight per Sq Meter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.thicknessChart.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{t.thickness}</TableCell>
                      <TableCell>{t.weightPerSqM}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Size Table (Structural Steel) */}
          {sections.sizeTable && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> Section Size & Weight Table
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Weight per Meter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.sizeTable.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{s.section}</TableCell>
                      <TableCell>{s.weightPerMeter}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Width Tolerance Table (HR Coil) */}
          {sections.widthToleranceTable && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Width Tolerance Table</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Width</TableHead>
                    <TableHead>Tolerance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.widthToleranceTable.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{w.width}</TableCell>
                      <TableCell>{w.tolerance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Bend Properties (TMT) */}
          {sections.bendProperties && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" /> Bend & Mechanical Properties
              </h2>
              <ul className="space-y-2">
                {sections.bendProperties.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seismic Performance (TMT) */}
          {sections.seismicPerformance && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Seismic Performance
              </h2>
              <ul className="space-y-2">
                {sections.seismicPerformance.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Load Bearing Insights (Structural) */}
          {sections.loadBearingInsights && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Load Bearing Insights
              </h2>
              <ul className="space-y-2">
                {sections.loadBearingInsights.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fabrication Implications (Structural) */}
          {sections.fabricationImplications && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" /> Fabrication Implications
              </h2>
              <ul className="space-y-2">
                {sections.fabricationImplications.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Downstream Applications (HR Coil) */}
          {sections.downstreamApplications && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Downstream Applications
              </h2>
              <ul className="space-y-2">
                {sections.downstreamApplications.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance Matrix */}
          {sections.complianceMatrix && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Standards & Compliance
              </h2>
              <ul className="space-y-2">
                {sections.complianceMatrix.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Export Compliance (HR Coil) */}
          {sections.exportCompliance && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" /> Export Compliance
              </h2>
              <ul className="space-y-2">
                {sections.exportCompliance.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Procurement Risk */}
          {sections.procurementRiskInsights && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Procurement Risk Intelligence
              </h2>
              <ul className="space-y-2">
                {sections.procurementRiskInsights.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-destructive/70 mt-1 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* India Demand Intelligence */}
          {sections.indiaDemandIntelligence && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> India Demand Intelligence
              </h2>
              <ul className="space-y-2">
                {sections.indiaDemandIntelligence.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RelatedProductsSection({ product }: { product: IndustrialProduct }) {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {product.relatedProducts.map(slug => {
              const related = getProductBySlug(slug);
              if (!related) return null;
              return (
                <Link key={slug} to={`/demand/${slug}`} className="border border-border rounded-lg p-4 bg-card hover:border-primary/50 transition group">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition">{related.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{related.country} • Intent: {related.demandIntelligence.intentScore}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onOpenRFQ }: { onOpenRFQ: () => void }) {
  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Source?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Submit your procurement requirement and receive AI-matched competitive quotes from verified suppliers within 24 hours.</p>
        <Button size="lg" onClick={onOpenRFQ} className="gap-2 text-lg px-8 py-6">
          Submit RFQ Now <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}

export default function DemandAuthorityPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showRFQ, setShowRFQ] = useState(false);

  if (!slug) return <Navigate to="/demand" replace />;
  
  const product = getProductBySlug(slug);
  if (!product) return <Navigate to="/demand" replace />;

  // Activation + Thin Page Guard
  if (!product.isActivated) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Navigate to="/industries" replace />
      </>
    );
  }

  if (!product.sections?.whatIs || product.sections.whatIs.length < 800) {
    return <Navigate to="/industries" replace />;
  }

  const canonicalUrl = `https://www.procuresaathi.com/demand/${product.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.introText,
    "image": `https://www.procuresaathi.com${product.heroImage}`,
    "brand": { "@type": "Brand", "name": "ProcureSaathi" },
    "category": `${product.industry} > ${product.subIndustry}`,
    "url": canonicalUrl,
    "additionalProperty": [
      ...(product.sections.gradeTable ? [{
        "@type": "PropertyValue",
        "name": "Available Grades",
        "value": product.sections.gradeTable.map(g => g.grade).join(", ")
      }] : []),
      ...(product.sections.thicknessChart ? [{
        "@type": "PropertyValue",
        "name": "Thickness Range",
        "value": `${product.sections.thicknessChart[0]?.thickness} – ${product.sections.thicknessChart[product.sections.thicknessChart.length - 1]?.thickness}`
      }] : []),
      ...(product.sections.sizeTable ? [{
        "@type": "PropertyValue",
        "name": "Available Sections",
        "value": product.sections.sizeTable.map(s => s.section).join(", ")
      }] : []),
      ...(product.sections.widthToleranceTable ? [{
        "@type": "PropertyValue",
        "name": "Width Range",
        "value": product.sections.widthToleranceTable.map(w => w.width).join(", ")
      }] : [])
    ],
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "50000",
      "highPrice": "75000",
      "offerCount": product.demandIntelligence.recentRFQs,
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "ProcureSaathi", "url": "https://www.procuresaathi.com" }
    }
  };

  const relatedProductsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": product.relatedProducts.map((slug, index) => {
      const related = getProductBySlug(slug);
      return {
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.procuresaathi.com/demand/${slug}`,
        name: related?.name
      };
    })
  };

  return (
    <>
      <Helmet>
        <title>{product.metaTitle}</title>
        <meta name="description" content={product.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={product.metaTitle} />
        <meta property="og:description" content={product.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(relatedProductsSchema)}</script>
      </Helmet>
      
      <main className="min-h-screen bg-background">
        <HeroSection product={product} onOpenRFQ={() => setShowRFQ(true)} />
        <ProductOverviewSection product={product} />
        <DeepSKUSections product={product} />
        <DemandIntelligenceSection product={product} />
        <WhyProcureSaathiSection />
        <FAQSection product={product} />
        <RelatedProductsSection product={product} />
        <CTASection onOpenRFQ={() => setShowRFQ(true)} />
      </main>

      <PostRFQModal 
        open={showRFQ} 
        onOpenChange={setShowRFQ}
        signalPageCategory={product.industry}
        signalPageSubcategory={product.name}
      />
    </>
  );
}
