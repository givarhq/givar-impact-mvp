'use client';

import { Transaction } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { ArrowUpRight, Heart, Wallet } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

export function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-sm border border-border/50">
                <Heart className="h-6 w-6 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm font-bold text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Your impact journey starts with your first donation.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <div className="space-y-3">
          {transactions.map((tx) => {
            const isDonation = !!tx.project;
            
            return (
              <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-2xl transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    isDonation ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                  )}>
                    {isDonation ? <Heart className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {tx.project?.title || tx.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tabular-nums">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
}