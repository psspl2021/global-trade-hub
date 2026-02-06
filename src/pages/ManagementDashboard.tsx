/**
 * ============================================================
 * MANAGEMENT DASHBOARD PAGE
 * ============================================================
 * 
 * CFO/CEO/Manager access to governance features.
 * Sidebar item: "Management Dashboard"
 */

import { ManagementDashboard } from '@/components/governance';

export default function ManagementDashboardPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto py-8 px-4 md:px-6">
        <ManagementDashboard />
      </div>
    </div>
  );
}
