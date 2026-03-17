'use client';

import React, { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    DollarSign,
    History,
    ExternalLink,
    ShieldCheck,
    CheckCircle2,
    Trash2,
    ArrowUp,
    ArrowDown,
    Calendar
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../ui/select';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../lib/utils/format';
import { ImageUploader } from '../proposals/media-uploader';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';

interface DisbursementFormProps {
    projectId: string;
    timeline: any[];
    disbursements?: any[];
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

export const DisbursementForm = memo(function DisbursementForm({
    projectId,
    timeline,
    disbursements = []
}: DisbursementFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [milestoneId, setMilestoneId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [receipt, setReceipt] = useState<{ key: string; previewUrl: string } | null>(null);

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; items: LightboxItem[]; index: number }>({ isOpen: false, items: [], index: 0 });

    const handleSort = (key: string) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedDisbursements = useMemo(() => {
        const items = [...disbursements];
        items.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc'
                    ? Number(BigInt(a.amount) - BigInt(b.amount))
                    : Number(BigInt(b.amount) - BigInt(a.amount));
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [disbursements, sortConfig]);

    const handleSubmit = async () => {
        if (!milestoneId || !vendorName || !amount || !reference) {
            return toast.error('Please complete all required fields');
        }

        setIsLoading(true);
        const toastId = toast.loading('Recording disbursement...');
        try {
            const minorAmount = parseFormattedNumber(amount) + '00';
            await ApiService.admin.recordDisbursement(projectId, {
                milestoneId,
                vendorName,
                amount: minorAmount,
                reference,
                receiptKey: receipt?.key
            });

            toast.success('Disbursement recorded successfully', { id: toastId });
            setAmount(''); setVendorName(''); setReference(''); setMilestoneId(''); setReceipt(null);
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to commit transaction', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const viewSecureReceipt = async (key: string) => {
        const toastId = toast.loading('Opening vault asset...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, projectId);
            toast.dismiss(toastId);
            const isDoc = key.toLowerCase().includes('.pdf') || key.toLowerCase().includes('.doc');
            if (isDoc) {
                window.open(viewUrl, '_blank');
            } else {
                setLightboxState({
                    isOpen: true,
                    items: [{ url: viewUrl, type: 'IMAGE', alt: 'Secure Receipt' }],
                    index: 0
                });
            }
        } catch (e) {
            toast.error('Access denied', { id: toastId });
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return null;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                <div className="bg-primary/5 p-5 border-b border-border/40 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">Record Disbursement</h3>
                        <p className="text-[11px] text-muted-foreground font-bold tracking-widest ">Treasury Outflow</p>
                    </div>
                </div>

                <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Target Implementation Phase</label>
                                    <Select onValueChange={setMilestoneId} value={milestoneId}>
                                        <SelectTrigger className="h-10 rounded-3xl bg-muted/20 border-border/40">
                                            <SelectValue placeholder="Select Phase..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-3xl">
                                            {timeline.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id} className="rounded-3xl text-xs">{m.phase}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Payee Name" placeholder="Authorized Vendor" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="h-10 rounded-3xl" />
                                    <Input label="Bank Reference" placeholder="Nip / Ft Reference" value={reference} onChange={(e) => setReference(e.target.value)} className="h-10 rounded-3xl" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Disbursement Amount (NGN)</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">₦</span>
                                        <Input
                                            placeholder="0.00"
                                            className="pl-10 h-11 text-lg font-bold rounded-3xl bg-muted/20 tabular-nums border-border/40 focus:bg-background transition-all"
                                            value={formatNumberInput(amount)}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                    Disbursement logs notify project owners & donors instantly. Please ensure all data points match the bank statement for audit compliance.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Compliance Receipt</label>
                                {receipt ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 group shadow-sm bg-muted">
                                        <Image
                                            src={receipt.previewUrl}
                                            alt="Receipt"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 400px"
                                            className="object-cover transition-transform group-hover:scale-105 duration-700"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                            <Button variant="destructive" size="sm" className="rounded-3xl font-bold h-8 text-[11px] px-4 shadow-lg active:scale-95" onClick={() => setReceipt(null)}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Asset
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <ImageUploader label="Upload Treasury Receipt" onUploadComplete={setReceipt} useCase="docs" />
                                )}
                            </div>

                            <Button onClick={handleSubmit} disabled={isLoading || !amount || !milestoneId || !vendorName || !reference} className="w-full h-11 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 border-0 transition-all active:scale-95">
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Commit disbursement
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-foreground tracking-tight">
                        <History className="h-4 w-4 text-primary" />
                        Disbursement Log
                    </h3>
                    <Badge variant="secondary" className="text-[10px] font-bold tracking-widest rounded-3xl bg-muted/50 border-border/40">
                        {disbursements.length} Validated Records
                    </Badge>
                </div>

                <div className="grid gap-2 md:hidden">
                    <AnimatePresence mode="popLayout">
                        {sortedDisbursements.map((d: any) => (
                            <motion.div
                                key={d.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden active:scale-[0.99] transition-all">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{d.vendorName}</p>
                                                <p className="text-[11px] font-bold text-primary tracking-tighter mt-0.5">
                                                    Phase: {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General Funds'}
                                                </p>
                                            </div>
                                            <p className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-border/40 pt-3">
                                            <div className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(d.amount, 'NGN')}</div>
                                            {d.receiptKey && (
                                                <Button variant="ghost" size="sm" className="h-7 rounded-3xl text-[11px] font-bold text-primary hover:bg-primary/5 transition-all" onClick={() => viewSecureReceipt(d.receiptKey)}>
                                                    <ExternalLink className="h-3 w-3 mr-1" /> View Receipt
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <Card className="hidden md:block rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-3 font-bold tracking-widest text-[10px]  cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('vendorName')}>
                                        <div className="flex items-center">Payee Vendor <SortIcon column="vendorName" /></div>
                                    </th>
                                    <th className="px-6 py-3 font-bold tracking-widest text-[10px]  cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center">Execution Date <SortIcon column="createdAt" /></div>
                                    </th>
                                    <th className="px-6 py-3 font-bold tracking-widest text-[10px]  text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end">Capital Value <SortIcon column="amount" /></div>
                                    </th>
                                    <th className="px-6 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {sortedDisbursements.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-xs text-muted-foreground italic font-medium">No disbursement records identified for this project.</td></tr>
                                ) : (
                                    sortedDisbursements.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-muted/20 transition-all text-xs group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">{d.vendorName}</div>
                                                <div className="text-[10px] text-muted-foreground font-bold tracking-tighter mt-0.5">
                                                    Phase: {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 opacity-40" />
                                                    {new Date(d.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold tabular-nums text-foreground">
                                                {formatCurrency(d.amount, 'NGN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {d.receiptKey && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => viewSecureReceipt(d.receiptKey)}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
                initialIndex={lightboxState.index}
            />
        </div>
    );
});