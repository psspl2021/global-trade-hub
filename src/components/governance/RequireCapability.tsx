import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useCapabilities, type Capability } from '@/hooks/useCapabilities';

interface Props {
  cap: Capability;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side capability gate. Server-side enforcement happens in the RPCs;
 * this only hides UI to avoid showing controls users can't use.
 */
export function RequireCapability({ cap, children, fallback }: Props) {
  const { has, loading } = useCapabilities();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
        </CardContent>
      </Card>
    );
  }

  if (!has(cap)) {
    return (
      <>{fallback ?? (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="text-sm font-medium">Restricted</div>
            <div className="text-xs text-muted-foreground">
              You don't have permission to view this section.
            </div>
          </CardContent>
        </Card>
      )}</>
    );
  }

  return <>{children}</>;
}

export default RequireCapability;
