/**
 * ============================================================
 * ONBOARDING BANNER
 * ============================================================
 * 
 * Shows during Q1 free onboarding period.
 * Displays: "First Quarter Free — Platform charges apply only after 
 * verified savings are established."
 */

import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface OnboardingBannerProps {
  daysRemaining: number;
  totalDays?: number;
  onboardingEndDate?: string;
}

export function OnboardingBanner({ 
  daysRemaining, 
  totalDays = 90,
  onboardingEndDate 
}: OnboardingBannerProps) {
  const progressPercent = ((totalDays - daysRemaining) / totalDays) * 100;

  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
      <CardContent className="py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-emerald-900">
                  First Quarter Free
                </h3>
                <Badge className="bg-emerald-600 text-white">
                  Onboarding
                </Badge>
              </div>
              <p className="text-sm text-emerald-700">
                Platform charges apply only after verified savings are established.
              </p>
              
              {/* Progress Indicator */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-medium">
                    Onboarding Progress
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    {daysRemaining} days remaining
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-emerald-100" />
              </div>

              {/* AI Tracking Notice */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>AI tracking transacted value</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verifying savings</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Building performance metrics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Days Counter */}
          <div className="text-center bg-white/80 rounded-xl p-4 border border-emerald-200 shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">Ends</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {daysRemaining}
            </p>
            <p className="text-xs text-emerald-600">days left</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OnboardingBanner;
