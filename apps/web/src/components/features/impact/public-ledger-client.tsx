'use client';

import React, { useState, memo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
    ArrowDownLeft, ArrowUpRight, CheckCircle2,
    Calendar, ExternalLink, Info, Copy, FileText, Search, Database
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Pagination } from '../history/pagination';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicLedgerClientProps {
    project: any;
    initialData: {
        data: any[];
        meta: { total: number; page: number; lastPage: number };
    };
}

export const PublicLedgerClient = memo(function PublicLedgerClient({ project, initialData }: PublicLedgerClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedEntry, setSelectedEntry] = useState<any>(null);

    const activeType = searchParams.get('type') || 'all';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('type', value);
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const copyRef = (ref: string) => {
        navigator.clipboard.writeText(ref);
        toast.success('Reference copied');
    };

    const viewReceipt = async (key: string) => {
        const toastId = toast.loading('Opening verified record...');
        try {
            const { ApiService } = await import('../../../services/api');
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, project.id);
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Record access restricted', { id: toastId });
        }
    };

    if (initialData.data.length === 0 && activeType === 'all') {
        return (
            <Card className="border-dashed border-2 rounded-3xl bg-muted/20">
                <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="h-14 w-14 rounded-3xl bg-background flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                        <Database className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">Records are empty</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[240px] font-medium leading-relaxed">
                        There are no donations or payments recorded for this project yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeType} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-3xl h-11 w-fit border border-border/40 shadow-inner inline-flex">
                    <TabsTrigger value="all" className="rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">All Records</TabsTrigger>
                    <TabsTrigger value="INFLOW" className="rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Donations</TabsTrigger>
                    <TabsTrigger value="OUTFLOW" className="rounded-3xl px-6 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Payments</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-muted/40 border-b border-border/40 hidden md:table-header-group">
                        <tr>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-left">Entity</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-left">Date</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-right">Value</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest text-muted-foreground text-center">Status</th>
                            <th className="px-6 py-3 w-[100px]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 block md:table-row-group">
                        {initialData.data.map((entry, index) => {
                            const isInflow = entry.type === 'INFLOW';
                            return (
                                <tr key={entry.id} className="hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden">
                                    <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className={cn(
                                                "h-10 w-10 shrink-0 flex items-center justify-center rounded-3xl shadow-sm border border-border/10",
                                                isInflow ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                                            )}>
                                                {isInflow ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className="font-bold text-foreground truncate text-sm">
                                                        {entry.actorName}
                                                    </p>
                                                    <p className={cn(
                                                        "md:hidden font-bold tabular-nums shrink-0 text-sm whitespace-nowrap",
                                                        isInflow ? "text-emerald-600" : "text-blue-600"
                                                    )}>
                                                        {isInflow ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground font-medium truncate uppercase tracking-widest opacity-60">
                                                    {isInflow ? 'Public Contribution' : 'Verified Payment'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 md:hidden">
                                            <Button variant="secondary" size="sm" onClick={() => setSelectedEntry(entry)} className="rounded-3xl h-9 w-auto mx-auto flex text-xs font-bold shadow-none border border-border/50 bg-background active:scale-95 transition-all">
                                                Details
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell text-xs font-medium whitespace-nowrap">
                                        {formatDate(entry.createdAt).split(',')[0]}
                                    </td>
                                    <td className={cn(
                                        "px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell text-sm whitespace-nowrap",
                                        isInflow ? "text-emerald-600" : "text-blue-600"
                                    )}>
                                        {isInflow ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell text-center">
                                        <div className="flex justify-center">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)} className="rounded-3xl h-8 text-xs font-bold px-4 transition-all active:scale-95">
                                            Details
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="p-4 md:p-6 border-t border-border/40">
                    <Pagination currentPage={initialData.meta.page} totalPages={initialData.meta.lastPage} />
                </div>
            </div>

            <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
                <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
                    {selectedEntry && (
                        <div className="p-5 md:p-6 space-y-5">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold tracking-tight text-foreground">Record details</DialogTitle>
                            </DialogHeader>

                            <div className="text-center p-6 rounded-3xl bg-muted/30 border border-border/40 relative overflow-hidden shadow-inner">
                                <p className="text-xs text-muted-foreground font-bold tracking-widest mb-1.5 uppercase">
                                    {selectedEntry.type === 'INFLOW' ? 'Donation value' : 'Payment value'}
                                </p>
                                <SmartCurrency amount={selectedEntry.amount} currency={selectedEntry.currency} visible={true} size="large" className="text-foreground" />
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground tracking-widest block px-1 uppercase">Identification</span>
                                <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-sm space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Reference ID</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-mono text-xs text-foreground/70 truncate">{selectedEntry.reference}</p>
                                            <button onClick={() => copyRef(selectedEntry.reference)} className="h-7 w-7 rounded-xl hover:bg-muted text-muted-foreground flex items-center justify-center border border-border/50 shrink-0 active:scale-90 transition-all">
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedEntry.type === 'INFLOW' ? 'Contributor' : 'Payee'}</p>
                                            <p className="text-sm font-bold text-foreground">{selectedEntry.actorName}</p>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Date</p>
                                            <p className="text-sm font-bold text-foreground">{formatDate(selectedEntry.createdAt).split(',')[0]}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm">
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest block mb-1 uppercase">Status</span>
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-3xl bg-card border border-border/40 shadow-sm">
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest block mb-1 uppercase">Method</span>
                                    <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                                        <Database className="h-3.5 w-3.5 text-primary" /> {selectedEntry.type === 'INFLOW' ? 'Direct Gift' : 'Disbursement'}
                                    </div>
                                </div>
                            </div>

                            {selectedEntry.receiptKey && (
                                <Button
                                    onClick={() => viewReceipt(selectedEntry.receiptKey)}
                                    className="w-full h-12 rounded-3xl font-bold gap-2 bg-primary text-white shadow-lg active:scale-95 transition-all border-0"
                                >
                                    <FileText className="h-4 w-4" /> View proof of payment
                                </Button>
                            )}

                            <Button variant="ghost" onClick={() => setSelectedEntry(null)} className="w-full h-10 rounded-3xl text-xs font-bold text-muted-foreground">Close details</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});