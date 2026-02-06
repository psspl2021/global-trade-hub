/**
 * ============================================================
 * GOVERNANCE BANNER
 * ============================================================
 * 
 * Shows when rewards are paused by admin.
 * Non-dismissible, always visible when rewards_enabled = false
 */

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GovernanceBannerProps {
  pausedReason?: string | null;
}

export function GovernanceBanner({ pausedReason }: GovernanceBannerProps) {
  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Rewards Temporarily Paused</AlertTitle>
      <AlertDescription>
        {pausedReason || 'Rewards temporarily paused by admin.'}
        {' '}Savings & performance tracking continue as normal.
      </AlertDescription>
    </Alert>
  );
}

export default GovernanceBanner;
