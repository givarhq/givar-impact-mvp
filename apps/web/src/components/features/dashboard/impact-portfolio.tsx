'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils/cn';

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

            <div className="p-2 space-y-2">
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
                                    className="group block relative overflow-hidden rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all duration-200"
                                >
                                    <div className="flex h-20 sm:h-24">
                                        {/* Left: Visual */}
                                        <div className="relative w-20 sm:w-24 shrink-0 bg-muted border-r border-border/40 overflow-hidden">
                                            {item.project.imageUrl ? (
                                                <Image
                                                    src={item.project.imageUrl}
                                                    alt=""
                                                    fill
                                                    sizes="96px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-primary/5" />
                                            )}
                                            {isFunded && (
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                                    {item.project.title}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                    <span>You Gave:</span>
                                                    <span className="text-foreground font-bold">
                                                        <SmartCurrency
                                                            amount={item.amount}
                                                            currency={item.currency}
                                                            visible={true}
                                                            size="small"
                                                        />
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 w-full">
                                                <div className="flex justify-between items-end text-[10px] font-bold">
                                                    <span className={isFunded ? "text-emerald-600" : "text-muted-foreground"}>
                                                        {isFunded ? 'Goal Met' : 'Project Goal'}
                                                    </span>
                                                    <span className="text-primary">{percent.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            isFunded ? "bg-emerald-500" : "bg-primary"
                                                        )}
                                                    />
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