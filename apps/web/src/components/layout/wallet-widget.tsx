'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { SmartCurrency } from '../ui/smart-currency';
import { ApiService } from '../../services/api';

export function WalletWidget() {
    const [data, setData] = useState<{ balance: string, currency: string } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        ApiService.wallet.get()
            .then(setData)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="h-10 w-44 bg-muted/30 animate-pulse rounded-[20px] border border-border/50" />
        );
    }

    return (
        <div className="flex items-center gap-1.5 bg-accent border border-border/40 rounded-[22px] p-1 pl-1.5 pr-2.5 shadow-sm hover:shadow-md transition-all group h-10">
            {/* Action: Fund */}
            <Link href="/dashboard/wallet/fund">
                <button
                    title="Add Funds"
                    className="h-7 w-7 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
                >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                </button>
            </Link>

            {/* Balance Display Area - Fixed width to prevent layout jump */}
            <div className="flex items-center px-2 pt-1 min-w-[120px] justify-between">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold tracking-[0.15em] text-foreground/80 leading-none mb-0.5">
                        Wallet
                    </span>
                    <div className="h-5 flex items-center">
                        {isVisible ? (
                            <SmartCurrency
                                amount={data?.balance || '0'}
                                currency={data?.currency || 'NGN'}
                                visible={true}
                                size="small"
                                className="text-foreground/80"
                            />
                        ) : (
                            <span className="text-lg font-bold tracking-[0.2em] text-muted-foreground/40 leading-none select-none">
                                ••••
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="ml-3 text-muted-foreground/30 hover:text-primary transition-colors focus:outline-none"
                    aria-label={isVisible ? "Hide balance" : "Show balance"}
                >
                    {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
            </div>

            <div className="h-5 w-px bg-border/60 mx-1" />

            {/* Action: History */}
            <Link href="/dashboard/history">
                <button
                    title="Transaction History"
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                >
                    <ArrowUpRight className="h-4 w-4" />
                </button>
            </Link>
        </div>
    );
}