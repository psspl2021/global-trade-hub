import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Gavel, FileText, ScrollText } from 'lucide-react';
import { Link } from 'react-router-dom';

const items = [
  {
    to: '/governance/ceo/purchase-orders',
    icon: ClipboardCheck,
    title: 'Purchase Orders',
    desc: 'Approve, override, and acknowledge POs across the company.',
  },
  {
    to: '/governance/ceo/auctions',
    icon: Gavel,
    title: 'Live Auctions',
    desc: 'Full leaderboard with un-anonymized supplier identities. Read-only.',
  },
  {
    to: '/governance/ceo/rfq',
    icon: FileText,
    title: 'Forward RFQs',
    desc: 'All supplier quotes, variance, and selection justification.',
  },
  {
    to: '/governance/ceo/audit-log',
    icon: ScrollText,
    title: 'Audit Log',
    desc: 'Every elevated action you and your team have taken.',
  },
];

export default function CEOOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((it) => (
        <Link key={it.to} to={it.to} className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <it.icon className="h-5 w-5 text-primary" />
                {it.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{it.desc}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
