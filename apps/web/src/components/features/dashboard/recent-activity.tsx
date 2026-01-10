'use client';

import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { ArrowUpRight, Heart } from 'lucide-react';

interface Transaction {
  id: string;
  amount: string;
  currency: string;
  project: {
    title: string;
    slug: string;
  };
  createdAt: string;
}

export function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
                Your impact journey starts with a single donation.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Recent Impact</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {transactions.map((tx, i) => (
            <div 
                key={tx.id} 
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {tx.project.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {formatCurrency(tx.amount, tx.currency)}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}