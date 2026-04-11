import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

// Lazy load — demo code never ships to non-admin bundles
const DemoGuidedFlow = lazy(() => import('@/components/demo/DemoGuidedFlow').then(m => ({ default: m.DemoGuidedFlow })));

export default function AdminDemoPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user?.id);

  // While resolving auth/role — render nothing (no UI hint)
  if (authLoading || roleLoading) return null;

  const isAdmin = role === 'ps_admin' || role === 'admin';

  // Hard block — no redirect, no 404, no hint this route exists
  if (!user || !isAdmin) return null;

  return (
    <Suspense fallback={null}>
      <DemoGuidedFlow
        onReset={() => undefined}
        onExit={() => navigate('/admin')}
      />
    </Suspense>
  );
}
