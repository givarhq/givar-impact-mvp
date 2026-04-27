'use client';

import React, { useState, memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Database,
    Globe,
    RefreshCcw,
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
    const searchParams = useSearchParams();
    const searchRef = searchParams.get('search');

    const [activeTab, setActiveTab] = useState(searchRef ? 'reconcile' : 'suspense');
    const [refInput, setRefInput] = useState(searchRef || '');
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

    useEffect(() => {
        if (searchRef && !isVerifying && !reconcileResult) {
            handleVerifyRef(searchRef);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchRef]);

    const handleVerifyRef = async (overrideRef?: string) => {
        const targetRef = overrideRef || refInput;
        if (!targetRef) return;
        setIsVerifying(true);
        setReconcileResult(null);
        try {
            const token = getCookie('givar_token') as string;
            const data = await ApiService.admin.verifyExternalRef(token, targetRef.trim());
            setReconcileResult(data);
            if (data.canReconcile) {
                toast.success("Routing discrepancy detected");
            }
        } catch (e) {
            toast.error('Failed to verify reference with external node');
        } finally {
            setIsVerifying(false);
        }
    };

    const refreshSuspense = async () => {
        const token = getCookie('givar_token') as string;
        if (!token) return;
        try {
            const data = await ApiService.admin.getSuspense(token);
            setSuspenseItems(data || []);
        } catch (e) {
            console.error("Failed to refresh pending queue");
        }
    };

    const handleExecuteReconcile = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Initializing sync...');
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
        const toastId = toast.loading('Executing dust sweep protocol...');
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
        const toastId = toast.loading('Initiating refund...');
        try {
            await ApiService.admin.resolveSuspense(refundModal.txId, { action: 'REFUND' });
            toast.success('Refund initiated and ledger updated', { id: toastId });
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
                <h1 className="text-lg font-bold  text-foreground">Ledger Oversight</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-11 w-full md:w-fit border border-border/40 shadow-inner">
                        <TabsTrigger value="suspense" className="rounded-3xl px-6 h-full gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Pending Routing
                            {suspenseItems.length > 0 && (
                                <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {suspenseItems.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="reconcile" className="rounded-3xl px-6 h-full gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Manual Sync
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="rounded-3xl px-6 h-full gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
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
                                className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-card/30 backdrop-blur-sm"
                            >
                                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-inner">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground ">Ledger balanced</h3>
                                <p className="text-muted-foreground text-xs max-w-sm mx-auto mt-2 font-medium leading-relaxed">
                                    No unallocated funds detected. All payments are currently routed to active causes.
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
                                        <Card className="rounded-3xl border border-border/40 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 group relative overflow-hidden h-full">
                                            <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
                                                <div className="flex items-start gap-4 md:gap-5 flex-1 min-w-0">
                                                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner group-hover:scale-105 transition-transform">
                                                        <Database className="h-6 w-6 md:h-7 md:w-7" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <p className="text-xs font-bold text-amber-600">Unallocated Funds</p>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(item.reference);
                                                                    toast.success("Reference copied");
                                                                }}
                                                                className="outline-none"
                                                                title="Click to copy"
                                                            >
                                                                <Badge variant="outline" className="font-mono text-[10px] bg-muted/40 border-border/40 rounded-3xl px-2 py-0.5 text-muted-foreground shadow-none hover:border-primary/40 hover:text-primary transition-all cursor-pointer">
                                                                    Ref: <span className="hidden md:inline">{item.reference}</span>
                                                                    <span className="md:hidden">{item.reference.slice(0, 12)}...</span>
                                                                </Badge>
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <SmartCurrency amount={item.amount} currency={item.currency} visible={true} size="large" className="text-foreground font-bold " />
                                                                {item.metadata?.donorCurrency && item.metadata?.donorCurrency !== 'NGN' && (
                                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-2 py-0.5 shadow-sm font-bold">
                                                                        ≈ {item.metadata.donorCurrency} {item.metadata.donorAmount}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-medium truncate">
                                                                Source: <span className="text-foreground font-bold">{item.wallet?.user?.email || item.metadata?.guestEmail || 'External identity'}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                                                <Calendar className="h-3.5 w-3.5 opacity-50" /> Recorded on {formatDate(item.createdAt).split(',')[0]}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/40">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 md:flex-none rounded-3xl h-10 px-6 border-border/60 text-foreground hover:bg-muted font-bold text-xs transition-all active:scale-95"
                                                        onClick={() => openRefundPrompt(item.id, item.reference)}
                                                        disabled={isProcessing}
                                                    >
                                                        Refund
                                                    </Button>
                                                    <Link href={`/admin/ledger/reallocate/${item.id}`} className="flex-1 md:flex-none">
                                                        <Button
                                                            className="w-full h-10 px-6 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] border-0 bg-primary hover:bg-primary/90 text-white"
                                                            disabled={isProcessing}
                                                        >
                                                            Route funds
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
                    <Card className="rounded-3xl p-2 border-border/40 bg-card shadow-sm overflow-hidden">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Verify external reference (Paystack)..."
                                    className="pl-11 h-12 rounded-3xl bg-muted/20 border-transparent focus:bg-background focus:border-primary/30 text-sm font-medium shadow-inner transition-all"
                                    value={refInput}
                                    onChange={(e) => setRefInput(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() => handleVerifyRef()}
                                disabled={isVerifying || !refInput}
                                className="h-12 px-8 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 border-0 bg-primary hover:bg-primary/90 text-white"
                            >
                                {isVerifying ? <Loader2 className="animate-spin h-4 w-4" /> : 'Search ledger'}
                            </Button>
                        </CardContent>
                    </Card>

                    {reconcileResult && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-3xl bg-card border-border/40 overflow-hidden shadow-sm hover:border-blue-500/30 transition-all group">
                                <CardHeader className="bg-blue-500/[0.02] border-b border-border/40 p-5">
                                    <CardTitle className="text-sm font-bold  flex items-center gap-2 text-foreground">
                                        <Globe className="h-4 w-4 text-blue-500" /> External Gateway
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-border/40">
                                        <span className="text-xs font-bold text-muted-foreground">Status</span>
                                        <BadgeStatus status={reconcileResult.external.status} />
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-border/40">
                                        <span className="text-xs font-bold text-muted-foreground">Value</span>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-2">
                                                <SmartCurrency amount={reconcileResult.external.amount.toString()} currency={reconcileResult.external.currency} visible={true} size="default" className="text-foreground font-bold " />
                                                {reconcileResult.external.metadata?.donorCurrency && reconcileResult.external.metadata?.donorCurrency !== 'NGN' && (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-2 py-0.5 shadow-sm font-bold">
                                                        ≈ {reconcileResult.external.metadata.donorCurrency} {reconcileResult.external.metadata.donorAmount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-xs font-bold text-muted-foreground">Channel</span>
                                        <span className="text-xs font-bold bg-muted/50 px-3 py-1 rounded-3xl border border-border/40 text-foreground">{reconcileResult.external.channel}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-3xl bg-card border-border/40 overflow-hidden shadow-sm relative hover:border-primary/30 transition-all group">
                                <CardHeader className="bg-primary/[0.02] border-b border-border/40 p-5">
                                    <CardTitle className="text-sm font-bold  flex items-center gap-2 text-foreground">
                                        <Database className="h-4 w-4 text-primary" /> Internal Ledger
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 h-full flex flex-col justify-center min-h-[220px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-bold text-muted-foreground">Sync status</span>
                                        <BadgeStatus status={reconcileResult.internal.status === 'success' ? 'Synchronized' : 'Missing'} />
                                    </div>

                                    {reconcileResult.canReconcile ? (
                                        <div className="space-y-4 animate-in zoom-in-95">
                                            <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 flex items-start gap-3">
                                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                                    Discrepancy detected. Payment verified externally but absent internally. Repair recommended.
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full h-11 rounded-3xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white gap-2 transition-all active:scale-95 text-xs border-0"
                                                onClick={handleExecuteReconcile}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                                Initialize sync
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-4 text-emerald-500 animate-in zoom-in duration-500">
                                            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3 border border-emerald-500/20 shadow-inner">
                                                <CheckCircle2 className="h-8 w-8" />
                                            </div>
                                            <span className="text-xs font-bold">Consensus achieved</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6 outline-none pt-2">
                    <div className="max-w-2xl">
                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden group hover:border-primary/30 transition-all shadow-sm">
                            <CardHeader className="bg-primary/[0.02] border-b border-border/40 p-5 md:p-6">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground ">
                                    <Sparkles className="h-4 w-4 text-primary" /> Dust Sweep Protocol
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 md:p-6 space-y-5">
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    Cleans up project accounts with very small balances (less than ₦100) that haven’t been active for over 30 days.
                                </p>

                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 flex items-start gap-3">
                                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                        Project goals will be updated to match actual funds raised. Owners of affected projects will get an automatic notice about the changes.
                                    </p>
                                </div>

                                <div className="flex justify-start">
                                    <Button
                                        onClick={() => setShowSweepConfirm(true)}
                                        disabled={isProcessing}
                                        className="h-10 px-6 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 border-0 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "Run sweep"
                                        )}
                                    </Button>
                                </div>
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
                description="This action will align the goals and finalize all stagnant projects with balances under ₦100. This action is audited and irreversible."
                confirmText="Execute protocol"
            />

            <ConfirmModal
                isOpen={refundModal.isOpen}
                onClose={() => setRefundModal({ ...refundModal, isOpen: false })}
                onConfirm={handleRefund}
                isLoading={isProcessing}
                variant="destructive"
                title="Trigger Audit Refund"
                description={
                    <>
                        Initialize an automated external refund for{' '}
                        <span className="break-all font-mono">{refundModal.reference}</span>
                        ? This procedure is irreversible.
                    </>
                }
                confirmText="Confirm refund"
            />
        </div>
    );
});

function BadgeStatus({ status }: { status: string }) {
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'synchronized';
    return (
        <span className={cn(
            "px-3 py-1 rounded-3xl text-[10px] font-bold border transition-all",
            isSuccess
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
        )}>
            {status}
        </span>
    );
}