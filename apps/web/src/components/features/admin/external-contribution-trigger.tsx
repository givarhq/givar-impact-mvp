'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Loader2, Mail, Hash, CheckCircle2, Banknote, UploadCloud, Trash2, Info, FileText, Lock } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

export function ExternalContributionTrigger({
    projectId,
    projectCurrency,
    projectStatus,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    hideTrigger = false
}: {
    projectId: string;
    projectCurrency: string;
    projectStatus: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = (val: boolean) => {
        if (setControlledOpen) setControlledOpen(val);
        else setInternalOpen(val);
    };

    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);

    const [donorName, setDonorName] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [uploadedProof, setUploadedProof] = useState<{ key: string; name: string } | null>(null);

    const [isForeign, setIsForeign] = useState(false);
    const [donorCurrency, setDonorCurrency] = useState('USD');
    const [donorAmount, setDonorAmount] = useState('');
    const [fxRates, setFxRates] = useState<Record<string, number>>({});

    const isLocked = projectStatus === 'COMPLETED' || projectStatus === 'SUSPENDED';

    useEffect(() => {
        fetch('https://open.er-api.com/v6/latest/NGN')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates) {
                    setFxRates(data.rates);
                }
            })
            .catch(() => console.error("Failed to fetch live FX rates"));
    }, []);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        setAmount(formatted);
    };

    const handleDonorAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const formatted = formatNumberInput(val);
        setDonorAmount(formatted);

        const rawDonor = Number(parseFormattedNumber(val));
        if (rawDonor > 0 && fxRates[donorCurrency]) {
            const rate = 1 / fxRates[donorCurrency];
            const estimatedNgn = rawDonor * rate;
            setAmount(formatNumberInput(Math.round(estimatedNgn).toString()));
        } else if (rawDonor === 0) {
            setAmount('');
        }
    };

    const handleCurrencyChange = (val: string) => {
        setDonorCurrency(val);
        const rawDonor = Number(parseFormattedNumber(donorAmount));
        if (rawDonor > 0 && fxRates[val]) {
            const rate = 1 / fxRates[val];
            const estimatedNgn = rawDonor * rate;
            setAmount(formatNumberInput(Math.round(estimatedNgn).toString()));
        }
    };

    const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit');
            e.target.value = '';
            return;
        }

        setIsUploadingProof(true);
        const toastId = toast.loading('Encrypting and uploading proof document...');

        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
                fileType: file.type,
                useCase: 'docs',
            });

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            setUploadedProof({ key, name: file.name });
            toast.success('Proof document attached', { id: toastId });
        } catch (err) {
            toast.error('Failed to upload proof document', { id: toastId });
        } finally {
            setIsUploadingProof(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFormattedNumber(amount);
        const parsedDonorAmount = isForeign ? parseFormattedNumber(donorAmount) : undefined;

        if (!donorName.trim() || !donorEmail.trim() || !parsedAmount || !uploadedProof?.key) {
            return toast.error('Please complete all required fields and upload a proof document.');
        }

        if (isForeign && !parsedDonorAmount) {
            return toast.error('Please enter the original foreign currency amount.');
        }

        setIsLoading(true);
        const toastId = toast.loading('Recording external contribution...');

        try {
            const amountMinor = (Number(parsedAmount) * 100).toString();
            const donorAmountMinor = parsedDonorAmount ? (Number(parsedDonorAmount) * 100).toString() : undefined;

            await ApiService.admin.logExternalContribution(projectId, {
                donorName: donorName.trim(),
                donorEmail: donorEmail.trim(),
                amount: amountMinor,
                receiptKey: uploadedProof.key,
                reference: reference.trim() || undefined,
                donorCurrency: isForeign ? donorCurrency : undefined,
                donorAmount: donorAmountMinor
            });

            toast.success('External contribution recorded successfully', { id: toastId });
            setIsOpen(false);

            setDonorName('');
            setDonorEmail('');
            setAmount('');
            setReference('');
            setUploadedProof(null);
            setIsForeign(false);
            setDonorAmount('');

            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to record external contribution', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!hideTrigger && (
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    disabled={isLocked}
                    className="rounded-3xl h-10 px-5 font-bold text-xs shadow-sm border-border/60 bg-background text-foreground hover:bg-muted transition-all active:scale-95 gap-2"
                >
                    {isLocked ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4 text-primary" />}
                    <span>{isLocked ? 'Donation ended' : 'Log External Contribution'}</span>
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && setIsOpen(false)}>
                <DialogContent className="max-w-lg w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-h-[90vh] flex flex-col">
                    <DialogHeader className="px-6 md:px-8 pt-6 pb-2 border-none shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-lg font-bold truncate tracking-tight text-foreground">
                                    External Contribution
                                </DialogTitle>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                    Record offline wire transfers or direct hospital payments with verified proof.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-6 md:px-8 py-4 space-y-6 overflow-y-auto no-scrollbar flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Donor name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Full name"
                                        value={donorName}
                                        onChange={(e) => setDonorName(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Email address for receipt *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="donor@example.com"
                                        value={donorEmail}
                                        onChange={(e) => setDonorEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                    <Banknote className="h-4 w-4 text-primary" /> Contribution amount
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground">Foreign currency?</span>
                                    <button
                                        type="button"
                                        onClick={() => setIsForeign(!isForeign)}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            isForeign ? "bg-primary" : "bg-muted-foreground/30"
                                        )}
                                    >
                                        <span className={cn("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out", isForeign ? "translate-x-4" : "translate-x-0")} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {isForeign && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-muted-foreground ml-1">Original foreign amount sent</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Select value={donorCurrency} onValueChange={handleCurrencyChange} disabled={isLoading}>
                                                <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 text-xs font-bold col-span-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
                                                    <SelectItem value="USD" className="text-xs font-bold">USD</SelectItem>
                                                    <SelectItem value="GBP" className="text-xs font-bold">GBP</SelectItem>
                                                    <SelectItem value="EUR" className="text-xs font-bold">EUR</SelectItem>
                                                    <SelectItem value="CAD" className="text-xs font-bold">CAD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="Foreign amount"
                                                value={donorAmount}
                                                onChange={handleDonorAmountChange}
                                                disabled={isLoading}
                                                className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold tabular-nums col-span-2"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground ml-1">Settled amount ({projectCurrency}) *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</span>
                                        <Input
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            disabled={isLoading}
                                            className="h-11 pl-8 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted-foreground ml-1">Bank reference (Optional)</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Transfer reference"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value.replace(/[^A-Za-z0-9\-_]/g, '').toUpperCase())}
                                            disabled={isLoading}
                                            className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isForeign && fxRates[donorCurrency] && (
                                <div className="flex items-start gap-2 mt-2 px-1">
                                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-medium text-muted-foreground leading-snug">
                                        Estimated at <strong className="text-foreground">₦{formatNumberInput(Math.round(1 / fxRates[donorCurrency]).toString())} / {donorCurrency}</strong>. Adjust the Naira value above to match the exact amount settled.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 pt-4 border-t border-border/40">
                            <label className="text-[11px] font-bold text-foreground ml-1">Proof Document (Hospital invoice or bank receipt) *</label>
                            {uploadedProof ? (
                                <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border/60 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                            <FileText className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{uploadedProof.name}</p>
                                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                                <CheckCircle2 className="h-3 w-3" /> Proof document attached
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setUploadedProof(null)}
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className={cn(
                                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/60 rounded-2xl cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all text-center p-4",
                                    isUploadingProof && "opacity-50 cursor-wait pointer-events-none"
                                )}>
                                    {isUploadingProof ? (
                                        <Loader2 className="h-5 w-5 text-primary animate-spin mb-1.5" />
                                    ) : (
                                        <UploadCloud className="h-5 w-5 text-muted-foreground mb-1.5" />
                                    )}
                                    <span className="text-xs font-bold text-foreground">Upload proof document</span>
                                    <span className="text-[10px] text-muted-foreground font-medium mt-0.5">PDF, JPG, PNG up to 10MB</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,image/jpeg,image/png,image/webp"
                                        onChange={handleProofUpload}
                                        disabled={isUploadingProof || isLoading}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="px-6 md:px-8 pb-6 pt-3 flex justify-end gap-3 min-w-0 border-t border-border/40 bg-muted/5">
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading || isUploadingProof}
                            className="rounded-3xl h-11 px-6 font-bold text-xs text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || isUploadingProof || !donorName.trim() || !donorEmail.trim() || !amount.trim() || !uploadedProof?.key || (isForeign && !donorAmount.trim())}
                            className="rounded-3xl h-11 px-8 font-bold text-xs shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.98] border-0 gap-2"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Confirm Entry
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}