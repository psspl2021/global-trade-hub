import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSEO, injectStructuredData, getBreadcrumbSchema } from '@/hooks/useSEO';
import { TrendingUp, Shield, Users, BarChart3, Activity, CheckCircle, Globe } from 'lucide-react';
import { getPriorityCorridorBySlug } from '@/data/priorityCorridors';

interface DemandSignal {
  intent_score: number | null;
  category: string | null;
  country: string | null;
  created_at: string;
}

interface ContractData {
  total_value: number | null;
  category: string | null;
  approval_status: string | null;
}

/** Global fallback — ensures NO thin pages */
function GlobalFallback({ category, display }: { category: string; display: string }) {
  return (
    <section className="border border-border rounded-xl p-8 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Global Market Projection</h2>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Based on verified global contracts and AI demand signals across 196 countries,
        ProcureSaathi projects growing procurement activity for <strong>{category}</strong> in <strong>{display}</strong>.
        Early corridor intelligence is being aggregated from cross-border trade flows, supplier registrations,
        and buyer intent signals detected across our platform.
      </p>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Submit an RFQ to signal demand and unlock AI-driven supplier matching, real-time pricing intelligence,
        and managed procurement support for this corridor.
      </p>
      <Link
        to="/post-rfq"
        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
      >
        Submit RFQ to Activate Corridor
      </Link>
    </section>
  );
}

