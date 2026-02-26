'use client';

import { useState, memo } from 'react';
import { ShieldCheck, TrendingUp, Users, AlertCircle, ArrowRight, X, Copy, Check } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface TransparencyCardProps {
    project: Project & { donorCount?: number };
}

export const TransparencyCard = memo(function TransparencyCard({ project }: TransparencyCardProps) {
    const raised = BigInt(project.raisedAmount || '0');
    const target = BigInt(project.targetAmount || '0');

    const remaining = raised >= target ? 0n : target - raised;

    const percent = target > 0n
        ? Number((raised * 100n) / target)
        : 0;

    const barWidth = Math.min(100, percent);

    const [expandedCard, setExpandedCard] = useState<'goal' | 'remaining' | null>(null);
    const [copied, setCopied] = useState(false);

    const toggleExpand = (card: 'goal' | 'remaining') => {
        setExpandedCard(prev => prev === card ? null : card);
    };

    const copyIdToClipboard = () => {
        navigator.clipboard.writeText(project.slug);
        setCopied(true);
        toast.success("Project ID copied");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="relative overflow-hidden bg-card border-border/40 rounded-3xl p-5 shadow-sm">
            {/* Header Context */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-3xl border border-emerald-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tracking-tight">Verified budget</span>
                </div>

                <button
                    onClick={copyIdToClipboard}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors group/copy outline-none"
                >
                    <span>id: {project.slug.slice(0, 8)}...</span>
                    {copied ? (
                        <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in" />
                    ) : (
                        <Copy className="h-3 w-3 opacity-30 group-hover/copy:opacity-100 transition-opacity" />
                    )}
                </button>
            </div>

            {/* Primary Metrics */}
            <div className="space-y-1 mb-5">
                <p className="text-xs font-medium text-muted-foreground">Total raised</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        <SmartCurrency amount={raised.toString()} currency={project.currency} visible={true} size="default" />
                    </h3>
                </div>
            </div>

            {/* Progress Architecture */}
            <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold">
                    <span className="text-primary">{percent}% funded</span>
                    <span className="text-muted-foreground">Target</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-3xl overflow-hidden p-0.5 border border-border/40">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary rounded-3xl shadow-sm"
                    />
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 relative">
                <AnimatePresence>
                    {/* Goal Insight */}
                    {(expandedCard === null || expandedCard === 'goal') && (
                        <motion.div
                            layout
                            onClick={() => toggleExpand('goal')}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "p-3 rounded-3xl bg-muted/20 border border-border/40 cursor-pointer hover:bg-muted/40 select-none",
                                expandedCard === 'goal' ? "col-span-2 border-primary/30 bg-primary/5" : "col-span-1"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-bold text-muted-foreground ">Goal</span>
                                </div>
                                {expandedCard === 'goal' && <X className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className={cn("font-bold text-sm text-foreground", expandedCard !== 'goal' && "truncate")}>
                                <SmartCurrency
                                    amount={target.toString()}
                                    currency={project.currency}
                                    visible={true}
                                    size="small"
                                />
                            </p>
                        </motion.div>
                    )}

                    {/* Remaining Insight */}
                    {(expandedCard === null || expandedCard === 'remaining') && (
                        <motion.div
                            layout
                            onClick={() => toggleExpand('remaining')}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "p-3 rounded-3xl bg-muted/20 border border-border/40 cursor-pointer hover:bg-muted/40 select-none",
                                expandedCard === 'remaining' ? "col-span-2 border-amber-300/40 bg-amber-50" : "col-span-1"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                    <span className="text-xs font-bold text-muted-foreground ">Remaining</span>
                                </div>
                                {expandedCard === 'remaining' && <X className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className={cn("font-bold text-sm text-amber-700", expandedCard !== 'remaining' && "truncate")}>
                                <SmartCurrency
                                    amount={remaining.toString()}
                                    currency={project.currency}
                                    visible={true}
                                    size="small"
                                />
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Donor Distribution */}
                <motion.div layout className="col-span-2 p-3 rounded-3xl bg-muted/20 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-bold text-muted-foreground ">Donors</span>
                    </div>
                    <p className="font-bold text-sm text-foreground">{project.donorCount || 0}</p>
                </motion.div>
            </div>

            {/* Ledger Navigation */}
            <Link href={`/dashboard/history?search=${encodeURIComponent(project.title)}`}>
                <Button variant="outline" className="w-full rounded-3xl border-border/60 hover:bg-muted text-xs h-10 font-bold gap-2 active:scale-95 transition-all">
                    View public records <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </Link>
        </Card>
    );
});