'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowUpRight, Activity } from 'lucide-react';
import { Card } from '../../ui/card';
import { WalletCard } from '../wallet/wallet-card';
import { SmartCurrency } from '../../ui/smart-currency';
import { OverviewCardsProps } from '../../../types';

const ImpactStatCard = ({ value, subValue }: { value: string; subValue: number }) => {
    return (
        <Card className="relative h-full overflow-hidden bg-card border-border/50 rounded-[30px] p-6 flex flex-col justify-between shadow-xl group">
            {/* Subtle Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/40 via-transparent to-transparent" />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm">
                        <Heart className="h-5 w-5 fill-current" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600/70">Impact Pulse</p>
                        <p className="text-xs font-bold text-muted-foreground">Lifetime Giving</p>
                    </div>
                </div>
                <Link href="/dashboard/history">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-rose-500 hover:text-white transition-all cursor-pointer border border-border/50">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </Link>
            </div>

            <div className="relative z-10 mt-6 mb-8">
                <h3 className="font-black text-foreground tracking-tighter text-4xl">
                    <SmartCurrency amount={value} currency="NGN" visible={true} />
                </h3>
            </div>

            <div className="relative z-10 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/50 shadow-inner">
                        <Activity className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-[10px] font-black text-foreground uppercase tracking-tight">{subValue} Donations</span>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase italic opacity-40 tracking-wider">Givar Ledger</span>
                </div>
            </div>
        </Card>
    );
};

export function OverviewCards({ wallet, totalImpact, donationCount }: OverviewCardsProps) {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            {/* Compact Height restricted to 240px */}
            <div className="lg:col-span-7 xl:col-span-8 h-[240px]">
                <WalletCard balance={wallet.balance} currency={wallet.currency} />
            </div>

            <div className="lg:col-span-5 xl:col-span-4 h-[240px]">
                <ImpactStatCard
                    value={totalImpact}
                    subValue={donationCount}
                />
            </div>
        </div>
    );
}