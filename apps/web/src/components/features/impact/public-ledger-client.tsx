'use client';

import React, { useState, memo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
    Inbox
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { SmartCurrency } from '../../ui/smart-currency';
import { Button } from '../../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Pagination } from '../history/pagination';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicLedgerClientProps {
    project?: any;
    initialData: {
        data: any[];
        meta: { total: number; page: number; lastPage: number; context?: string };
    };
}

export const PublicLedgerClient = memo(function PublicLedgerClient({ project, initialData }: PublicLedgerClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedEntry, setSelectedEntry] = useState<any>(null);

    const activeType = searchParams.get('type') || 'all';
    const isGlobalView = !project || project.id === 'global';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', value);
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const copyReference = (ref: string) => {
        navigator.clipboard.writeText(ref);
        toast.success('Reference copied');
    };

    const viewSecureReceipt = async (key: string) => {
        const toastId = toast.loading('Opening record...');
        try {
            const { ApiService } = await import('../../../services/api');
            const contextId = isGlobalView ? selectedEntry?.projectId : project.id;
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, contextId);
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Access restricted', { id: toastId });
        }
    };

    const EmptyState = () => {
        let icon = Database;
        let title = "No records found";
        let description = "There are no confirmed transactions for this view yet.";

        if (activeType === 'INFLOW') {
            icon = Wallet;
            title = "No donations yet";
            description = "This ledger has not received any direct contributions matching your filter.";
        } else if (activeType === 'OUTFLOW') {
            icon = CreditCard;
            title = "No payments yet";
            description = "No funds have been disbursed to vendors from this ledger yet.";
        }

        return (
            <Card className="border-dashed border-2 rounded-3xl bg-muted/20 min-w-0 shadow-none">
                <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                    <div className="h-16 w-16 rounded-3xl bg-background flex items-center justify-center mb-4 border border-border/50 shadow-sm shrink-0">
                        {React.createElement(icon, { className: "h-7 w-7 text-muted-foreground/40" })}
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[280px] font-medium leading-relaxed">
                        {description}
                    </p>
                    {activeType !== 'all' && (
                        <Button
                            variant="outline"
                            onClick={() => handleTabChange('all')}
                            className="mt-6 rounded-3xl h-10 px-6 text-xs font-bold border-border/60 hover:bg-background transition-all"
                        >
                            View all records
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 w-full min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                <Tabs value={activeType} onValueChange={handleTabChange} className="w-full md:w-auto">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 md:h-11 w-full md:w-fit border border-border/40 shadow-inner flex md:inline-flex">
                        <TabsTrigger value="all" className="flex-1 md:flex-none rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">All</TabsTrigger>
                        <TabsTrigger value="INFLOW" className="flex-1 md:flex-none rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Donations</TabsTrigger>
                        <TabsTrigger value="OUTFLOW" className="flex-1 md:flex-none rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Payments</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

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
                                <th className="px-6 py-3 w-[100px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 block md:table-row-group">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {initialData.data.map((entry, index) => {
                                    const isInflow = entry.type === 'INFLOW';
                                    return (
                                        <motion.tr
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.02 }}
                                            className="hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden"
                                        >
                                            <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full min-w-0">
                                                <div className="flex items-center gap-3 w-full min-w-0">
                                                    <div className={cn(
                                                        "h-10 w-10 shrink-0 flex items-center justify-center rounded-3xl shadow-sm border border-border/10",
                                                        isInflow ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                                                    )}>
                                                        {isInflow ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
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
                                                            <p className={cn("md:hidden font-bold tabular-nums shrink-0 text-sm whitespace-nowrap", isInflow ? "text-emerald-600" : "text-blue-600")}>
                                                                {isInflow ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                                                            </p>
                                                        </div>

                                                        <div className="md:hidden flex items-center gap-2 mt-1 text-xs font-bold text-muted-foreground tracking-tight min-w-0">
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Calendar className="h-3 w-3" /> {formatDate(entry.createdAt).split(',')[0]}
                                                            </span>
                                                            <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                                                            <span className="text-primary truncate">
                                                                {entry.description}
                                                            </span>
                                                        </div>
                                                        <div className="hidden md:block">
                                                            <p className="text-[11px] text-muted-foreground font-medium truncate opacity-60">
                                                                {entry.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 md:hidden">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => setSelectedEntry(entry)}
                                                        className="rounded-3xl h-9 w-auto mx-auto flex px-8 text-xs font-bold shadow-none border border-border/50 bg-background active:scale-95 transition-all"
                                                    >
                                                        Details
                                                    </Button>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-muted-foreground hidden md:table-cell text-xs font-medium whitespace-nowrap">
                                                {formatDate(entry.createdAt)}
                                            </td>
                                            <td className={cn("px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell text-sm whitespace-nowrap", isInflow ? "text-emerald-600" : "text-blue-600")}>
                                                {isInflow ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-center">
                                                <div className="flex justify-center">
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedEntry(entry)}
                                                    className="rounded-3xl h-8 text-xs font-bold px-4 transition-all active:scale-95"
                                                >
                                                    Details
                                                </Button>
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
                                <p className="text-xs text-muted-foreground font-bold mb-1.5">
                                    {selectedEntry.type === 'INFLOW' ? 'Total contribution' : 'Verified payment'}
                                </p>
                                <div className="max-w-full overflow-hidden leading-none">
                                    <SmartCurrency amount={selectedEntry.amount} currency={selectedEntry.currency} visible={true} size="large" className="text-foreground" />
                                </div>
                            </div>

                            <div className="space-y-1.5 min-w-0">
                                <span className="text-xs font-bold text-muted-foreground block px-1">Identification</span>
                                <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 min-w-0">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-muted-foreground block mb-0.5">Reference Id</p>
                                                <p className="font-mono text-xs truncate text-foreground/50">{selectedEntry.reference}</p>
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

                                    <div className="pt-3 border-t border-border/40 space-y-3 min-w-0">
                                        <div className="flex justify-between items-start gap-4 min-w-0">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-muted-foreground mb-0.5">
                                                    {selectedEntry.type === 'INFLOW' ? 'Contributor' : 'Payee'}
                                                </p>
                                                <p className="font-bold text-sm text-foreground truncate">{selectedEntry.actorName}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-muted-foreground mb-0.5">Verification date</p>
                                                <p className="font-bold text-sm text-foreground">{formatDate(selectedEntry.createdAt).split(',')[0]}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <p className="text-xs font-bold text-muted-foreground mb-0.5">Target project</p>
                                            <div className="flex items-center justify-between gap-3 min-w-0">
                                                {(project?.slug || selectedEntry?.projectSlug) ? (
                                                    <Link
                                                        href={`${pathname.startsWith('/dashboard') ? '/dashboard/impact' : '/explore'}/${project?.slug || selectedEntry.projectSlug}`}
                                                        className="font-bold text-sm text-foreground truncate leading-tight flex-1 hover:text-primary transition-colors"
                                                    >
                                                        {selectedEntry.projectName}
                                                    </Link>
                                                ) : (
                                                    <p className="font-bold text-sm text-foreground truncate leading-tight flex-1">
                                                        {selectedEntry.projectName}
                                                    </p>
                                                )}
                                                {(project?.slug || selectedEntry?.projectSlug) && (
                                                    <Link href={`${pathname.startsWith('/dashboard') ? '/dashboard/impact' : '/explore'}/${project?.slug || selectedEntry.projectSlug}`}>
                                                        <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm shrink-0 hover:bg-primary hover:text-white transition-all">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 min-w-0">
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground block mb-1">Status</span>
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs truncate">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                        <span>Verified</span>
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm min-w-0">
                                    <span className="text-xs font-bold text-muted-foreground block mb-1">Method</span>
                                    <div className="flex items-center gap-2 text-foreground font-bold text-xs truncate">
                                        <Database className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate">{selectedEntry.type === 'INFLOW' ? 'Direct support' : 'Project payment'}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedEntry.receiptKey && (
                                <Button
                                    onClick={() => viewSecureReceipt(selectedEntry.receiptKey)}
                                    className="w-auto mx-auto flex h-12 rounded-3xl font-bold gap-2 bg-primary text-white shadow-lg active:scale-95 transition-all border-0 px-8"
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
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});