'use client';

import React, { useState, memo } from 'react';
import { usePathname } from 'next/navigation';
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Calendar,
    Copy,
    Database,
    FileText,
    ExternalLink,
    Wallet,
    CreditCard,
    Clock,
    XCircle,
    ChevronRight,
    Download,
    Loader2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { SmartCurrency } from '../../ui/smart-currency';
import { Button } from '../../ui/button';
import { Pagination } from '../history/pagination';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TxStatus, TxType, Transaction } from '../../../types';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';
import { generateImpactReceipt } from '../../../lib/utils/receipt-generator';
import { Badge } from '../../ui/badge';
import Link from 'next/link';

interface PublicLedgerClientProps {
    project?: any;
    initialData: {
        data: any[];
        meta: { total: number; page: number; lastPage: number; context?: string };
    };
}

const typeStyles: Record<TxType, { icon: React.ElementType, bg: string, text: string, sign: string }> = {
    DEBIT: { icon: ArrowUpRight, bg: 'bg-blue-500/10', text: 'text-blue-600', sign: '-' },
    CREDIT: { icon: ArrowDownLeft, bg: 'bg-emerald-500/10', text: 'text-emerald-500', sign: '+' },
};

const statusStyles: Record<TxStatus, { icon: React.ElementType, text: string }> = {
    COMPLETED: { icon: CheckCircle2, text: 'text-emerald-500' },
    PENDING: { icon: Clock, text: 'text-amber-500' },
    FAILED: { icon: XCircle, text: 'text-destructive' },
    REVERSED: { icon: XCircle, text: 'text-muted-foreground' },
    SUSPENSE: { icon: Clock, text: 'text-amber-500' },
};

