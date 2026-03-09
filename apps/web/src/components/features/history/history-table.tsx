'use client';

import React, { useState, memo } from 'react';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Copy,
    ShieldCheck,
    FileText,
    Calendar,
    ExternalLink,
    Download,
    Loader2,
    CreditCard,
    Wallet
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Transaction, TxStatus, TxType } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { SmartCurrency } from '../../ui/smart-currency';
import { Button } from '../../ui/button';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { generateImpactReceipt } from '../../../lib/utils/receipt-generator';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../ui/badge';

const typeStyles: Record<TxType, { icon: React.ElementType, bg: string, text: string, sign: string }> = {
    DEBIT: { icon: ArrowUpRight, bg: 'bg-rose-500/10', text: 'text-rose-500', sign: '-' },
    CREDIT: { icon: ArrowDownLeft, bg: 'bg-emerald-500/10', text: 'text-emerald-500', sign: '+' },
};

const statusStyles: Record<TxStatus, { icon: React.ElementType, text: string }> = {
    COMPLETED: { icon: CheckCircle2, text: 'text-emerald-500' },
    PENDING: { icon: Clock, text: 'text-amber-500' },
    FAILED: { icon: XCircle, text: 'text-destructive' },
    REVERSED: { icon: XCircle, text: 'text-muted-foreground' },
    SUSPENSE: { icon: Clock, text: 'text-amber-500' },
};

