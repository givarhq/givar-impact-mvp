'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, Globe, Loader2, Mail, Hash, CheckCircle2, Banknote, UploadCloud, Link as LinkIcon, Trash2, Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ImageUploader } from '../proposals/media-uploader';
import { AnimatePresence, motion } from 'framer-motion';

export function CorporateSponsorshipTrigger({ projectId, projectCurrency }: { projectId: string; projectCurrency: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorEmail, setSponsorEmail] = useState('');
    const [amount, setAmount] = useState(''); // Settled NGN amount
    const [reference, setReference] = useState('');

    // FX State
    const [isForeign, setIsForeign] = useState(false);
    const [donorCurrency, setDonorCurrency] = useState('USD');
    const [donorAmount, setDonorAmount] = useState(''); // Original Foreign Amount
    const [fxRates, setFxRates] = useState<Record<string, number>>({});

    // Logo State
    const [logoMode, setLogoMode] = useState<'auto' | 'upload'>('auto');
    const [domain, setDomain] = useState('');
    const [logoError, setLogoError] = useState(false);
    const [uploadedLogo, setUploadedLogo] = useState<{ key: string; previewUrl: string } | null>(null);

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    // Using Google's Universal Favicon resolver which indexes any website on the internet
    const autoLogoUrl = cleanDomain && !logoError ? `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128` : '';

    // Fetch live FX rates on mount
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

        // Auto-calculate the NGN amount instantly
        const rawDonor = Number(parseFormattedNumber(val));
        if (rawDonor > 0 && fxRates[donorCurrency]) {
            const rate = 1 / fxRates[donorCurrency]; // NGN base -> Target currency inverse
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

    const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDomain(e.target.value);
        setLogoError(false);
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFormattedNumber(amount);
        const parsedDonorAmount = isForeign ? parseFormattedNumber(donorAmount) : undefined;

        if (!sponsorName.trim() || !sponsorEmail.trim() || !parsedAmount) {
            return toast.error('Please complete all required fields.');
        }

        if (isForeign && !parsedDonorAmount) {
            return toast.error('Please enter the original foreign currency amount.');
        }

        setIsLoading(true);
        const toastId = toast.loading('Logging corporate sponsorship to ledger...');

        try {
            // Convert to minor units (kobo/cents) before sending
            const amountMinor = (Number(parsedAmount) * 100).toString();
            const donorAmountMinor = parsedDonorAmount ? (Number(parsedDonorAmount) * 100).toString() : undefined;

            let finalLogoUrl = undefined;
            if (logoMode === 'auto' && autoLogoUrl) {
                finalLogoUrl = autoLogoUrl;
            } else if (logoMode === 'upload' && uploadedLogo) {
                finalLogoUrl = uploadedLogo.key; // The secure S3 key or Cloudinary URL
            }

            await ApiService.admin.logCorporateSponsorship(projectId, {
                sponsorName: sponsorName.trim(),
                sponsorEmail: sponsorEmail.trim(),
                amount: amountMinor,
                reference: reference.trim() || undefined,
                sponsorLogoUrl: finalLogoUrl,
                donorCurrency: isForeign ? donorCurrency : undefined,
                donorAmount: donorAmountMinor
            } as any);

            toast.success('Corporate sponsorship logged successfully', { id: toastId });
            setIsOpen(false);

            // Reset form
            setSponsorName('');
            setSponsorEmail('');
            setDomain('');
            setAmount('');
            setReference('');
            setIsForeign(false);
            setDonorAmount('');
            setUploadedLogo(null);

            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to log sponsorship', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="rounded-3xl h-10 px-6 font-bold text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all active:scale-95 gap-2"
            >
                <Building2 className="h-4 w-4" />
                <span>Log corporate sponsorship</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && setIsOpen(false)}>
                <DialogContent className="max-w-lg w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-h-[90vh] flex flex-col">
                    <DialogHeader className="px-6 md:px-8 pt-6 pb-2 border-none shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-lg font-bold truncate tracking-tight text-foreground">
                                    Corporate Sponsorship
                                </DialogTitle>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                    Record manual offline wire transfers.
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="px-6 md:px-8 py-4 space-y-6 overflow-y-auto no-scrollbar flex-1">

                        {/* LOGO RESOLUTION SECTION */}
                        <div className="space-y-3 p-4 rounded-3xl bg-muted/20 border border-border/40 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <label className="text-[11px] font-bold text-muted-foreground">Company logo</label>
                                <Tabs value={logoMode} onValueChange={(v: any) => setLogoMode(v)} className="w-[180px]">
                                    <TabsList className="h-8 bg-muted/50 p-0.5 rounded-2xl w-full border border-border/40">
                                        <TabsTrigger value="auto" className="rounded-[14px] text-[10px] font-bold gap-1.5 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1"><Globe className="h-3 w-3" /> Auto</TabsTrigger>
                                        <TabsTrigger value="upload" className="rounded-[14px] text-[10px] font-bold gap-1.5 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex-1"><UploadCloud className="h-3 w-3" /> Upload</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <AnimatePresence mode="wait">
                                {logoMode === 'auto' ? (
                                    <motion.div key="auto" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                            {autoLogoUrl ? (
                                                <Image src={autoLogoUrl} alt="Logo" width={48} height={48} className="object-contain p-1.5" onError={() => setLogoError(true)} unoptimized />
                                            ) : (
                                                <LinkIcon className="h-5 w-5 text-muted-foreground/30" />
                                            )}
                                        </div>
                                        <Input placeholder="Website (e.g. givarapp.com)" value={domain} onChange={handleDomainChange} disabled={isLoading} className="h-10 rounded-xl bg-background text-xs font-medium" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        {uploadedLogo ? (
                                            <div className="flex items-center justify-between p-2 bg-background border border-border/60 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 relative rounded-lg overflow-hidden border border-border/40 bg-muted">
                                                        <Image src={uploadedLogo.previewUrl} alt="Uploaded logo" fill className="object-contain" unoptimized />
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</span>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setUploadedLogo(null)} className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        ) : (
                                            <div className="h-20">
                                                <ImageUploader label="Upload logo (PNG/JPG)" onUploadComplete={setUploadedLogo} useCase="public" />
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* SPONSOR DETAILS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Corporate sponsor name *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Company name"
                                        value={sponsorName}
                                        onChange={(e) => setSponsorName(e.target.value)}
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
                                        placeholder="contact@company.com"
                                        value={sponsorEmail}
                                        onChange={(e) => setSponsorEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FINANCIAL DETAILS */}
                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                                    <Banknote className="h-4 w-4 text-primary" /> Transferred Capital
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
                                                    <SelectItem value="USD" className="text-xs font-bold">USD ($)</SelectItem>
                                                    <SelectItem value="GBP" className="text-xs font-bold">GBP (£)</SelectItem>
                                                    <SelectItem value="EUR" className="text-xs font-bold">EUR (€)</SelectItem>
                                                    <SelectItem value="CAD" className="text-xs font-bold">CAD (C$)</SelectItem>
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
                                            placeholder="Wire transfer ID"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value.replace(/[^A-Za-z0-9\-_]/g, '').toUpperCase())}
                                            disabled={isLoading}
                                            className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Live FX Calculation Helper */}
                            {isForeign && fxRates[donorCurrency] && (
                                <div className="flex items-start gap-2 mt-2 px-1">
                                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-medium text-muted-foreground leading-snug">
                                        Estimated at <strong className="text-foreground">₦{formatNumberInput(Math.round(1 / fxRates[donorCurrency]).toString())} / {donorCurrency}</strong>. Adjust the Naira value above to match the exact credit alert on your bank statement.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 md:px-8 pb-6 pt-3 flex justify-end gap-3 shrink-0 border-t border-border/40">
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                            className="rounded-3xl h-11 px-6 font-bold text-xs text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !sponsorName.trim() || !sponsorEmail.trim() || !amount.trim() || (isForeign && !donorAmount.trim())}
                            className="rounded-3xl h-11 px-8 font-bold text-xs shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98] border-0 gap-2"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Confirm entry
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}