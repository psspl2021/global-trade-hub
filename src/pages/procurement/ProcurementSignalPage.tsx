import { useParams, Navigate } from 'react-router-dom';
import { getSignalPageBySlugWithCountry, getSignalPageBySlug } from '@/data/signalPages';
import { SignalPageLayout } from '@/components/procurement/SignalPageLayout';
import { isCountrySupported, DEFAULT_COUNTRY } from '@/data/supportedCountries';

export default function ProcurementSignalPage() {
  const { slug, country } = useParams<{ slug: string; country?: string }>();
  
  if (!slug) {
    return <Navigate to="/categories" replace />;
  }

  // First get base config to check for canonical redirects
  const baseConfig = getSignalPageBySlug(slug);

  if (!baseConfig) {
    return <Navigate to="/categories" replace />;
  }

  // Handle canonical redirects - if this is an alias slug, redirect to canonical
  if (baseConfig.canonicalSlug && baseConfig.canonicalSlug !== slug) {
    const countryPrefix = country ? `/${country}` : '';
    return <Navigate to={`${countryPrefix}/procurement/${baseConfig.canonicalSlug}`} replace />;
  }

  // Validate country - redirect to base route if unsupported
  const countryCode = country?.toLowerCase();
  if (countryCode && !isCountrySupported(countryCode)) {
    // Unsupported country - redirect to base procurement URL
    return <Navigate to={`/procurement/${slug}`} replace />;
  }

  // Get country-enriched config
  const enrichedConfig = getSignalPageBySlugWithCountry(slug, countryCode);

  if (!enrichedConfig) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <SignalPageLayout 
      config={enrichedConfig} 
      countryCode={countryCode || DEFAULT_COUNTRY.code}
    />
  );
}
