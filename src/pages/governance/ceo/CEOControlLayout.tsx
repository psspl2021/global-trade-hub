import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Gavel, FileText, ClipboardCheck, ScrollText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/governance/ceo', label: 'Overview', icon: ShieldCheck, end: true },
  { to: '/governance/ceo/purchase-orders', label: 'Purchase Orders', icon: ClipboardCheck },
  { to: '/governance/ceo/auctions', label: 'Auctions', icon: Gavel },
  { to: '/governance/ceo/rfq', label: 'Forward RFQs', icon: FileText },
  { to: '/governance/ceo/audit-log', label: 'Audit Log', icon: ScrollText },
];

export default function CEOControlLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2 -ml-2 h-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            Executive Control Layer
          </div>
          <h1 className="text-2xl font-semibold mt-1">CEO Governance</h1>
          <p className="text-sm text-muted-foreground">
            Read-only oversight + override authority. All sensitive actions are logged.
          </p>
        </div>
        <div className="container max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-primary text-foreground font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
