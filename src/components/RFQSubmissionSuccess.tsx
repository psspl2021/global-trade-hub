import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Clock, Users, Shield, Lock, 
  ArrowRight, Sparkles, Building, Eye, EyeOff,
  Bell, FileText
} from 'lucide-react';

interface RFQSubmissionSuccessProps {
  requirementId?: string;
  requirementTitle: string;
  isFromSignalPage?: boolean;
  onViewDashboard?: () => void;
}

export function RFQSubmissionSuccess({
  requirementId,
  requirementTitle,
  isFromSignalPage = false,
  onViewDashboard
}: RFQSubmissionSuccessProps) {
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [matchingPhase, setMatchingPhase] = useState<'analyzing' | 'matching' | 'sending' | 'complete'>('analyzing');

  useEffect(() => {
    // Simulate matching progress animation
    const phases = [
      { progress: 25, phase: 'analyzing' as const, delay: 800 },
      { progress: 60, phase: 'matching' as const, delay: 1600 },
      { progress: 90, phase: 'sending' as const, delay: 2400 },
      { progress: 100, phase: 'complete' as const, delay: 3200 },
    ];

    phases.forEach(({ progress, phase, delay }) => {
      setTimeout(() => {
        setMatchingProgress(progress);
        setMatchingPhase(phase);
      }, delay);
    });
  }, []);

  const phaseLabels = {
    analyzing: 'Analyzing your requirement...',
    matching: 'Matching with verified suppliers...',
    sending: 'Sending to relevant suppliers...',
    complete: 'Suppliers notified! Quotes incoming.'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">RFQ Submitted Successfully!</h1>
        <p className="text-muted-foreground">
          {requirementTitle}
        </p>
      </div>

      {/* Matching Progress Card */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">AI Supplier Matching</span>
            {matchingPhase === 'complete' && (
              <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700">
                Complete
              </Badge>
            )}
          </div>

          <Progress value={matchingProgress} className="h-2 mb-3" />
          
          <p className="text-sm text-muted-foreground">
            {phaseLabels[matchingPhase]}
          </p>
        </CardContent>
      </Card>

      {/* Signal Page - Privacy Notice */}
      {isFromSignalPage && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                <Lock className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Your Identity is Protected
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Suppliers will see your requirement details but <strong>not your contact information</strong>. 
                  You control when and which suppliers can see your details.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="bg-white dark:bg-green-900/30 text-green-700 border-green-300">
                    <EyeOff className="h-3 w-3 mr-1" /> Name Hidden
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-green-900/30 text-green-700 border-green-300">
                    <EyeOff className="h-3 w-3 mr-1" /> Phone Hidden
                  </Badge>
                  <Badge variant="outline" className="bg-white dark:bg-green-900/30 text-green-700 border-green-300">
                    <EyeOff className="h-3 w-3 mr-1" /> Email Hidden
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            What Happens Next?
          </h3>
          <div className="space-y-4">
            {[
              {
                icon: Users,
                title: 'Suppliers Review Your RFQ',
                description: 'Verified suppliers matching your category will receive your requirement',
                time: 'Within minutes'
              },
              {
                icon: FileText,
                title: 'Quotes Start Coming In',
                description: 'Suppliers will submit competitive quotes with pricing and terms',
                time: 'Within 24-48 hours'
              },
              {
                icon: Bell,
                title: 'Get Notified',
                description: "We'll notify you via email when quotes are ready for review",
                time: 'Real-time updates'
              },
              {
                icon: isFromSignalPage ? Eye : Building,
                title: isFromSignalPage ? 'Choose to Reveal Contact' : 'Close the Deal',
                description: isFromSignalPage 
                  ? 'Review quotes anonymously, then reveal your contact to preferred suppliers'
                  : 'Compare quotes, negotiate, and close with the best supplier',
                time: 'When ready'
              }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-muted">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.title}</span>
                    <span className="text-xs text-muted-foreground">{step.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Verified Suppliers Only</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600" />
          <span>Secure Platform</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI-Powered Matching</span>
        </div>
      </div>

      {/* CTA */}
      {onViewDashboard && (
        <div className="text-center">
          <Button onClick={onViewDashboard} size="lg" className="gap-2">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
