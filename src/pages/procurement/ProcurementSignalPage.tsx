import { useParams, Navigate } from 'react-router-dom';
import { 
  getSignalPageBySlugWithCountry, 
  getSignalPageBySlug, 
  getSignalPageBySlugSafe,
  generateFallbackSignalPageConfig 
} from '@/data/signalPages';
import { SignalPageLayout } from '@/components/procurement/SignalPageLayout';
import { isCountrySupported, DEFAULT_COUNTRY, getCountryByCode } from '@/data/supportedCountries';
import type { CountryEnrichedSignalPageConfig } from '@/data/signalPages';

export default function ProcurementSignalPage() {
  const { slug, country } = useParams<{ slug: string; country?: string }>();
  
  if (!slug) {
    return <Navigate to="/categories" replace />;
  }

  // First get base config to check for canonical redirects
  const baseConfig = getSignalPageBySlug(slug);

  // Handle canonical redirects - if this is an alias slug, redirect to canonical
  if (baseConfig?.canonicalSlug && baseConfig.canonicalSlug !== slug) {
    const countryPrefix = country ? `/${country}` : '';
    return <Navigate to={`${countryPrefix}/procurement/${baseConfig.canonicalSlug}`} replace />;
  }

  // Validate country - redirect to base route if unsupported
  const countryCode = country?.toLowerCase();
  if (countryCode && !isCountrySupported(countryCode)) {
    // Unsupported country - redirect to base procurement URL
    return <Navigate to={`/procurement/${slug}`} replace />;
  }

  // Get country-enriched config - FALLBACK SAFE (never returns undefined)
  let enrichedConfig = getSignalPageBySlugWithCountry(slug, countryCode);

  // If registry lookup failed, generate fallback config with country enrichment
  if (!enrichedConfig) {
    const fallbackConfig = getSignalPageBySlugSafe(slug);
    const countryInfo = countryCode 
      ? getCountryByCode(countryCode) || DEFAULT_COUNTRY
      : DEFAULT_COUNTRY;
    
    const isIndia = countryInfo.code === 'india';
    
    enrichedConfig = {
      ...fallbackConfig,
      countryInfo,
      countryMetaTitle: isIndia 
        ? fallbackConfig.metaTitle 
        : `${fallbackConfig.metaTitle} | ${countryInfo.seoLabel}`,
      countryMetaDescription: isIndia 
        ? fallbackConfig.metaDescription 
        : `${fallbackConfig.metaDescription} Now delivering to ${countryInfo.seoLabel}.`,
      logisticsLine: isIndia 
        ? countryInfo.logisticsHint 
        : `Delivery supported across ${countryInfo.seoLabel} via ProcureSaathi's managed export desk.`
    } as CountryEnrichedSignalPageConfig;
    
    console.log(`[SignalPage] Using fallback config for: ${slug}`);
  }

  return (
    <SignalPageLayout 
      config={enrichedConfig} 
      countryCode={countryCode || DEFAULT_COUNTRY.code}
    />
  );
}