export const HistoryTable = memo(function HistoryTable({
    transactions,
    sortBy,
    sortOrder,
    onSort,
}: {
    transactions: Transaction[];
    sortBy: string;
    sortOrder: string;
    onSort: (column: 'createdAt' | 'amount' | 'status' | 'description') => void;
}) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const copyReference = (ref: string) => {
        navigator.clipboard.writeText(ref);
        toast.success('Reference copied to clipboard');
    };

    const handleDownloadReceipt = async (tx: Transaction) => {
        setIsGenerating(true);
        const loadToast = toast.loading('Preparing your impact receipt...');
        try {
            await generateImpactReceipt(tx);
            toast.success('Receipt successfully downloaded', { id: loadToast });
        } catch (err) {
            toast.error('We could not generate your receipt right now', { id: loadToast });
        } finally {
            setIsGenerating(false);
        }
    };

    const getPaymentContext = (tx: Transaction) => {
        if (tx.type === 'DEBIT' && tx.reference.startsWith('DON-')) {
            return { label: 'Givar Wallet', method: 'Wallet Balance' };
        }
        if (tx.type === 'DEBIT' && !tx.reference.startsWith('DON-')) {
            return { label: 'Direct Payment', method: `Paystack • ${tx.metadata?.channel || 'Card'}` };
        }
        if (tx.type === 'CREDIT' && tx.metadata?.channel) {
            const method = tx.metadata.channel.charAt(0).toUpperCase() + tx.metadata.channel.slice(1).replace('_', ' ');
            return { label: 'Payment Gateway', method: `Paystack • ${method}` };
        }
        if (tx.type === 'CREDIT') {
            return { label: 'Source', method: 'System Transfer' };
        }
        return { label: 'Payment Method', method: 'Wallet Balance' };
    };

    const getFinancialBreakdown = (tx: any) => {
        if (!tx.financials) return null;
        const base = BigInt(tx.financials.baseAmount);
        const fee = BigInt(tx.financials.feeAmount);
        const tip = BigInt(tx.financials.tipAmount);
        const total = BigInt(tx.amount);
        if (base + fee + tip !== total) return null;
        return {
            base: base.toString(),
            fee: fee.toString(),
            tip: tip.toString(),
            feePercentage: tx.financials.feePercentage
        };
    };

    if (transactions.length === 0) {
        return (
            <Card className="border-dashed border-2 rounded-3xl bg-muted/20">
                <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 rounded-3xl bg-background flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                        <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">No History Identified</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                        Your contribution history is currently empty.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <table className="w-full border-collapse table-fixed md:table-auto">
                <thead className="bg-muted/40 border-b border-border/40 hidden md:table-header-group">
                    <tr>
                        <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-left w-1/2">Transaction Details</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-left w-[200px]">Record Date</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-right">Total Value</th>
                        <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-center">Record Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40 block md:table-row-group">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {transactions.map((tx, index) => {
                            const typeStyle = typeStyles[tx.type];
                            const statusStyle = statusStyles[tx.status];
                            const displayCategory = tx.category ? tx.category.replace(/_/g, ' ') : 'SYSTEM ENTRY';

                            return (
                                <motion.tr
                                    key={tx.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.02 }}
                                    className="md:cursor-pointer hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden"
                                    onClick={() => {
                                        if (window.innerWidth >= 768) setSelectedTx(tx);
                                    }}
                                >
                                    <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-3xl shadow-sm border border-border/10", typeStyle.bg, typeStyle.text)}>
                                                <typeStyle.icon className="h-5 w-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2 min-w-0">
                                                    <p className="font-bold text-foreground truncate text-sm">
                                                        {tx.description}
                                                    </p>
                                                    <p className={cn("md:hidden font-bold tabular-nums shrink-0 text-sm whitespace-nowrap", typeStyle.text)}>
                                                        {typeStyle.sign}{formatCurrency(tx.amount, tx.currency)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 mt-2 min-w-0">
                                                    <span className="px-2 py-0.5 rounded-full bg-muted border border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 truncate max-w-[80px] md:max-w-none mr-1">
                                                        {displayCategory}
                                                    </span>
                                                    <div className="md:hidden flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-tight min-w-0">
                                                        <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <Calendar className="h-3 w-3" /> {formatDate(tx.createdAt).split(',')[0]}
                                                        </span>
                                                        <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                                                        <span className={cn("flex items-center shrink-0", statusStyle.text)}>
                                                            <statusStyle.icon className="h-3 w-3" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 md:hidden">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSelectedTx(tx)}
                                                className="rounded-3xl h-9 w-full mx-auto flex px-8 text-xs font-bold shadow-none border border-border/50 bg-background active:scale-95 transition-all"
                                            >
                                                View details
                                            </Button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell text-xs font-medium whitespace-nowrap">
                                        {formatDate(tx.createdAt)}
                                    </td>
                                    <td className={cn("px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell text-sm whitespace-nowrap", typeStyle.text)}>
                                        {typeStyle.sign} {formatCurrency(tx.amount, tx.currency)}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-center">
                                        <div className="flex justify-center">
                                            <statusStyle.icon className={cn("h-5 w-5", statusStyle.text)} />
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>

            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
                    {selectedTx && (
                        <div className="p-5 md:p-6 space-y-4 overflow-hidden">
                            <DialogHeader className="space-y-2">
                                <DialogTitle className="text-lg font-bold tracking-tight leading-none text-foreground">
                                    {selectedTx.type === 'CREDIT' ? 'Funding Details' : 'Contribution Details'}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="text-center pt-8 pb-6 px-6 rounded-3xl bg-muted/30 border border-border/40 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <FileText className="h-12 w-12" />
                                </div>

                                <div className="absolute top-3 left-4">
                                    <Badge variant="outline" className="rounded-full px-2 py-0.5 border-border/60 bg-background/60 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {selectedTx.category?.replace(/_/g, ' ') || 'SYSTEM'}
                                    </Badge>
                                </div>

                                <p className="text-xs text-muted-foreground font-bold tracking-widest mb-1.5 mt-2">
                                    {selectedTx.type === 'CREDIT' ? 'Amount Received' : 'Total Impact Value'}
                                </p>
                                <div className="max-w-full overflow-hidden leading-none">
                                    <SmartCurrency amount={selectedTx.amount} currency={selectedTx.currency} visible={true} size="large" className="text-foreground" />
                                </div>

                                {getFinancialBreakdown(selectedTx) && (
                                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                            <span>Project Impact</span>
                                            <SmartCurrency amount={getFinancialBreakdown(selectedTx)!.base} currency={selectedTx.currency} visible={true} size="small" className="text-foreground" />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                            <span>Platform Fee ({getFinancialBreakdown(selectedTx)!.feePercentage}%)</span>
                                            <SmartCurrency amount={getFinancialBreakdown(selectedTx)!.fee} currency={selectedTx.currency} visible={true} size="small" className="text-foreground" />
                                        </div>
                                        {BigInt(getFinancialBreakdown(selectedTx)!.tip) > 0n && (
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                                <span>Optional Tip</span>
                                                <SmartCurrency amount={getFinancialBreakdown(selectedTx)!.tip} currency={selectedTx.currency} visible={true} size="small" className="text-foreground" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* --- HIDDEN RECEIPT GENERATION DOM --- */}
                            <div className="absolute left-[-9999px] top-[-9999px]">
                                <div id={`receipt-${selectedTx.id}`} className="w-[800px] p-16 bg-white text-slate-900 font-sans">
                                    <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-10">
                                        <div>
                                            <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Givar.</h1>
                                            <p className="text-sm text-slate-500 mt-1 tracking-widest font-bold">Impact Receipt</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">Transaction Reference</p>
                                            <p className="text-xs font-mono text-slate-500">{selectedTx.reference}</p>
                                        </div>
                                    </div>
                                    <div className="py-12 grid grid-cols-2 gap-10">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 ">Contributor Identity</p>
                                            <p className="text-lg font-bold">
                                                {selectedTx.user?.firstName || 'Valued'} {selectedTx.user?.lastName || 'Giver'}
                                            </p>
                                            <p className="text-sm text-slate-500">{selectedTx.user?.email}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-xs font-bold text-slate-400 ">Verification Date</p>
                                            <p className="text-lg font-bold">{formatDate(selectedTx.createdAt)}</p>
                                            <p className="text-sm text-slate-500 pt-2">
                                                Method: {getPaymentContext(selectedTx).method}
                                            </p>
                                            <p className="text-sm text-slate-500 pt-1">
                                                Category: {selectedTx.category?.replace(/_/g, ' ') || 'SYSTEM'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mb-10">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 mb-1">Beneficiary Cause</p>
                                                <p className="text-xl font-black">{selectedTx.project?.title || selectedTx.description}</p>
                                            </div>
                                        </div>

                                        {getFinancialBreakdown(selectedTx) ? (
                                            <div className="space-y-3 pt-6 border-t border-emerald-200">
                                                <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                    <span>Direct Project Impact</span>
                                                    <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedTx)!.base, selectedTx.currency)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                    <span>Platform Fee ({getFinancialBreakdown(selectedTx)!.feePercentage}%)</span>
                                                    <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedTx)!.fee, selectedTx.currency)}</span>
                                                </div>
                                                {BigInt(getFinancialBreakdown(selectedTx)!.tip) > 0n && (
                                                    <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                        <span>Platform Tip</span>
                                                        <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedTx)!.tip, selectedTx.currency)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-4 border-t border-emerald-200 mt-2">
                                                    <span className="text-sm font-bold text-emerald-900">Total Contribution</span>
                                                    <span className="text-2xl font-black text-emerald-700">{formatCurrency(selectedTx.amount, selectedTx.currency)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-emerald-600 mb-1">Amount</p>
                                                <p className="text-3xl font-black text-emerald-700">{formatCurrency(selectedTx.amount, selectedTx.currency)}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs max-w-[200px] text-slate-400 leading-tight">
                                                This digital document serves as official proof of impact. Verified on the Givar Transparent Ledger.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="h-12 w-32 bg-slate-100 rounded opacity-50 ml-auto mb-2 flex items-center justify-center italic text-xs">Digital Verification Signature</div>
                                            <p className="text-xs font-bold text-slate-400 ">Authorized by Givar Platform</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 min-w-0">
                                <span className="text-xs font-bold text-muted-foreground tracking-widest block px-1">Purpose & Identification</span>
                                <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-sm space-y-3 min-w-0">
                                    {selectedTx.project ? (
                                        <Link
                                            href={`/dashboard/impact/${selectedTx.project.slug}`}
                                            className="block group/link min-w-0"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover/link:text-primary transition-colors">
                                                        {selectedTx.project.title}
                                                    </p>
                                                </div>
                                                <div className="h-9 w-9 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all border border-primary/10 shrink-0 shadow-sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm text-foreground leading-tight">
                                                {selectedTx.description}
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border/40 flex justify-between items-center gap-4">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-xs font-bold text-muted-foreground tracking-tighter block mb-0.5">Reference ID</span>
                                            <p className="font-mono text-[10px] truncate text-foreground/50">{selectedTx.reference}</p>
                                        </div>
                                        <button
                                            onClick={() => copyReference(selectedTx.reference)}
                                            className="h-8 w-8 flex items-center justify-center rounded-3xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors border border-border/50 shrink-0 active:scale-90"
                                            title="Copy"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 min-w-0">
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground tracking-widest block mb-1">Status</span>
                                    <div className={cn("flex items-center gap-2 font-bold text-xs truncate", statusStyles[selectedTx.status].text)}>
                                        {React.createElement(statusStyles[selectedTx.status].icon, { className: "h-3.5 w-3.5 shrink-0" })}
                                        <span className="truncate">{selectedTx.status.charAt(0) + selectedTx.status.slice(1).toLowerCase()}</span>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground tracking-widest block mb-1">Method</span>
                                    <div className="flex items-center gap-2">
                                        {selectedTx.type === 'DEBIT' && !selectedTx.reference.startsWith('DON-') ? (
                                            <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                                        ) : (
                                            <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        )}
                                        <p className="text-xs font-bold text-foreground truncate ">
                                            {getPaymentContext(selectedTx).method}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    onClick={() => handleDownloadReceipt(selectedTx)}
                                    disabled={isGenerating || selectedTx.status !== 'COMPLETED'}
                                    className="w-full h-12 rounded-3xl font-bold gap-2 bg-primary text-white shadow-lg shadow-primary/20 border-0 active:scale-[0.98] transition-all"
                                >
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download Receipt
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});