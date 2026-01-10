'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowUpRight, Sparkles } from 'lucide-react';
import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils/cn';
import { WalletCard } from '../wallet/wallet-card';

interface OverviewCardsProps {
  wallet: { balance: string; currency: string };
  totalImpact: string; 
  donationCount: number;
}

// Simple internal component for Read-Only stats (Impact, etc)
// We don't need the complex SmartCurrency logic for Impact yet, or we can duplicate/share it.
// For MVP speed, simple formatter here.
const ImpactStatCard = ({ value, subValue, theme }: any) => {
    // Basic formatting for impact
    const numeric = Number(value) / 100;
    const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(numeric);

    return (
        <div className={cn("group relative rounded-2xl p-[1px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br", theme.borderGradient)}>
            <Card className="relative h-full w-full overflow-hidden bg-card border-none rounded-2xl p-5 flex flex-col justify-between shadow-none min-h-[180px]">
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none", theme.innerGradient)} />
                <Heart className={cn("absolute -bottom-4 -right-4 h-32 w-32 opacity-5 pointer-events-none transition-transform group-hover:scale-110", theme.text)} />
                
                {/* Header */}
                <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-sm backdrop-blur-md bg-opacity-10", theme.iconBg, theme.text)}>
                            <Heart className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground leading-tight">Total Impact</p>
                            <p className="text-sm font-semibold text-foreground">Lifetime Contributions</p>
                        </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary cursor-pointer">
                        <Link href="/dashboard/impact" className="w-full h-full flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* Value */}
                <div className="relative z-10 mt-7">
                     <h3 className="font-bold text-foreground tracking-tighter text-3xl md:text-4xl truncate max-w-full">
                        {formatted}
                     </h3>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-7 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">
                            <Heart className="h-2.5 w-2.5 mr-1 fill-current" />
                            Live
                        </div>
                        <span className="text-xs text-muted-foreground">{subValue} contributions</span>
                     </div>
                </div>
            </Card>
        </div>
    );
};

export function OverviewCards({ wallet, totalImpact, donationCount }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      
      {/* 1. Wallet Balance (The Source of Truth) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2">
         {/* We wrap it to ensure it takes full height/width of grid cell */}
         <div className="h-full">
            <WalletCard balance={wallet.balance} currency={wallet.currency} />
         </div>
      </div>

      {/* 2. Total Impact (Read Only) */}
      <div className="col-span-1">
          <ImpactStatCard 
            value={totalImpact}
            subValue={donationCount}
            theme={{
                borderGradient: "from-rose-500/60 via-rose-500/10 to-transparent", 
                innerGradient: "from-rose-500/10 to-transparent",
                iconBg: "bg-rose-500",
                text: "text-rose-500",
            }}
          />
      </div>

    </div>
  );
}