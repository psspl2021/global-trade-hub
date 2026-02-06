/**
 * ============================================================
 * SAVINGS SOURCE OF TRUTH (MANAGEMENT VIEW)
 * ============================================================
 * 
 * Primary metric: "Total AI-Verified Savings"
 * Source ONLY from immutable savings table
 * 
 * Displays:
 * - Baseline Price vs Final Price
 * - Category-wise savings
 * - Purchaser-wise contribution
 * 
 * STRICT: Suppliers NEVER see this data
 */

import { useState } from 'react';
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
  TrendingUp, 
  CheckCircle2, 
  BarChart3,
  Users,
  IndianRupee,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { GovernanceLegalArmor } from './GovernanceLegalArmor';
import { cn } from '@/lib/utils';

interface SavingsRecord {
  id: string;
  purchaser_name: string;
  category: string;
  baseline_price: number;
  final_price: number;
  net_savings: number;
  savings_percentage: number;
  verified_at: string;
}

// Sample data for demonstration
const sampleSavings: SavingsRecord[] = [
  {
    id: '1',
    purchaser_name: 'Rajesh Kumar',
    category: 'Raw Materials',
    baseline_price: 1250000,
    final_price: 1087500,
    net_savings: 162500,
    savings_percentage: 13,
    verified_at: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    purchaser_name: 'Priya Sharma',
    category: 'Equipment',
    baseline_price: 850000,
    final_price: 765000,
    net_savings: 85000,
    savings_percentage: 10,
    verified_at: '2026-01-20T14:30:00Z',
  },
  {
    id: '3',
    purchaser_name: 'Amit Patel',
    category: 'Services',
    baseline_price: 2100000,
    final_price: 1890000,
    net_savings: 210000,
    savings_percentage: 10,
    verified_at: '2026-01-25T09:15:00Z',
  },
  {
    id: '4',
    purchaser_name: 'Sneha Reddy',
    category: 'Packaging',
    baseline_price: 450000,
    final_price: 382500,
    net_savings: 67500,
    savings_percentage: 15,
    verified_at: '2026-01-28T11:00:00Z',
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

export function SavingsSourceOfTruth() {
  const [savings] = useState<SavingsRecord[]>(sampleSavings);

  // Calculate totals
  const totalSavings = savings.reduce((sum, s) => sum + s.net_savings, 0);
  const totalBaseline = savings.reduce((sum, s) => sum + s.baseline_price, 0);
  const averageSavingsPercent = totalBaseline > 0 
    ? ((totalSavings / totalBaseline) * 100).toFixed(1) 
    : '0';

  // Category-wise breakdown
  const categoryBreakdown = savings.reduce((acc, s) => {
    if (!acc[s.category]) {
      acc[s.category] = { savings: 0, count: 0 };
    }
    acc[s.category].savings += s.net_savings;
    acc[s.category].count += 1;
    return acc;
  }, {} as Record<string, { savings: number; count: number }>);

  // Purchaser-wise breakdown
  const purchaserBreakdown = savings.reduce((acc, s) => {
    if (!acc[s.purchaser_name]) {
      acc[s.purchaser_name] = { savings: 0, count: 0 };
    }
    acc[s.purchaser_name].savings += s.net_savings;
    acc[s.purchaser_name].count += 1;
    return acc;
  }, {} as Record<string, { savings: number; count: number }>);

  return (
    <div className="space-y-6">
      {/* Primary Metric */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-emerald-600">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-medium">
                  Total AI-Verified Savings
                </p>
                <p className="text-4xl font-bold text-emerald-800">
                  {formatCurrency(totalSavings)}
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  {averageSavingsPercent}% average savings rate
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Verified
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <IndianRupee className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalBaseline)}</p>
              <p className="text-xs text-muted-foreground">Total Baseline</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{savings.length}</p>
              <p className="text-xs text-muted-foreground">Verified RFQs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {Object.keys(categoryBreakdown).length}
              </p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-amber-700">
                {Object.keys(purchaserBreakdown).length}
              </p>
              <p className="text-xs text-muted-foreground">Purchasers</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category-wise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Category-wise Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1].savings - a[1].savings)
                .map(([category, data]) => (
                  <div 
                    key={category}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} RFQ{data.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(data.savings)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchaser-wise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Purchaser Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(purchaserBreakdown)
                .sort((a, b) => b[1].savings - a[1].savings)
                .map(([name, data]) => (
                  <div 
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} RFQ{data.count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(data.savings)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Baseline vs Final Price
          </CardTitle>
          <CardDescription>
            AI-verified savings records (immutable source of truth)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchaser</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Baseline</TableHead>
                  <TableHead>Final</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savings.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.purchaser_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.category}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(record.baseline_price)}</TableCell>
                    <TableCell>{formatCurrency(record.final_price)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {formatCurrency(record.net_savings)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        {record.savings_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(record.verified_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legal Armor */}
      <GovernanceLegalArmor variant="footer" />
    </div>
  );
}

export default SavingsSourceOfTruth;
