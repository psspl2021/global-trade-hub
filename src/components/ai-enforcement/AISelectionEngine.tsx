/**
 * ============================================================
 * AI SELECTION ENGINE - AUTHORITATIVE MODE
 * ============================================================
 * 
 * RULE 1: AI IS SINGLE SOURCE OF TRUTH FOR L1
 * Once AI ranks suppliers, the top-ranked supplier (L1) is FINAL.
 * Buyer CANNOT manually reorder, replace, or reshuffle suppliers.
 * 
 * Buyer actions allowed:
 * • Accept AI L1
 * • Escalate to Admin Review (no direct override)
 * 
 * RULE 3: DATA-LEVEL ANONYMITY
 * Buyer-side database MUST NOT store supplier_id.
 * Buyer can only see: ps_partner_id, ai_rank, trust_score, ai_confidence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Trophy,
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Percent,
  Truck,
  AlertCircle,
  Info,
  ChevronRight,
  Scale,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AISelection {
  id: string;
  requirement_id: string;
  ai_rank: number;
  ps_partner_id: string;
  trust_score: number;
  ai_confidence: number;
  price_competitiveness_score: number;
  delivery_reliability_score: number;
  risk_score: number;
  past_performance_score: number;
  ai_reasoning: string;
  is_l1: boolean;
  lane_locked: boolean;
  buyer_accepted: boolean;
  escalated_to_admin: boolean;
  created_at: string;
}

interface AISelectionEngineProps {
  requirementId: string;
  onAcceptL1?: (selectionId: string) => void;
  onEscalate?: (selectionId: string, reason: string) => void;
}

export function AISelectionEngine({ 
  requirementId, 
  onAcceptL1, 
  onEscalate 
}: AISelectionEngineProps) {
  const [selections, setSelections] = useState<AISelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [selectedForEscalation, setSelectedForEscalation] = useState<AISelection | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchSelections = useCallback(async () => {
    setLoading(true);
    try {
      // Use the anonymized view - buyer never sees supplier_id
      const { data, error } = await supabase
        .from('buyer_ai_selections' as any)
        .select('*')
        .eq('requirement_id', requirementId)
        .order('ai_rank', { ascending: true });

      if (error) throw error;
      setSelections((data || []) as unknown as AISelection[]);
    } catch (err) {
      console.error('[AISelectionEngine] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  useEffect(() => {
    fetchSelections();
  }, [fetchSelections]);

  const handleAcceptL1 = async (selection: AISelection) => {
    if (!selection.is_l1) {
      toast.error('Only L1 (top-ranked) supplier can be accepted');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('ai_l1_selections' as any)
        .update({ buyer_accepted: true })
        .eq('id', selection.id);

      if (error) throw error;
      
      toast.success('L1 Selection Accepted', {
        description: 'AI-verified partner has been confirmed for this RFQ'
      });
      
      onAcceptL1?.(selection.id);
      fetchSelections();
    } catch (err) {
      console.error('[AISelectionEngine] Accept error:', err);
      toast.error('Failed to accept L1 selection');
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedForEscalation || !escalationReason.trim()) {
      toast.error('Please provide a reason for escalation');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('ai_l1_selections' as any)
        .update({ 
          escalated_to_admin: true,
          escalation_reason: escalationReason 
        })
        .eq('id', selectedForEscalation.id);

      if (error) throw error;
      
      toast.success('Escalated to Admin Review', {
        description: 'Your concern has been submitted for review'
      });
      
      onEscalate?.(selectedForEscalation.id, escalationReason);
      setShowEscalateDialog(false);
      setEscalationReason('');
      setSelectedForEscalation(null);
      fetchSelections();
    } catch (err) {
      console.error('[AISelectionEngine] Escalation error:', err);
      toast.error('Failed to escalate');
    } finally {
      setProcessing(false);
    }
  };

  const l1Selection = selections.find(s => s.is_l1);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="w-6 h-6 mx-auto mb-2 animate-pulse" />
          Loading AI rankings...
        </CardContent>
      </Card>
    );
  }

  if (selections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No AI selections available for this RFQ</p>
          <p className="text-sm mt-1">AI will rank suppliers once bids are received</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Authoritative Badge */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  AI Selection Engine
                  <Badge className="bg-emerald-600 text-white">
                    <Lock className="w-3 h-3 mr-1" />
                    AUTHORITATIVE
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  AI rankings are final • Buyer cannot override
                </p>
              </div>
            </div>
            {l1Selection?.lane_locked && (
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                <Lock className="w-3 h-3 mr-1" />
                Lane Locked
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* L1 Selection Card */}
      {l1Selection && (
        <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Trophy className="w-5 h-5 text-amber-500" />
                AI L1 Selection (Final)
              </CardTitle>
              <Badge className="bg-emerald-600 text-white text-lg px-3">
                #{l1Selection.ai_rank}
              </Badge>
            </div>
            <CardDescription className="text-emerald-700">
              ProcureSaathi Verified Partner: {l1Selection.ps_partner_id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Confidence (MANDATORY - cannot be hidden) */}
            <div className="p-4 rounded-lg bg-white/80 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  AI Confidence
                </span>
                <span className="text-2xl font-bold text-emerald-700">
                  {l1Selection.ai_confidence.toFixed(0)}%
                </span>
              </div>
              <Progress value={l1Selection.ai_confidence} className="h-2" />
              
              {/* Score Breakdown (READ-ONLY) */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{l1Selection.price_competitiveness_score.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-medium">{l1Selection.delivery_reliability_score.toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-muted-foreground">Risk:</span>
                  <span className="font-medium">{(10 - l1Selection.risk_score).toFixed(1)}/10</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-muted-foreground">Performance:</span>
                  <span className="font-medium">{l1Selection.past_performance_score.toFixed(1)}/10</span>
                </div>
              </div>
            </div>

            {/* AI Reasoning (MANDATORY - cannot be hidden) */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">AI Reasoning</p>
                  <p className="text-xs text-blue-700 mt-1">{l1Selection.ai_reasoning}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {l1Selection.buyer_accepted ? (
                <Button disabled className="flex-1 bg-emerald-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Accepted
                </Button>
              ) : l1Selection.escalated_to_admin ? (
                <Button disabled variant="outline" className="flex-1">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Under Admin Review
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => handleAcceptL1(l1Selection)}
                    disabled={processing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Accept AI L1
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedForEscalation(l1Selection);
                      setShowEscalateDialog(true);
                    }}
                    disabled={processing}
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Runner-up Suppliers (READ-ONLY) */}
      {selections.filter(s => !s.is_l1).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="w-4 h-4" />
              Runner-up Partners (View Only)
            </CardTitle>
            <CardDescription>
              AI-ranked alternatives • Selection locked to L1
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {selections.filter(s => !s.is_l1).map((selection) => (
                  <div 
                    key={selection.id}
                    className={cn(
                      "p-3 rounded-lg border bg-muted/30",
                      selection.lane_locked && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg">
                          #{selection.ai_rank}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{selection.ps_partner_id}</p>
                          <p className="text-xs text-muted-foreground">
                            Trust: {selection.trust_score.toFixed(1)} • 
                            Confidence: {selection.ai_confidence.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {selection.lane_locked && (
                        <Badge variant="secondary">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* MANDATORY Legal Notice - AI Immutability Disclaimer */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
        <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          <strong>AI Governance Notice:</strong> AI rankings are data-driven, immutable, and final. 
          Buyer cannot manually override, reorder, or reshuffle supplier selection. 
          Escalation triggers admin review but does not guarantee reversal.
          All decisions are logged for audit compliance.
        </p>
      </div>

      {/* Additional AI Decision Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-blue-800">AI-Driven Procurement Governance</p>
          <p className="text-xs text-blue-700 mt-1">
            ProcureSaathi operates as a neutral governance layer. All supplier selections are 
            AI-verified based on price, delivery reliability, quality history, and risk factors. 
            This ensures transparent, auditable, and non-manipulable procurement decisions.
          </p>
        </div>
      </div>

      {/* Escalation Dialog */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Escalate to Admin Review
            </DialogTitle>
            <DialogDescription>
              Provide a reason for escalating the AI selection. This will be reviewed by the platform admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Escalation does not guarantee a change in the AI ranking. 
                The admin team will review your concern and respond within 24 hours.
              </p>
            </div>
            <Textarea
              placeholder="Explain your concern with the AI selection..."
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEscalate}
              disabled={processing || !escalationReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Submit Escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AISelectionEngine;
