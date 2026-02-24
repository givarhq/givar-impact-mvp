'use client';

import React, { useState, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Database,
    Globe,
    RefreshCcw,
    ArrowRightLeft,
    Ban,
    Calendar,
    Wrench,
    Sparkles,
    Info,
    ShieldCheck
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { Badge } from '../../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface LedgerOversightProps {
    initialSuspense: any[];
    activeProjects: any[];
}

export const LedgerOversightClient = memo(function LedgerOversightClient({
    initialSuspense,
    activeProjects
}: LedgerOversightProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('suspense');

    const [refInput, setRefInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [reconcileResult, setReconcileResult] = useState<any>(null);

    const [suspenseItems, setSuspenseItems] = useState(initialSuspense);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSweepConfirm, setShowSweepConfirm] = useState(false);

    const [refundModal, setRefundModal] = useState<{ isOpen: boolean; txId: string; reference: string }>({
        isOpen: false,
        txId: '',
        reference: ''
    });

    const refreshSuspense = async () => {
        const token = getCookie('givar_token') as string;
        if (!token) return;
        try {
            const data = await ApiService.admin.getSuspense(token);
            setSuspenseItems(data || []);
        } catch (e) {
            console.error("Failed To Refresh Suspense Queue");
        }
    };

    const handleVerifyRef = async () => {
        if (!refInput) return;
        setIsVerifying(true);
        setReconcileResult(null);
        try {
            const token = getCookie('givar_token') as string;
            const data = await ApiService.admin.verifyExternalRef(token, refInput.trim());
            setReconcileResult(data);
            if (data.canReconcile) {
                toast.success("Transaction discrepancy detected");
            }
        } catch (e) {
            toast.error('Failed to verify reference with external node');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleExecuteReconcile = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Initializing reconciliation...');
        try {
            await ApiService.admin.executeReconcile(refInput.trim());
            toast.success('Internal ledger synchronized successfully', { id: toastId });
            handleVerifyRef();
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Sync protocol failure", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDustSweep = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Executing Dust Sweep Protocol...');
        try {
            const result = await ApiService.admin.triggerDustSweep();
            if (result.swept > 0) {
                toast.success(`Aligned ${result.swept} stagnant projects`, { id: toastId });
            } else {
                toast.error("No stagnant projects identified", { id: toastId });
            }
            setShowSweepConfirm(false);
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Protocol execution failed", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const openRefundPrompt = (txId: string, reference: string) => {
        setRefundModal({ isOpen: true, txId, reference });
    };

    const handleRefund = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Triggering external refund...');
        try {
            await ApiService.admin.resolveSuspense(refundModal.txId, { action: 'REFUND' });
            toast.success('Refund triggered & ledger marked reversed', { id: toastId });
            setRefundModal({ ...refundModal, isOpen: false });
            await refreshSuspense();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Refund failed', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="md:hidden">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Ledger Oversight</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-11 w-full md:w-fit border border-border/50 shadow-inner">
                        <TabsTrigger value="suspense" className="rounded-3xl px-6 h-full gap-2.5 font-bold text-[11px] tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Suspense Queue
                            {suspenseItems.length > 0 && (
                                <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                    {suspenseItems.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="reconcile" className="rounded-3xl px-6 h-full gap-2.5 font-bold text-[11px] tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Manual Sync
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="rounded-3xl px-6 h-full gap-2.5 font-bold text-[11px] tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <Wrench className="h-3.5 w-3.5" />
                            System Maintenance
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="suspense" className="space-y-4 outline-none">
                    <AnimatePresence mode="popLayout">
                        {suspenseItems.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-24 text-center border-2 border-dashed border-border/60 rounded-3xl bg-card/30 backdrop-blur-sm"
                            >
                                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/[0.03] shadow-inner">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">Ledger Balanced</h3>
                                <p className="text-muted-foreground text-xs max-w-sm mx-auto mt-2 font-medium leading-relaxed">
                                    No unallocated transactions detected. All platform capital is currently synchronized with active causes.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid gap-4">
                                {suspenseItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <Card className="rounded-3xl border-border/50 bg-card overflow-hidden group hover:shadow-lg transition-all duration-300">
                                            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className="h-14 w-14 rounded-[22px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner group-hover:scale-105 transition-transform">
                                                        <Database className="h-7 w-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-3 mb-1.5">
                                                            <span className="text-[11px] font-black tracking-[0.2em] text-amber-600 ">Orphaned Capital</span>
                                                            <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-border/50 rounded-3xl px-2">Ref: {item.reference}</Badge>
                                                        </div>
                                                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                                            <SmartCurrency amount={item.amount} currency={item.currency} visible={true} size="large" className="text-foreground font-black" />
                                                            <span className="text-muted-foreground font-bold text-xs line-clamp-1">
                                                                Actor: <span className="text-foreground">{item.wallet?.user?.email || 'External Identity'}</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <p className="text-[10px] text-muted-foreground font-black tracking-widest flex items-center gap-1.5 ">
                                                                <Calendar className="h-3 w-3 opacity-50" /> Recorded On {formatDate(item.createdAt).split(',')[0]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 md:flex-none rounded-3xl h-11 px-6 border-destructive/20 text-destructive hover:bg-destructive/5 font-black text-[10px] tracking-widest transition-all active:scale-95"
                                                        onClick={() => openRefundPrompt(item.id, item.reference)}
                                                        disabled={isProcessing}
                                                    >
                                                        <Ban className="h-3.5 w-3.5 mr-2" /> Refund
                                                    </Button>
                                                    <Link href={`/admin/ledger/reallocate/${item.id}`} className="flex-1 md:flex-none">
                                                        <Button
                                                            className="w-full h-11 px-8 rounded-3xl font-black text-[10px] tracking-widest shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-95 border-0"
                                                            disabled={isProcessing}
                                                        >
                                                            <ArrowRightLeft className="h-3.5 w-3.5" /> Re-Allocate
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </TabsContent>

                <TabsContent value="reconcile" className="space-y-6 pt-2 outline-none">
                    <Card className="rounded-3xl p-2 border-border/50 bg-card shadow-sm overflow-hidden">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Verify External Ref (Paystack)..."
                                    className="pl-12 h-14 rounded-3xl bg-muted/20 border-transparent focus:bg-background focus:border-primary/20 text-base font-mono tracking-tight shadow-inner transition-all"
                                    value={refInput}
                                    onChange={(e) => setRefInput(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleVerifyRef}
                                disabled={isVerifying || !refInput}
                                className="h-14 px-10 rounded-3xl font-black tracking-widest shadow-xl shadow-primary/20 text-[11px]  transition-all active:scale-95 border-0"
                            >
                                {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search Ledger'}
                            </Button>
                        </CardContent>
                    </Card>

                    {reconcileResult && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-3xl bg-card border-border/50 overflow-hidden shadow-sm hover:border-blue-500/30 transition-all group">
                                <CardHeader className="bg-blue-500/[0.02] border-b border-border/50 p-6">
                                    <CardTitle className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 text-blue-500 ">
                                        <Globe className="h-3.5 w-3.5" /> External Gateway
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-border/40">
                                        <span className="text-[11px] font-black tracking-widest text-muted-foreground ">Status</span>
                                        <BadgeStatus status={reconcileResult.external.status} />
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-border/40">
                                        <span className="text-[11px] font-black tracking-widest text-muted-foreground ">Value</span>
                                        <div className="text-right">
                                            <p className="font-black text-xl text-foreground">₦{(reconcileResult.external.amount / 100).toLocaleString()}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono tracking-widest mt-0.5">{reconcileResult.external.currency}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-[11px] font-black tracking-widest text-muted-foreground ">Channel</span>
                                        <span className="text-[10px] font-black tracking-widest bg-secondary px-4 py-1 rounded-3xl border border-border/50 ">{reconcileResult.external.channel}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl bg-card border-border/50 overflow-hidden shadow-sm relative hover:border-primary/30 transition-all group">
                                <CardHeader className="bg-primary/[0.02] border-b border-border/50 p-6">
                                    <CardTitle className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 text-primary ">
                                        <Database className="h-3.5 w-3.5" /> Internal Ledger
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 h-full flex flex-col justify-center min-h-[220px]">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="text-[11px] font-black tracking-widest text-muted-foreground ">Sync Status</span>
                                        <BadgeStatus status={reconcileResult.internal.status === 'success' ? 'Synchronized' : 'Missing'} />
                                    </div>

                                    {reconcileResult.canReconcile ? (
                                        <div className="space-y-4 animate-in zoom-in-95">
                                            <div className="p-5 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20 flex gap-4">
                                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                                <p className="text-[11px] text-amber-900 leading-relaxed font-bold tracking-tight">
                                                    Discrepancy detected. Payment verified externally but absent internally. Forensic repair recommended.
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full h-12 rounded-3xl font-black tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg text-white gap-2 transition-all hover:scale-[1.01] text-[10px]  border-0"
                                                onClick={handleExecuteReconcile}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                Initialize Forensic Sync
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4 text-emerald-500 animate-in zoom-in duration-500">
                                            <div className="h-20 w-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 ring-4 ring-emerald-500/[0.03] shadow-inner">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <span className="text-[11px] font-black tracking-[0.3em] ">Consensus Achieved</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6 outline-none pt-2">
    <div className="max-w-2xl">
        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden group hover:border-primary/20 transition-all">
            <CardHeader className="bg-primary/[0.02] border-b border-border/40 p-6">
                <CardTitle className="text-sm font-bold flex items-center gap-3 text-foreground">
                    <Sparkles className="h-5 w-5 text-primary" /> Dust Sweep Protocol
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-6">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Cleans up project accounts with very small balances (less than ₦100) that haven’t been active for over 30 days.
                </p>

                <div className="p-5 rounded-3xl bg-muted/20 border border-border/40 flex items-start gap-4">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                        Project goals will be updated to match actual funds raised. Owners of affected projects will get an automatic notice about the changes.
                    </p>
                </div>

                <Button
                    onClick={() => setShowSweepConfirm(true)}
                    disabled={isProcessing}
                    className="w-full h-12 rounded-3xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 border-0 transition-all active:scale-95"
                >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Sweep"}
                </Button>
            </CardContent>
        </Card>
    </div>
</TabsContent>
            </Tabs>

            <ConfirmModal
                isOpen={showSweepConfirm}
                onClose={() => setShowSweepConfirm(false)}
                onConfirm={handleDustSweep}
                isLoading={isProcessing}
                variant="warning"
                title="Execute Dust Sweep"
                description="This protocol will align the goals & finalize all stagnant project nodes with balances under ₦100. This action is audited & irreversible."
                confirmText="Execute Protocol"
            />

            <ConfirmModal
                isOpen={refundModal.isOpen}
                onClose={() => setRefundModal({ ...refundModal, isOpen: false })}
                onConfirm={handleRefund}
                isLoading={isProcessing}
                variant="destructive"
                title="Trigger Audit Refund"
                description={`Initialize an automated external refund for ${refundModal.reference}? This procedure is forensic & irreversible.`}
                confirmText="Confirm Refund"
            />
        </div>
    );
});

function BadgeStatus({ status }: { status: string }) {
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'synchronized';
    return (
        <span className={cn(
            "px-5 py-1.5 rounded-3xl text-[10px] font-black tracking-[0.1em] border transition-all ",
            isSuccess
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
        )}>
            {status}
        </span>
    );
}