/** Authority content section — prevents thin-page penalties */
function AuthoritySection({ category }: { category: string }) {
  return (
    <>
      <section className="border border-border rounded-xl p-6 bg-card">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Why Source {category} via ProcureSaathi?
        </h2>
        <ul className="space-y-3">
          {[
            'AI-driven supplier ranking based on performance, pricing, and delivery reliability',
            'Immutable audit ledger with blockchain-grade governance for every transaction',
            'Trade finance enabled — credit facilities for qualified procurement',
            'Governed procurement workflow with sealed bidding and transparent award logic',
            'End-to-end managed logistics with real-time tracking and quality assurance',
            'Cross-border export desk supporting documentation, customs, and compliance',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** Market overview from priority corridor data */
function MarketOverviewSection({ category, overview }: { category: string; overview: string }) {
  return (
    <section className="border border-border rounded-xl p-6 bg-card">
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" /> Market Overview: {category}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-4">
        {overview.split('. ').reduce((paragraphs: string[], sentence, i, arr) => {
          const pIdx = Math.floor(i / Math.ceil(arr.length / 3));
          paragraphs[pIdx] = (paragraphs[pIdx] || '') + sentence + (i < arr.length - 1 ? '. ' : '');
          return paragraphs;
        }, []).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export default function DemandPage() {
  const { slug } = useParams<{ slug: string }>();
  const [signals, setSignals] = useState<DemandSignal[]>([]);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [countryName, setCountryName] = useState('');
  const [loading, setLoading] = useState(true);

  // Parse slug: country-category (e.g., "in-metals-ferrous-steel-iron")
  const { countryCode, categorySlug } = useMemo(() => {
    if (!slug) return { countryCode: '', categorySlug: '' };
    const parts = slug.split('-');
    return { countryCode: parts[0]?.toUpperCase() || '', categorySlug: parts.slice(1).join('-') };
  }, [slug]);

  const priorityCorridor = slug ? getPriorityCorridorBySlug(slug) : undefined;
  const categoryDisplay = priorityCorridor?.categoryDisplay || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  useEffect(() => {
    if (!countryCode) return;
    supabase.from('countries_master').select('country_name, region')
      .eq('iso_code', countryCode).single()
      .then(({ data }) => { if (data) setCountryName(data.country_name); });
  }, [countryCode]);

  useEffect(() => {
    async function fetchData() {
      if (!countryCode || !categorySlug) return;

      const [signalRes, contractRes, auditRes] = await Promise.all([
        supabase.from('demand_intelligence_signals')
          .select('intent_score, category, country, created_at')
          .ilike('country', `%${countryCode}%`)
          .ilike('category', `%${categorySlug.replace(/-/g, '%')}%`)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('contract_summaries')
          .select('total_value, category, approval_status')
          .eq('approval_status', 'approved')
          .ilike('category', `%${categorySlug.replace(/-/g, '%')}%`)
          .limit(20),
        supabase.from('audit_ledger')
          .select('id', { count: 'exact', head: true })
          .eq('entity_type', 'contract'),
      ]);

      if (signalRes.data) setSignals(signalRes.data);
      if (contractRes.data) setContracts(contractRes.data);
      if (auditRes.count) setAuditCount(auditRes.count);
      setLoading(false);
    }
    fetchData();
  }, [countryCode, categorySlug]);

  const avgIntent = signals.length > 0 ? (signals.reduce((s, d) => s + (d.intent_score || 0), 0) / signals.length).toFixed(1) : null;
  const recentSignals = signals.filter(s => {
    const d = new Date(s.created_at);
    return d > new Date(Date.now() - 14 * 86400000);
  }).length;
  const contractValues = contracts.map(c => c.total_value || 0).filter(v => v > 0);
  const avgContractValue = contractValues.length > 0 ? (contractValues.reduce((s, v) => s + v, 0) / contractValues.length) : null;
  const regionSlug = 'asia'; // fallback

  const display = priorityCorridor?.country || countryName || countryCode;

  useSEO({
    title: `Buy ${categoryDisplay} in ${display} — AI Verified Suppliers & Live Rates | ProcureSaathi`,
    description: `Source ${categoryDisplay} in ${display} with AI-verified suppliers, live demand intelligence, and transparent market pricing. ${avgIntent ? `Intent Score: ${avgIntent}/10.` : 'Submit RFQ to activate this procurement corridor.'}`,
    canonical: `https://www.procuresaathi.com/demand/${slug}`,
  });

  // JSON-LD with provider
  useEffect(() => {
    if (!display) return;
    const schemaData: Record<string, unknown> = {
      "@context": "https://schema.org/",
      "@type": "Service",
      "name": `Industrial ${categoryDisplay} Procurement in ${display}`,
      "description": `AI-driven procurement with demand score ${avgIntent || 'N/A'}/10.`,
      "areaServed": display,
      "provider": {
        "@type": "Organization",
        "name": "ProcureSaathi",
        "url": "https://www.procuresaathi.com"
      },
    };
    if (contractValues.length > 0) {
      (schemaData as any).offers = {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": Math.min(...contractValues).toString(),
        "highPrice": Math.max(...contractValues).toString(),
        "offerCount": contractValues.length.toString(),
      };
    }
    injectStructuredData(schemaData, 'demand-page-schema');

    injectStructuredData(getBreadcrumbSchema([
      { name: 'Home', url: 'https://www.procuresaathi.com' },
      { name: 'Explore', url: 'https://www.procuresaathi.com/explore' },
      { name: display, url: `https://www.procuresaathi.com/explore/${regionSlug}/${countryCode.toLowerCase()}` },
      { name: categoryDisplay, url: `https://www.procuresaathi.com/demand/${slug}` },
    ]), 'breadcrumb-demand');
  }, [display, categoryDisplay, avgIntent, contractValues, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasData = signals.length > 0 || contracts.length > 0;

  return (
    <main className="min-h-screen bg-background">
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8 flex flex-wrap gap-1">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>→</span>
            <Link to="/explore" className="hover:text-primary">Explore</Link>
            <span>→</span>
            <Link to={`/explore/${regionSlug}/${countryCode.toLowerCase()}`} className="hover:text-primary">{display}</Link>
            <span>→</span>
            <span className="text-foreground font-medium">{categoryDisplay}</span>
          </nav>

          {/* SECTION 1: Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Buy {categoryDisplay} in {display} — AI Verified Suppliers & Live Market Rates
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
            Access real-time procurement intelligence for {categoryDisplay} sourcing in {display}. Data-driven insights from verified trade corridors.
          </p>

          <div className="space-y-8">
            {/* Demand Pulse — always show */}
            {hasData ? (
              <>
                {/* SECTION 2: Demand Pulse */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-border rounded-xl p-6 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Intent Score</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{avgIntent || '—'}<span className="text-sm text-muted-foreground">/10</span></p>
                  </div>
                  <div className="border border-border rounded-xl p-6 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Confidence</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{signals.length > 0 ? `${Math.min(signals.length * 15, 95)}%` : '—'}</p>
                  </div>
                  <div className="border border-border rounded-xl p-6 bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Recent Activity</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{recentSignals}</p>
                    <p className="text-xs text-muted-foreground">signals in last 14 days</p>
                  </div>
                </div>

                {/* SECTION 3: AI Pricing Signal */}
                {contracts.length > 0 && (
                  <div className="border border-border rounded-xl p-6 bg-card">
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" /> AI Pricing Signal
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Approved Contract</p>
                        <p className="text-2xl font-bold text-foreground">₹{avgContractValue ? (avgContractValue / 100000).toFixed(1) + 'L' : '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Approved</p>
                        <p className="text-2xl font-bold text-foreground">{contracts.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price Range</p>
                        <p className="text-2xl font-bold text-foreground">
                          {contractValues.length > 0 ? `₹${(Math.min(...contractValues) / 100000).toFixed(1)}L – ₹${(Math.max(...contractValues) / 100000).toFixed(1)}L` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Governance Proof */}
                <div className="border border-border rounded-xl p-6 bg-card">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Governance & Audit Trail
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Approved Contracts</p>
                      <p className="text-2xl font-bold text-foreground">{contracts.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Audit Ledger Entries</p>
                      <p className="text-2xl font-bold text-foreground">{auditCount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Immutable Governance</p>
                        <p className="text-xs text-muted-foreground">Blockchain-grade audit trail</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Zero-data fallback — NO thin pages */
              <GlobalFallback category={categoryDisplay} display={display} />
            )}

            {/* AUTHORITY SECTIONS — always rendered for content depth */}
            <AuthoritySection category={categoryDisplay} />

            {/* Market Overview for priority corridors */}
            {priorityCorridor && (
              <MarketOverviewSection category={categoryDisplay} overview={priorityCorridor.marketOverview} />
            )}

            {/* CTA */}
            <div className="text-center py-6">
              <Link to="/post-rfq" className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition">
                Submit RFQ for {categoryDisplay}
              </Link>
              <p className="text-sm text-muted-foreground mt-2">AI-matched with verified suppliers in {display}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
