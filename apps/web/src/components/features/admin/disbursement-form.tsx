'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2,
    DollarSign,
    History,
    ExternalLink,
    ShieldCheck,
    Building2,
    CheckCircle2,
    Trash2
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

interface DisbursementFormProps {
    projectId: string;
    timeline: any[];
    disbursements?: any[];
}

export function DisbursementForm({ projectId, timeline, disbursements = [] }: DisbursementFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [milestoneId, setMilestoneId] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [receipt, setReceipt] = useState<{ key: string; previewUrl: string } | null>(null);

    const handleSubmit = async () => {
        if (!milestoneId || !vendorName || !amount || !reference) {
            return toast.error('Please fill in all required payment details.');
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

            toast.success('Disbursement recorded and proposer notified.');

            // Reset Form
            setAmount('');
            setVendorName('');
            setReference('');
            setMilestoneId('');
            setReceipt(null);

            router.refresh();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to record disbursement.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const viewSecureReceipt = async (key: string) => {
        const toastId = toast.loading('Opening secure receipt...');
        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, projectId);
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (e) {
            toast.error('Access Denied', { id: toastId });
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">

            <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-xl">
                <div className="bg-primary/5 p-6 border-b border-border/50 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Record Disbursement</h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Treasury Outflow Management</p>
                    </div>
                </div>

                <CardContent className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        <div className="lg:col-span-7 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Target Milestone</label>
                                    <Select onValueChange={setMilestoneId} value={milestoneId}>
                                        <SelectTrigger className="h-12 rounded-xl bg-background/50">
                                            <SelectValue placeholder="Select a project phase..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {timeline.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.phase}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Vendor/Payee Name"
                                        placeholder="Legal Entity Name"
                                        value={vendorName}
                                        onChange={(e) => setVendorName(e.target.value)}
                                        className="h-12"
                                    />
                                    <Input
                                        label="Bank Transaction Ref"
                                        placeholder="NIP/FT/..."
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase ml-1">Amount Disbursed (NGN)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-lg">₦</span>
                                        <Input
                                            placeholder="0.00"
                                            className="pl-10 h-14 text-xl font-bold rounded-xl bg-background/50 tabular-nums"
                                            value={formatNumberInput(amount)}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed font-medium">
                                    Logging a disbursement will automatically notify the project owner to provide Proof of Progress. Ensure the amount matches your bank transfer exactly.
                                </p>
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Bank Receipt</label>
                                    <Badge variant="outline" className="text-[9px] h-4 rounded px-1.5 border-dashed">Optional</Badge>
                                </div>
                                {receipt ? (
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-border group shadow-lg">
                                        <img src={receipt.previewUrl} className="object-cover w-full h-full" alt="Bank Receipt" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="rounded-xl font-bold h-10 px-4"
                                                onClick={() => setReceipt(null)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Remove Proof
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <ImageUploader
                                        label="Upload Receipt (Optional)"
                                        onUploadComplete={setReceipt}
                                        useCase="docs"
                                    />
                                )}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !amount || !milestoneId || !vendorName || !reference}
                                className="mt-auto w-full h-16 rounded-[20px] text-lg font-bold shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : <CheckCircle2 className="h-6 w-6 mr-2" />}
                                Commit Disbursement
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-xl flex items-center gap-3 text-foreground">
                        <History className="h-6 w-6 text-primary" />
                        Historical Disbursements
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-lg border border-border/50">
                        {disbursements.length} Records
                    </span>
                </div>

                <div className="rounded-[32px] border border-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Vendor & Milestone</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Bank Reference</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Amount</th>
                                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Evidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {disbursements.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground italic font-medium">
                                            No disbursements have been logged for this project.
                                        </td>
                                    </tr>
                                ) : (
                                    disbursements.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-muted/20 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground leading-none">{d.vendorName}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1.5">
                                                            {timeline.find((m: any) => m.id === d.milestoneId)?.phase || 'General Funds'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                                                    {d.reference}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="font-bold text-foreground tabular-nums text-base">
                                                    {formatCurrency(d.amount, 'NGN')}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {new Date(d.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                {d.receiptKey ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-xl h-9 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
                                                        onClick={() => viewSecureReceipt(d.receiptKey)}
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" /> View Receipt
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">No Proof</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}