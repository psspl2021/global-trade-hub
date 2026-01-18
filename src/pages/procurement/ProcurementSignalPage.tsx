import { useParams, Navigate } from 'react-router-dom';
import { getSignalPageBySlug } from '@/data/signalPages';
import { SignalPageLayout } from '@/components/procurement/SignalPageLayout';

export default function ProcurementSignalPage() {
  const { slug } = useParams<{ slug: string }>();
  
  if (!slug) {
    return <Navigate to="/categories" replace />;
  }

  const config = getSignalPageBySlug(slug);

  if (!config) {
    return <Navigate to="/categories" replace />;
  }

  return <SignalPageLayout config={config} />;
}
