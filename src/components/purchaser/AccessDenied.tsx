/**
 * ============================================================
 * ACCESS DENIED COMPONENT
 * ============================================================
 * 
 * Shown when user doesn't have access to purchaser rewards system.
 * Suppliers, external buyers, and marketplace users see this.
 */

import { ShieldX, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function AccessDenied() {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
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

export default AccessDenied;
