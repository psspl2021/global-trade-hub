/**
 * ============================================================
 * ACCESS DENIED COMPONENT
 * ============================================================
 * 
 * RULE 9: ROLE-BASED HARD GATING
 * If role IN ('supplier', 'external_guest'):
 *   → Return 404 for:
 *     • Purchaser Dashboard
 *     • AI Selection Engine
 *     • Control Tower
 *     • Savings
 *     • Incentives
 * 
 * Suppliers and external guests see NOTHING.
 */

import { ShieldX, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AccessDeniedProps {
  variant?: 'default' | '404' | 'supplier-locked';
  returnPath?: string;
  className?: string;
}

export function AccessDenied({ 
  variant = 'default',
  returnPath = '/',
  className 
}: AccessDeniedProps) {
  const navigate = useNavigate();

  // RULE 9: Supplier/External Guest sees 404 (not "access denied")
  if (variant === '404' || variant === 'supplier-locked') {
    return (
      <div className={cn("min-h-[60vh] flex items-center justify-center", className)}>
        <Card className="max-w-md border-muted bg-muted/30">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-muted">
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-muted-foreground mb-2">404</h1>
            <h3 className="text-lg font-semibold mb-2">
              Page Not Found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              The page you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate(returnPath)} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default access denied for purchasers in read-only mode
  return (
    <Card className={cn("border-destructive/20 bg-destructive/5", className)}>
      <CardContent className="py-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Access Restricted
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This is an internal procurement governance system. 
          Access is limited to authorized purchasers, management, and compliance personnel.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>ProcureSaathi Internal System</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wrapper component that checks role and shows 404 for unauthorized users
 */
interface RoleGatedContentProps {
  children: React.ReactNode;
  allowedRoles: string[];
  currentRole: string | null;
  isLoading?: boolean;
  showAs404?: boolean;
}

export function RoleGatedContent({
  children,
  allowedRoles,
  currentRole,
  isLoading = false,
  showAs404 = true
}: RoleGatedContentProps) {
  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  // Check if current role is blocked (supplier or external_guest)
  const isBlockedRole = currentRole && ['supplier', 'external_guest'].includes(currentRole);
  
  // Check if current role is allowed
  const isAllowed = currentRole && allowedRoles.includes(currentRole);

  if (isBlockedRole || !isAllowed) {
    return <AccessDenied variant={showAs404 ? '404' : 'default'} />;
  }

  return <>{children}</>;
}

export default AccessDenied;
