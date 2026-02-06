/**
 * ============================================================
 * BILLING HISTORY (ADMIN VIEW)
 * ============================================================
 * 
 * Shows quarterly billing history with invoice status.
 * Only visible to admins.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileText, 
  CheckCircle2, 
  Clock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { BillingQuarter } from '@/hooks/useEnterpriseBilling';
import { cn } from '@/lib/utils';

interface BillingHistoryProps {
  history: BillingQuarter[];
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const getStatusBadge = (status: string, isOnboarding: boolean) => {
  if (isOnboarding) {
    return (
      <Badge className="bg-emerald-600 text-white">
        <Gift className="w-3 h-3 mr-1" />
        Free Quarter
      </Badge>
    );
  }

  switch (status) {
    case 'paid':
      return (
        <Badge className="bg-emerald-600 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      );
    case 'generated':
      return (
        <Badge variant="secondary">
          <FileText className="w-3 h-3 mr-1" />
          Invoice Generated
        </Badge>
      );
    case 'waived':
      return (
        <Badge variant="outline">
          <Gift className="w-3 h-3 mr-1" />
          Waived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
  }
};

export function BillingHistory({ history, isLoading }: BillingHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading billing history...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Billing History
        </CardTitle>
        <CardDescription>
          Quarterly governance fees and invoice status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-sm mt-1">
              Billing records will appear after the onboarding period
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Domestic Volume</TableHead>
                  <TableHead>Import/Export Volume</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((quarter) => (
                  <TableRow key={quarter.id}>
                    <TableCell className="font-medium">
                      {new Date(quarter.quarter_start).toLocaleDateString('en-IN', { 
                        month: 'short',
                        year: 'numeric'
                      })} - {new Date(quarter.quarter_end).toLocaleDateString('en-IN', { 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(quarter.domestic_volume)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(quarter.import_export_volume)}
                    </TableCell>
                    <TableCell className={cn(
                      "font-semibold",
                      quarter.is_onboarding_quarter ? "text-emerald-600" : ""
                    )}>
                      {quarter.is_onboarding_quarter 
                        ? "₹0 (Free)" 
                        : formatCurrency(quarter.total_fee)
                      }
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(quarter.invoice_status, quarter.is_onboarding_quarter)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default BillingHistory;
