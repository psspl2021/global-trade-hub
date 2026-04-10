/**
 * Transporter Dashboard Page
 * Accessible at /transporter — for users with 'transporter' role
 */
import { TransporterDashboard } from '@/components/transporter/TransporterDashboard';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TransporterPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Global Fleet Transportation</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <TransporterDashboard />
      </main>
    </div>
  );
}
