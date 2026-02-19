'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { OverviewCards } from './overview-cards';
import { ImpactPortfolio } from './impact-portfolio';
import { DashboardGoalClient } from '../goals/dashboard-goal-client';
import { Wallet, GivingGoal, Transaction } from '../../../types';

interface PortfolioViewProps {
    wallet: Wallet;
    history: Transaction[];
    activeGoal: GivingGoal | null;
}

export const PortfolioView = memo(function PortfolioView({ wallet, history, activeGoal }: PortfolioViewProps) {
    const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
        return acc + BigInt(tx.amount || 0);
    }, 0n);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 md:space-y-8"
        >
            <OverviewCards
                wallet={wallet || { balance: '0', currency: 'NGN' }}
                totalImpact={totalImpactBigInt.toString()}
                donationCount={history?.length || 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2">
                    <ImpactPortfolio items={history as any || []} />
                </div>
                <div className="space-y-4">
                    <DashboardGoalClient initialGoal={activeGoal} />
                </div>
            </div>
        </motion.div>
    );
});