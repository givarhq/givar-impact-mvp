'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, DollarSign, Globe, Loader2, Mail, Hash, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

export function CorporateSponsorshipTrigger({ projectId, projectCurrency }: { projectId: string; projectCurrency: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [sponsorName, setSponsorName] = useState('');
    const [sponsorEmail, setSponsorEmail] = useState('');
    const [domain, setDomain] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [logoError, setLogoError] = useState(false);

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    const sponsorLogoUrl = cleanDomain && !logoError ? `https://logo.clearbit.com/${cleanDomain}` : '';

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumberInput(e.target.value);
        setAmount(formatted);
    };

    const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDomain(e.target.value);
        setLogoError(false); // Reset error state to attempt fetching new domain
    };

    const handleSubmit = async () => {
        const parsedAmount = parseFormattedNumber(amount);
        if (!sponsorName.trim() || !sponsorEmail.trim() || !parsedAmount) {
            return toast.error('Please complete all required fields.');
        }

        setIsLoading(true);
        const toastId = toast.loading('Logging corporate sponsorship to ledger...');

        try {
            // Convert to minor units (kobo/cents) before sending
            const amountMinor = (Number(parsedAmount) * 100).toString();

            await ApiService.admin.logCorporateSponsorship(projectId, {
                sponsorName: sponsorName.trim(),
                sponsorEmail: sponsorEmail.trim(),
                amount: amountMinor,
                reference: reference.trim() || undefined,
                sponsorLogoUrl: sponsorLogoUrl || undefined
            });

            toast.success('Corporate sponsorship logged successfully', { id: toastId });
            setIsOpen(false);

            // Reset form
            setSponsorName('');
            setSponsorEmail('');
            setDomain('');
            setAmount('');
            setReference('');

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
                <DialogContent className="max-w-lg w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <DialogHeader className="px-6 md:px-8 pt-6 pb-2 border-none">
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

                    <div className="px-6 md:px-8 py-4 space-y-5">
                        <div className="flex items-center gap-5 p-4 rounded-3xl bg-muted/20 border border-border/40 shadow-sm">
                            <div className="h-14 w-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                {sponsorLogoUrl ? (
                                    <Image
                                        src={sponsorLogoUrl}
                                        alt="Company Logo"
                                        width={56}
                                        height={56}
                                        className="object-contain p-2"
                                        onError={() => setLogoError(true)}
                                        unoptimized
                                    />
                                ) : (
                                    <Building2 className="h-6 w-6 text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <label className="text-[11px] font-bold text-muted-foreground">Website domain (Optional)</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="e.g. mtn.com"
                                        value={domain}
                                        onChange={handleDomainChange}
                                        disabled={isLoading}
                                        className="h-10 pl-9 rounded-2xl bg-background border-border/60 text-xs font-medium focus:bg-white shadow-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Amount received ({projectCurrency}) *</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        disabled={isLoading}
                                        className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Bank reference (Optional)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Wire transfer ID"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value.replace(/[^A-Za-z0-9\-_]/g, '').toUpperCase())}
                                        disabled={isLoading}
                                        className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 md:px-8 pb-6 pt-2 flex justify-end gap-3 min-w-0">
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
                            disabled={isLoading || !sponsorName.trim() || !sponsorEmail.trim() || !amount.trim()}
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