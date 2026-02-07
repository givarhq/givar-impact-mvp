'use client';

import React from 'react';
import { OverviewCards } from './overview-cards';
import { ImpactPortfolio } from './impact-portfolio';
import { DashboardGoalClient } from '../goals/dashboard-goal-client';
import { Wallet, GivingGoal, Transaction } from '../../../types';

interface PortfolioViewProps {
    wallet: Wallet;
    history: Transaction[];
    activeGoal: GivingGoal | null;
}

export function PortfolioView({ wallet, history, activeGoal }: PortfolioViewProps) {
    const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
        return acc + BigInt(tx.amount || 0);
    }, 0n);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <OverviewCards
                wallet={wallet || { balance: '0', currency: 'NGN' }}
                totalImpact={totalImpactBigInt.toString()}
                donationCount={history?.length || 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ImpactPortfolio items={history as any || []} />
                </div>
                <div className="space-y-6">
                    <DashboardGoalClient initialGoal={activeGoal} />
                </div>
            </div>
        </div>
    );
}