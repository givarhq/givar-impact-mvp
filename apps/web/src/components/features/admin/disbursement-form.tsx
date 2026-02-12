'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    DollarSign,
    History,
    ExternalLink,
    ShieldCheck,
    Building2,
    CheckCircle2,
    Trash2,
    ArrowUp,
    ArrowDown,
    Calendar,
    Hash
} from 'lucide-react';
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
import { cn } from '../../../lib/utils/cn';

interface DisbursementFormProps {
    projectId: string;
    timeline: any[];
    disbursements?: any[];
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

export function DisbursementForm({ projectId, timeline, disbursements = [] }: DisbursementFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [milestoneId, setMilestoneId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [receipt, setReceipt] = useState<{ key: string; previewUrl: string } | null>(null);

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

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
            return toast.error('Check required fields');
        }

        setIsLoading(true);
        try {
            const minorAmount = parseFormattedNumber(amount) + '00';
            await ApiService.admin.recordDisbursement(projectId, {
                milestoneId,
                vendorName,
                amount: minorAmount,
                reference,
                receiptKey: receipt?.key
            });

            toast.success('Disbursement recorded');
            setAmount(''); setVendorName(''); setReference(''); setMilestoneId(''); setReceipt(null);
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to record');
        } finally {
            setIsLoading(false);
        }
    };

    const viewSecureReceipt = async (key: string) => {
        const toastId = toast.loading('Opening receipt...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, projectId);
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Access Denied', { id: toastId });
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
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Treasury Outflow</p>
                    </div>
                </div>

                <CardContent className="p-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Target Phase</label>
                                    <Select onValueChange={setMilestoneId} value={milestoneId}>
                                        <SelectTrigger className="h-10 rounded-3xl bg-muted/20 border-border/40">
                                            <SelectValue placeholder="Select phase..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-3xl">
                                            {timeline.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id} className="rounded-3xl text-xs">{m.phase}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Payee" placeholder="Vendor Name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="h-10 rounded-3xl" />
                                    <Input label="Bank Reference" placeholder="NIP/FT/..." value={reference} onChange={(e) => setReference(e.target.value)} className="h-10 rounded-3xl" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Amount (NGN)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">₦</span>
                                        <Input
                                            placeholder="0.00"
                                            className="pl-10 h-11 text-lg font-bold rounded-3xl bg-muted/20 tabular-nums border-border/40"
                                            value={formatNumberInput(amount)}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                    Disbursement logs notify project owners and donors. Ensure data precision for audit compliance.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Bank Receipt</label>
                                {receipt ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 group shadow-sm">
                                        <img src={receipt.previewUrl} className="object-cover w-full h-full" alt="Receipt" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <Button variant="destructive" size="sm" className="rounded-3xl font-bold h-8 text-[10px] px-4" onClick={() => setReceipt(null)}>
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <ImageUploader label="Upload Receipt" onUploadComplete={setReceipt} useCase="docs" />
                                )}
                            </div>

                            <Button onClick={handleSubmit} disabled={isLoading || !amount || !milestoneId || !vendorName || !reference} className="mt-auto w-full h-11 rounded-3xl font-bold text-xs shadow-sm">
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                Commit Funds
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-foreground uppercase tracking-tight">
                        <History className="h-4 w-4 text-primary" />
                        Disbursement Log
                    </h3>
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-widest rounded-3xl">
                        {disbursements.length} Records
                    </Badge>
                </div>

                <div className="grid gap-2 md:hidden">
                    {sortedDisbursements.map((d: any) => (
                        <Card key={d.id} className="rounded-3xl border-border/40 shadow-sm">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{d.vendorName}</p>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-tighter mt-0.5">
                                            {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General Funds'}
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex justify-between items-end border-t border-border/40 pt-3">
                                    <div className="text-sm font-bold tabular-nums">{formatCurrency(d.amount, 'NGN')}</div>
                                    {d.receiptKey && (
                                        <Button variant="ghost" size="sm" className="h-7 rounded-3xl text-[10px] font-bold text-primary" onClick={() => viewSecureReceipt(d.receiptKey)}>
                                            <ExternalLink className="h-3 w-3 mr-1" /> View
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="hidden md:block rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-3 font-bold uppercase tracking-widest text-[11px] cursor-pointer hover:text-foreground" onClick={() => handleSort('vendorName')}>
                                        <div className="flex items-center">Vendor <SortIcon column="vendorName" /></div>
                                    </th>
                                    <th className="px-6 py-3 font-bold uppercase tracking-widest text-[11px] cursor-pointer hover:text-foreground" onClick={() => handleSort('createdAt')}>
                                        <div className="flex items-center">Date <SortIcon column="createdAt" /></div>
                                    </th>
                                    <th className="px-6 py-3 font-bold uppercase tracking-widest text-[11px] text-right" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end">Amount <SortIcon column="amount" /></div>
                                    </th>
                                    <th className="px-6 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {sortedDisbursements.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-xs text-muted-foreground italic font-medium">No disbursements recorded.</td></tr>
                                ) : (
                                    sortedDisbursements.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-muted/30 transition-all text-xs">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground">{d.vendorName}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-0.5">
                                                    {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-muted-foreground">
                                                {new Date(d.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold tabular-nums">
                                                {formatCurrency(d.amount, 'NGN')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {d.receiptKey && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-3xl" onClick={() => viewSecureReceipt(d.receiptKey)}>
                                                        <ExternalLink className="h-3.5 w-3.5" />
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
        </div>
    );
}