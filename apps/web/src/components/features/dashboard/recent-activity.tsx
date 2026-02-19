'use client';

import React, { memo } from 'react';
import { Transaction } from '../../../types';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { ArrowUpRight, Heart, Wallet } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export const RecentActivity = memo(function RecentActivity({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="border-border/40 bg-muted/20 rounded-3xl">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-10 w-10 rounded-3xl bg-background flex items-center justify-center mb-3 shadow-sm border border-border/50">
            <Heart className="h-5 w-5 text-muted-foreground opacity-40" />
          </div>
          <p className="text-sm font-bold text-foreground">No Recent Activity</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
            Your impact journey starts with your first donation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col overflow-hidden border-border/40 rounded-3xl bg-card shadow-sm">
      <CardHeader className="p-5 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          Recent Activity
        </CardTitle>
      </CardHeader>

      <div className="p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {transactions.map((tx, index) => {
            const isDonation = !!tx.project;

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div
                  className="flex items-center justify-between p-3 rounded-3xl transition-all hover:bg-muted/40 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-3xl transition-colors shrink-0",
                      isDonation ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                    )}>
                      {isDonation ? <Heart className="h-4.5 w-4.5" /> : <Wallet className="h-4.5 w-4.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {tx.project?.title || tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium tracking-tight">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-4 shrink-0">
                    <span className="font-bold text-xs tabular-nums text-foreground">
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
});