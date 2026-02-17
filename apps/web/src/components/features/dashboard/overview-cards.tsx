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
        <Card className="relative h-full overflow-hidden bg-card border-border/40 rounded-3xl p-5 flex flex-col justify-between shadow-sm group">
            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/10">
                        <Heart className="h-4.5 w-4.5 fill-current" />
                    </div>
                    <div className="space-y-0">
                        <p className="text-sm font-bold tracking-wider text-rose-600/80">Lifetime Giving</p>
                        <p className="text-xs font-medium text-muted-foreground">Global Impact</p>
                    </div>
                </div>
                <Link href="/dashboard/history">
                    <div className="h-8 w-8 flex items-center justify-center rounded-3xl bg-muted/50 text-muted-foreground hover:bg-rose-500 hover:text-white transition-all border border-border/50">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                </Link>
            </div>

            <div className="relative z-10 mt-4">
                <h3 className="font-bold text-foreground tracking-tight text-3xl md:text-4xl">
                    <SmartCurrency amount={value} currency="NGN" visible={true} />
                </h3>
            </div>

            <div className="relative z-10 mt-auto pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-3xl bg-muted/30 border border-border/50">
                        <Activity className="h-3 w-3 text-rose-500" />
                        <span className="text-xs font-bold text-foreground">{subValue} Donations</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground/50  tracking-widest">Verified</span>
                </div>
            </div>
        </Card>
    );
};

export function OverviewCards({ wallet, totalImpact, donationCount }: OverviewCardsProps) {
    return (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 xl:col-span-8 min-h-[200px] md:h-[220px]">
                <WalletCard balance={wallet.balance} currency={wallet.currency} />
            </div>

            <div className="lg:col-span-5 xl:col-span-4 min-h-[200px] md:h-[220px]">
                <ImpactStatCard
                    value={totalImpact}
                    subValue={donationCount}
                />
            </div>
        </div>
    );
}