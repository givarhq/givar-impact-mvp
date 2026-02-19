'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';

interface PortfolioItem {
    id: string;
    amount: string;
    currency: string;
    project: {
        title: string;
        slug: string;
        imageUrl: string | null;
        targetAmount: string;
        raisedAmount: string;
        currency: string;
        status: string;
    };
}

export const ImpactPortfolio = memo(function ImpactPortfolio({ items }: { items: PortfolioItem[] }) {
    if (items.length === 0) return null;

    return (
        <Card className="flex flex-col overflow-hidden border-border/40 rounded-3xl bg-card shadow-sm h-full">
            <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Your Impact Portfolio
                    </CardTitle>
                    <Link
                        href="/dashboard/history"
                        className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-3xl border border-border/50"
                    >
                        History <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </CardHeader>

            <div className="p-2 space-y-1 overflow-y-auto no-scrollbar max-h-[300px]">
                <AnimatePresence>
                    {items.map((item, index) => {
                        const raised = Number(item.project.raisedAmount);
                        const target = Number(item.project.targetAmount);
                        const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
                        const isFunded = percent >= 100;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    href={`/dashboard/impact/${item.project.slug}`}
                                    className="group block"
                                >
                                    <div className="relative overflow-hidden rounded-3xl hover:bg-muted/40 p-3 transition-all duration-200">
                                        <div className="flex items-center gap-4">
                                            {/* Compact Thumbnail */}
                                            <div className="h-11 w-11 rounded-3xl bg-muted overflow-hidden shrink-0 border border-border/50 relative">
                                                {item.project.imageUrl ? (
                                                    <img src={item.project.imageUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full bg-primary/5" />
                                                )}
                                                {isFunded && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                        {item.project.title}
                                                    </h4>
                                                    <span className="text-xs font-bold text-primary tabular-nums">
                                                        {percent.toFixed(0)}%
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                        <span>Contribution:</span>
                                                        <span className="text-foreground font-bold">
                                                            <SmartCurrency
                                                                amount={item.amount}
                                                                currency={item.currency}
                                                                visible={true}
                                                                size="small"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percent}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className="h-full bg-primary"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </Card>
    );
});