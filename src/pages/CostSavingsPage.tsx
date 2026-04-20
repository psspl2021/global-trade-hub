/**
 * Cost Savings Full Page
 * Mobile-friendly dedicated page that renders the savings analytics expanded.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MonthlySavingsAnalytics } from '@/components/reverse-auction/MonthlySavingsAnalytics';

export default function CostSavingsPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-muted/30 pt-4 pb-16 px-4">
      <div className="container mx-auto max-w-7xl space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cost Savings</h1>
          <p className="text-sm text-muted-foreground">
            Procurement savings from Reverse Auctions — last 6 months
          </p>
        </div>
        <MonthlySavingsAnalytics defaultExpanded hideToggle />
      </div>
    </main>
  );
}
