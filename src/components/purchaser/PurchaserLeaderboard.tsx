/**
 * ============================================================
 * PURCHASER LEADERBOARD (CORPORATE VIEW)
 * ============================================================
 * 
 * Ego engine for ethical procurement:
 * - "Top Cost Optimizer – QX"
 * - "Most Efficient Buyer"
 * - "Zero Deviation Procurement Champion"
 * 
 * Visible to: Management, HR, Internal dashboards
 * NOT visible to: Suppliers
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  department: string;
  score: number;
  totalSavings: number;
  title?: string;
  badges: string[];
}

const leaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Amit Sharma',
    initials: 'AS',
    department: 'Procurement',
    score: 96,
    totalSavings: 4250000,
    title: 'Top Cost Optimizer – Q1',
    badges: ['Zero Deviation Champion', 'Perfect Compliance'],
  },
  {
    rank: 2,
    name: 'Priya Patel',
    initials: 'PP',
    department: 'Supply Chain',
    score: 92,
    totalSavings: 3800000,
    title: 'Most Efficient Buyer',
    badges: ['Fastest Turnaround'],
  },
  {
    rank: 3,
    name: 'Rahul Verma',
    initials: 'RV',
    department: 'Operations',
    score: 88,
    totalSavings: 3200000,
    badges: ['Audit Star'],
  },
  {
    rank: 4,
    name: 'Sneha Gupta',
    initials: 'SG',
    department: 'Procurement',
    score: 85,
    totalSavings: 2900000,
    badges: [],
  },
  {
    rank: 5,
    name: 'Vikram Singh',
    initials: 'VS',
    department: 'Sourcing',
    score: 82,
    totalSavings: 2500000,
    badges: [],
  },
];

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-slate-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-700" />;
    default:
      return <span className="text-muted-foreground font-bold">#{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    case 2:
      return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    case 3:
      return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    default:
      return 'bg-background border-border';
  }
};

export function PurchaserLeaderboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold">Corporate Leaderboard</h2>
              <p className="text-sm text-muted-foreground">
                Q1 2026 • Visible to Management & HR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4">
        {leaderboardData.slice(0, 3).map((entry, idx) => {
          const order = idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3';
          const height = idx === 0 ? 'h-32' : idx === 1 ? 'h-24' : 'h-20';
          
          return (
            <div key={entry.rank} className={cn('flex flex-col items-center', order)}>
              <Avatar className={cn(
                'mb-2',
                idx === 0 ? 'w-16 h-16 ring-4 ring-amber-400' : 'w-12 h-12'
              )}>
                <AvatarFallback className={cn(
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-slate-100 text-slate-700' :
                  'bg-orange-100 text-orange-700'
                )}>
                  {entry.initials}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm text-center">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.score} pts</p>
              <div className={cn(
                'w-full rounded-t-lg mt-2 flex items-end justify-center pb-2',
                height,
                idx === 0 ? 'bg-gradient-to-t from-amber-400 to-amber-300' :
                idx === 1 ? 'bg-gradient-to-t from-slate-400 to-slate-300' :
                'bg-gradient-to-t from-orange-400 to-orange-300'
              )}>
                {getRankIcon(entry.rank)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Full Rankings
          </CardTitle>
          <CardDescription>
            Based on AI-verified savings and efficiency metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {leaderboardData.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    getRankStyle(entry.rank)
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <Avatar>
                      <AvatarFallback>{entry.initials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.name}</span>
                        {entry.title && (
                          <Badge className="bg-primary text-primary-foreground">
                            {entry.title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.department}
                      </p>
                      {entry.badges.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {entry.badges.map((badge) => (
                            <Badge key={badge} variant="outline" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.score}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(entry.totalSavings)} saved
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            Rankings are based on AI-verified metrics. All incentives are white-money, 
            management-approved, and never linked to supplier payments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PurchaserLeaderboard;