export const PublicLedgerClient = memo(function PublicLedgerClient({ project, initialData }: PublicLedgerClientProps) {
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; items: LightboxItem[]; index: number }>({ isOpen: false, items: [], index: 0 });

    const isGlobalView = !project || project.id === 'global';

    const copyReference = (ref: string) => {
        navigator.clipboard.writeText(ref);
        toast.success('Reference copied');
    };

    const handleDownloadReceipt = async (tx: any) => {
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

    const getPaymentContext = (tx: any) => {
        if (tx.type === 'DEBIT' && tx.reference?.startsWith('DON-')) {
            return { label: 'Givar Wallet', method: 'Wallet Balance' };
        }

        let methodString = 'Card';
        if (tx.metadata?.channel) {
            if (tx.metadata.channel === 'apple_pay') {
                methodString = 'Apple Pay';
            } else {
                methodString = tx.metadata.channel.charAt(0).toUpperCase() + tx.metadata.channel.slice(1).replace('_', ' ');
            }
        }

        if (tx.metadata?.authorization) {
            const auth = tx.metadata.authorization;
            const brand = auth.brand ? auth.brand.charAt(0).toUpperCase() + auth.brand.slice(1) : '';
            const country = auth.country_code ? `(${auth.country_code})` : '';
            if (brand) methodString = `${brand} ${country}`.trim();
        }

        if (tx.type === 'DEBIT' && !tx.reference?.startsWith('DON-')) {
            return { label: 'Direct Payment', method: `Paystack • ${methodString}` };
        }
        if (tx.type === 'CREDIT' && tx.metadata?.channel) {
            return { label: 'Payment Gateway', method: `Paystack • ${methodString}` };
        }
        if (tx.type === 'CREDIT') {
            return { label: 'Source', method: 'System Transfer' };
        }
        return { label: 'Payment Method', method: 'Wallet Balance' };
    };

    const getFinancialBreakdown = (tx: any) => {
        // Handle both authenticated user structure and guest structure natively
        const financials = tx.financials || tx.donation || tx.guestDonation;

        // Use explicit properties if available, fallback to metadata for older structures
        const meta = tx.metadata || {};
        const rawBase = tx.baseAmount || meta.baseAmount;
        const rawFee = tx.feeAmount || meta.feeAmount;
        const rawTip = tx.tipAmount || meta.tipAmount;
        const rawPercentage = tx.feePercentageUsed || meta.feePercentage;

        if (!rawBase) return null;

        return {
            base: String(rawBase),
            fee: String(rawFee || '0'),
            tip: String(rawTip || '0'),
            feePercentage: rawPercentage || 0
        };
    };

    const viewSecureReceipt = async (key: string) => {
        const toastId = toast.loading('Opening record...');
        try {
            const { ApiService } = await import('../../../services/api');
            const contextId = isGlobalView ? selectedEntry?.projectId : project.id;
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, contextId);
            toast.dismiss(toastId);
            const isDoc = key.toLowerCase().includes('.pdf') || key.toLowerCase().includes('.doc');
            if (isDoc) {
                window.open(viewUrl, '_blank');
            } else {
                setLightboxState({
                    isOpen: true,
                    items: [{ url: viewUrl, type: 'IMAGE', alt: 'Transaction Receipt' }],
                    index: 0
                });
            }
        } catch (e) {
            toast.error('Access restricted', { id: toastId });
        }
    };

    const EmptyState = () => {
        return (
            <Card className="border-dashed border-2 rounded-3xl bg-muted/20 min-w-0 shadow-none">
                <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <div className="h-16 w-16 rounded-3xl bg-background flex items-center justify-center mb-4 border border-border/50 shadow-sm shrink-0">
                        <Database className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">No records found</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[280px] font-medium leading-relaxed">
                        There are no confirmed transactions for this view yet.
                    </p>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            {initialData.data.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                    <table className="w-full border-collapse table-fixed md:table-auto min-w-0">
                        <thead className="bg-muted/40 border-b border-border/40 hidden md:table-header-group">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs text-muted-foreground text-left w-1/2">Record details</th>
                                <th className="px-6 py-4 font-bold text-xs text-muted-foreground text-left w-[200px]">Verification date</th>
                                <th className="px-6 py-4 font-bold text-xs text-muted-foreground text-right">Value</th>
                                <th className="px-6 py-4 font-bold text-xs text-muted-foreground text-center">Status</th>
                                <th className="px-6 py-3 w-[24px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 block md:table-row-group">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {initialData.data.map((entry, index) => {
                                    const isInflow = entry.type === 'INFLOW';
                                    const typeStyle = isInflow ? typeStyles.CREDIT : typeStyles.DEBIT;
                                    const statusStyle = statusStyles['COMPLETED'];

                                    const displayCategory = entry.type === 'INFLOW'
                                        ? (entry.category === 'ADJUSTMENT' ? 'SYSTEM ADJUSTMENT' : 'CONTRIBUTION')
                                        : (entry.receiptKey ? 'VENDOR PAYMENT' : 'DISBURSEMENT');

                                    return (
                                        <motion.tr
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.02 }}
                                            className="md:cursor-pointer hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden"
                                            onClick={() => { if (window.innerWidth >= 768) setSelectedEntry(entry); }}
                                        >
                                            <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full min-w-0">
                                                <div className="flex items-center gap-3 w-full min-w-0">
                                                    <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-3xl shadow-sm border border-border/10", typeStyle.bg, typeStyle.text)}>
                                                        <typeStyle.icon className="h-5 w-5" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <p className="font-bold text-foreground truncate text-sm">
                                                                    {entry.actorName}
                                                                </p>
                                                                {entry.isYou && (
                                                                    <div className="px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary">You</div>
                                                                )}
                                                            </div>
                                                            <p className={cn("md:hidden font-bold tabular-nums shrink-0 text-sm whitespace-nowrap", typeStyle.text)}>
                                                                {typeStyle.sign}{formatCurrency(entry.amount, entry.currency)}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-2 min-w-0">
                                                            <span className="px-2 py-0.5 rounded-full bg-muted border border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 truncate max-w-[120px] md:max-w-none">
                                                                {displayCategory}
                                                            </span>
                                                            <div className="md:hidden flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-tight min-w-0">
                                                                <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                                                                <span className="flex items-center gap-1 shrink-0">
                                                                    <Calendar className="h-3 w-3" /> {formatDate(entry.createdAt).split(',')[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 md:hidden">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setSelectedEntry(entry)}
                                                        className="rounded-3xl h-9 w-full mx-auto flex px-8 text-xs font-bold shadow-none border border-border/50 bg-background active:scale-95 transition-all"
                                                    >
                                                        View details
                                                    </Button>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-muted-foreground hidden md:table-cell text-xs font-medium whitespace-nowrap">
                                                {formatDate(entry.createdAt)}
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell text-sm whitespace-nowrap", typeStyle.text)}>
                                                {typeStyle.sign} {formatCurrency(entry.amount, entry.currency)}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-center">
                                                <div className="flex justify-center">
                                                    <statusStyle.icon className={cn("h-5 w-5", statusStyle.text)} />
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <div className="h-8 w-6 flex items-center justify-end">
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>

                    <div className="p-4 md:p-6 border-t border-border/40">
                        <Pagination currentPage={initialData.meta.page} totalPages={initialData.meta.lastPage} />
                    </div>
                </div>
            )}

            <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
                    {selectedEntry && (
                        <div className="p-5 md:p-6 space-y-4 overflow-hidden min-w-0">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold tracking-tight text-foreground leading-none">Record details</DialogTitle>
                            </DialogHeader>

                            <div className="text-center p-6 rounded-3xl bg-muted/30 border border-border/40 relative overflow-hidden shadow-inner min-w-0">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <FileText className="h-12 w-12" />
                                </div>
                                <div className="absolute top-3 left-4">
                                    <span className="px-2 py-0.5 rounded-full bg-background/60 border border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                        {selectedEntry.type === 'INFLOW'
                                            ? (selectedEntry.category === 'ADJUSTMENT' ? 'SYSTEM ADJUSTMENT' : 'CONTRIBUTION')
                                            : (selectedEntry.receiptKey ? 'VENDOR PAYMENT' : 'DISBURSEMENT')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-bold tracking-widest mb-1.5 mt-2">
                                    {selectedEntry.type === 'INFLOW' ? 'Total contribution' : 'Verified payment'}
                                </p>
                                <div className="max-w-full overflow-hidden leading-none">
                                    <SmartCurrency amount={selectedEntry.amount} currency={selectedEntry.currency} visible={true} size="large" className="text-foreground" />
                                </div>

                                {selectedEntry.type === 'INFLOW' && getFinancialBreakdown(selectedEntry) && (
                                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                            <span>Project Impact</span>
                                            <SmartCurrency amount={getFinancialBreakdown(selectedEntry)!.base} currency={selectedEntry.currency} visible={true} size="small" className="text-foreground" />
                                        </div>
                                        {BigInt(getFinancialBreakdown(selectedEntry)!.fee) > 0n && (
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                                <span>Operational Support Fee ({getFinancialBreakdown(selectedEntry)!.feePercentage}%)</span>
                                                <SmartCurrency amount={getFinancialBreakdown(selectedEntry)!.fee} currency={selectedEntry.currency} visible={true} size="small" className="text-foreground" />
                                            </div>
                                        )}
                                        {BigInt(getFinancialBreakdown(selectedEntry)!.tip) > 0n && (
                                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground tracking-wide">
                                                <span>Optional Support Contribution</span>
                                                <SmartCurrency amount={getFinancialBreakdown(selectedEntry)!.tip} currency={selectedEntry.currency} visible={true} size="small" className="text-foreground" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* --- HIDDEN RECEIPT GENERATION DOM --- */}
                            <div className="absolute left-[-9999px] top-[-9999px]">
                                <div id={`receipt-${selectedEntry.id}`} className="w-[800px] p-16 bg-white text-slate-900 font-sans">
                                    <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-10">
                                        <div>
                                            <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Givar.</h1>
                                            <p className="text-sm text-slate-500 mt-1 tracking-widest font-bold">Public Impact Record</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">Transaction Reference</p>
                                            <p className="text-xs font-mono text-slate-500">{selectedEntry.reference}</p>
                                        </div>
                                    </div>
                                    <div className="py-12 grid grid-cols-2 gap-10">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 ">{selectedEntry.type === 'INFLOW' ? 'Contributor Identity' : 'Payee Identity'}</p>
                                            <p className="text-lg font-bold">
                                                {selectedEntry.actorName}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-xs font-bold text-slate-400 ">Verification Date</p>
                                            <p className="text-lg font-bold">{formatDate(selectedEntry.createdAt)}</p>
                                            <p className="text-sm text-slate-500 pt-2">
                                                Method: {getPaymentContext(selectedEntry).method}
                                            </p>
                                            <p className="text-sm text-slate-500 pt-1">
                                                Record Type: {selectedEntry.type === 'INFLOW' ? 'CONTRIBUTION' : 'DISBURSEMENT'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mb-10">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 mb-1">Beneficiary Cause</p>
                                                <p className="text-xl font-black">{selectedEntry.projectName || selectedEntry.description}</p>
                                                {selectedEntry.phaseName && (
                                                    <p className="text-sm font-bold text-emerald-700 mt-1">{selectedEntry.phaseName}</p>
                                                )}
                                            </div>
                                        </div>

                                        {selectedEntry.type === 'INFLOW' && getFinancialBreakdown(selectedEntry) ? (
                                            <div className="space-y-3 pt-6 border-t border-emerald-200">
                                                <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                    <span>Direct Project Impact</span>
                                                    <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedEntry)!.base, selectedEntry.currency)}</span>
                                                </div>
                                                {BigInt(getFinancialBreakdown(selectedEntry)!.fee) > 0n && (
                                                    <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                        <span>Operational Support Fee ({getFinancialBreakdown(selectedEntry)!.feePercentage}%)</span>
                                                        <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedEntry)!.fee, selectedEntry.currency)}</span>
                                                    </div>
                                                )}
                                                {BigInt(getFinancialBreakdown(selectedEntry)!.tip) > 0n && (
                                                    <div className="flex justify-between text-sm font-medium text-emerald-800">
                                                        <span>Optional Support Contribution</span>
                                                        <span className="font-bold">{formatCurrency(getFinancialBreakdown(selectedEntry)!.tip, selectedEntry.currency)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-4 border-t border-emerald-200 mt-2">
                                                    <span className="text-sm font-bold text-emerald-900">Total Contribution</span>
                                                    <span className="text-2xl font-black text-emerald-700">{formatCurrency(selectedEntry.amount, selectedEntry.currency)}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-emerald-600 mb-1">Amount</p>
                                                <p className="text-3xl font-black text-emerald-700">{formatCurrency(selectedEntry.amount, selectedEntry.currency)}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs max-w-[200px] text-slate-400 leading-tight">
                                                This digital document serves as official public proof of transaction. Verified on the Givar Transparent Ledger.
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
                                    {selectedEntry.projectName ? (
                                        <Link
                                            href={`/explore/${selectedEntry.projectSlug}`}
                                            className="block group/link min-w-0"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover/link:text-primary transition-colors">
                                                        {selectedEntry.projectName}
                                                    </p>
                                                    {selectedEntry.phaseName && (
                                                        <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                                            {selectedEntry.phaseName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="h-9 w-9 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover/link:bg-primary group-hover/link:text-white transition-all border border-primary/10 shrink-0 shadow-sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm text-foreground leading-tight">
                                                {selectedEntry.description}
                                            </p>
                                            {selectedEntry.phaseName && (
                                                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                                                    {selectedEntry.phaseName}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-border/40 flex justify-between items-center gap-4">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-xs font-bold text-muted-foreground tracking-tighter block mb-0.5">Reference ID</span>
                                            <p className="font-mono text-[10px] truncate text-foreground/50">{selectedEntry.reference}</p>
                                        </div>
                                        <button
                                            onClick={() => copyReference(selectedEntry.reference)}
                                            className="h-8 w-8 flex items-center justify-center rounded-3xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors border border-border/50 shrink-0 active:scale-90"
                                            title="Copy"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 min-w-0">
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0 col-span-2">
                                    <span className="text-xs font-bold text-muted-foreground block mb-1">
                                        {selectedEntry.type === 'INFLOW' ? 'Contributor' : 'Payee'}
                                    </span>
                                    <div className="flex items-center gap-2 font-bold text-sm truncate">
                                        <span className="truncate">{selectedEntry.actorName}</span>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground block mb-1">Status</span>
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs truncate">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">Verified</span>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground block mb-1">Method</span>
                                    <div className="flex items-center gap-2">
                                        {selectedEntry.type === 'OUTFLOW' ? (
                                            <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                                        ) : (
                                            <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        )}
                                        <p className="text-xs font-bold text-foreground truncate ">
                                            {selectedEntry.type === 'INFLOW' ? 'Direct support' : 'Project payment'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                {selectedEntry.type === 'INFLOW' && (
                                    <Button
                                        onClick={() => handleDownloadReceipt(selectedEntry)}
                                        disabled={isGenerating}
                                        className="w-full h-12 rounded-3xl font-bold gap-2 bg-primary text-white shadow-lg active:scale-95 transition-all border-0"
                                    >
                                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        Download public receipt
                                    </Button>
                                )}

                                {selectedEntry.type === 'OUTFLOW' && selectedEntry.receiptKey && (
                                    <Button
                                        onClick={() => viewSecureReceipt(selectedEntry.receiptKey)}
                                        className="w-full h-12 rounded-3xl font-bold gap-2 bg-primary text-white shadow-lg active:scale-95 transition-all border-0"
                                    >
                                        <FileText className="h-4 w-4" /> View proof of payment
                                    </Button>
                                )}

                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedEntry(null)}
                                    className="w-auto mx-auto flex h-10 rounded-3xl text-xs font-bold text-muted-foreground hover:text-foreground"
                                >
                                    Close details
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
                initialIndex={lightboxState.index}
            />
        </div>
    );
});