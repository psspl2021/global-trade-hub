import { useParams, Navigate } from 'react-router-dom';
import { getSignalPageBySlug } from '@/data/signalPages';
import { SignalPageLayout } from '@/components/procurement/SignalPageLayout';

// Supported countries for geo-specific demand intelligence
const SUPPORTED_COUNTRIES: Record<string, string> = {
  'india': 'India',
  'uae': 'UAE',
  'saudi': 'Saudi Arabia',
  'africa': 'Africa',
  'singapore': 'Singapore',
  'vietnam': 'Vietnam',
  'indonesia': 'Indonesia',
  'malaysia': 'Malaysia',
  'bangladesh': 'Bangladesh',
  'nepal': 'Nepal',
};

export default function ProcurementSignalPage() {
  const { slug, country } = useParams<{ slug: string; country?: string }>();
  
  if (!slug) {
    return <Navigate to="/categories" replace />;
  }

  const config = getSignalPageBySlug(slug);

  if (!config) {
    return <Navigate to="/categories" replace />;
  }

  // Resolve country - default to India if not specified or unsupported
  const countryKey = country?.toLowerCase();
  const resolvedCountry = countryKey && SUPPORTED_COUNTRIES[countryKey] 
    ? SUPPORTED_COUNTRIES[countryKey] 
    : 'India';

  return <SignalPageLayout config={config} country={resolvedCountry} />;
}
