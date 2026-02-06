/**
 * ============================================================
 * SAVINGS TRACKER (PURCHASER VIEW)
 * ============================================================
 * 
 * Tracks AI-verified savings per RFQ.
 * 
 * CRITICAL FINANCIAL STRUCTURE:
 * - Reward pool funded by BUYER ORGANISATION (not ProcureSaathi)
 * - ProcureSaathi only MEASURES & VERIFIES savings
 * - Reward percentage decided by CFO/CEO quarterly
 * - NEVER linked to supplier payments
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  IndianRupee, 
  CheckCircle2, 
  Clock,
  Gift,
  Info,
  Sparkles,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LegalDisclaimer } from './LegalDisclaimer';

interface SavingsRecord {
  id: string;
  rfq_id: string;
  baseline_price: number;
  final_price: number;
  net_savings: number;
  savings_percentage: number;
  verified_by_ai: boolean;
  created_at: string;
}

interface SavingsTrackerProps {
  rewardsEnabled?: boolean;
}

// Sample data for demonstration
const sampleSavings: SavingsRecord[] = [
  {
    id: '1',
    rfq_id: 'RFQ-2026-001',
    baseline_price: 1250000,
    final_price: 1087500,
    net_savings: 162500,
    savings_percentage: 13,
    verified_by_ai: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    rfq_id: 'RFQ-2026-002',
    baseline_price: 850000,
    final_price: 765000,
    net_savings: 85000,
    savings_percentage: 10,
    verified_by_ai: true,
    created_at: '2026-01-20T14:30:00Z',
  },
  {
    id: '3',
    rfq_id: 'RFQ-2026-003',
    baseline_price: 2100000,
    final_price: 1890000,
    net_savings: 210000,
    savings_percentage: 10,
    verified_by_ai: false,
    created_at: '2026-01-25T09:15:00Z',
  },
];

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

export function SavingsTracker({ rewardsEnabled = true }: SavingsTrackerProps) {
  const [savings, setSavings] = useState<SavingsRecord[]>(sampleSavings);
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const totalSavings = savings.reduce((sum, s) => sum + s.net_savings, 0);
  const verifiedSavings = savings.filter(s => s.verified_by_ai).reduce((sum, s) => sum + s.net_savings, 0);
  const rewardPoolPercentage = 0.015; // 1.5% - Set by CFO/CEO
  const potentialReward = verifiedSavings * rewardPoolPercentage;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600/80 font-medium">Total Savings</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalSavings)}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-200/50">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600/80 font-medium">AI Verified</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(verifiedSavings)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-200/50">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reward Pool - Hidden when rewards disabled */}
          <Card className={cn(
            "bg-gradient-to-br border-amber-200",
            rewardsEnabled 
              ? "from-amber-50 to-amber-100/50" 
              : "from-muted to-muted/50 opacity-60"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm text-amber-600/80 font-medium">
                      {rewardsEnabled ? 'Reward Pool' : 'Rewards Paused'}
                    </p>
                    <p className="text-2xl font-bold text-amber-700">
                      {rewardsEnabled ? formatCurrency(potentialReward) : '—'}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Funded by your organisation's incentive budget, not ProcureSaathi. 
                        Percentage set by CFO/CEO quarterly.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="p-3 rounded-full bg-amber-200/50">
                  <Gift className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funding Source Clarity */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">How Rewards Work</p>
                <p className="text-xs text-muted-foreground">
                  Your organisation (CFO/CEO) decides the incentive percentage. 
                  ProcureSaathi provides AI-verified proof of savings. 
                  Rewards are never linked to supplier payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Savings History
            </CardTitle>
            <CardDescription>
              Each RFQ tracked with baseline vs. final price (AI-verified)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {savings.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      record.verified_by_ai 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-muted/30 border-border'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{record.rfq_id}</span>
                        {record.verified_by_ai ? (
                          <Badge className="bg-emerald-600 text-white">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Baseline</p>
                        <p className="font-medium">{formatCurrency(record.baseline_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Final</p>
                        <p className="font-medium">{formatCurrency(record.final_price)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saved</p>
                        <p className="font-medium text-emerald-600">
                          {formatCurrency(record.net_savings)} ({record.savings_percentage}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Reward Types - Only show when enabled */}
        {rewardsEnabled && (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Available Reward Formats</CardTitle>
              <CardDescription className="text-purple-700">
                Funded by your organisation's incentive budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Amazon Vouchers',
                  'Flipkart Vouchers',
                  'Travel Vouchers',
                  'Insurance Benefits',
                  'Wellness Benefits',
                  'Skill Certifications',
                ].map((reward) => (
                  <Badge
                    key={reward}
                    variant="outline"
                    className="py-2 justify-center text-purple-700 border-purple-300"
                  >
                    {reward}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legal Disclaimer */}
        <LegalDisclaimer />
      </div>
    </TooltipProvider>
  );
}

export default SavingsTracker;
