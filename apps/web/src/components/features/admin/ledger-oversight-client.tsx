'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search, ShieldCheck, AlertTriangle, CheckCircle2,
    Loader2, Database, Globe, RefreshCcw, ArrowRightLeft,
    Ban, Calendar, ArrowRight,
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

interface LedgerOversightProps {
    initialSuspense: any[];
    activeProjects: any[];
}

export function LedgerOversightClient({ initialSuspense, activeProjects }: LedgerOversightProps) {
    const [activeTab, setActiveTab] = useState('suspense');

    // --- RECONCILE STATE ---
    const [refInput, setRefInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [reconcileResult, setReconcileResult] = useState<any>(null);

    // --- SUSPENSE STATE ---
    const [suspenseItems, setSuspenseItems] = useState(initialSuspense);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal State
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
            console.error("Failed to refresh suspense queue");
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
                toast.success("Discrepancy detected and fixable.");
            }
        } catch (e) {
            toast.error('Failed to verify reference with Paystack nodes.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleExecuteReconcile = async () => {
        setIsProcessing(true);
        try {
            await ApiService.admin.executeReconcile(refInput.trim());
            toast.success('Internal ledger successfully synchronized.');
            handleVerifyRef();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Sync failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const openRefundPrompt = (txId: string, reference: string) => {
        setRefundModal({ isOpen: true, txId, reference });
    };

    const handleRefund = async () => {
        setIsProcessing(true);
        try {
            await ApiService.admin.resolveSuspense(refundModal.txId, { action: 'REFUND' });
            toast.success('Paystack refund triggered and ledger marked as REVERSED.');
            setRefundModal({ ...refundModal, isOpen: false });
            await refreshSuspense();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Refund protocol failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-muted/50 p-1.5 rounded-[22px] h-14 w-full md:w-fit border border-border/50">
                        <TabsTrigger value="suspense" className="rounded-xl px-8 h-full gap-2.5 font-black text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg">
                            <AlertTriangle className="h-4 w-4" />
                            Suspense Queue
                            {suspenseItems.length > 0 && (
                                <span className="ml-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md font-black">
                                    {suspenseItems.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="reconcile" className="rounded-xl px-8 h-full gap-2.5 font-black text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg">
                            <RefreshCcw className="h-4 w-4" />
                            Manual Sync
                        </TabsTrigger>
                    </TabsList>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/30 px-4 py-2 rounded-2xl border border-border/50 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Forensic Integrity Protocol Active
                    </p>
                </div>

                {/* --- TAB 1: SUSPENSE QUEUE --- */}
                <TabsContent value="suspense" className="space-y-6 outline-none">
                    {suspenseItems.length === 0 ? (
                        <div className="py-32 text-center border-2 border-dashed border-border/60 rounded-[48px] bg-card/30 backdrop-blur-sm">
                            <div className="h-24 w-24 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-500/[0.03]">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Ledger Balanced</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-3 font-medium leading-relaxed">
                                No unallocated transactions detected. All capital inflow is currently synchronized with verified impact nodes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {suspenseItems.map((item: any) => (
                                <Card key={item.id} className="rounded-[32px] border-border/50 bg-card overflow-hidden group hover:shadow-2xl hover:shadow-primary/[0.02] transition-all duration-500">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className="h-16 w-16 rounded-[22px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
                                                <Database className="h-8 w-8" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Orphaned Capital</span>
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/50 border-border/50 rounded-md">REF: {item.reference}</Badge>
                                                </div>
                                                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                                    <SmartCurrency amount={item.amount} currency={item.currency} visible={true} size="large" className="text-foreground" />
                                                    <span className="text-muted-foreground font-bold text-sm line-clamp-1">
                                                        Actor: <span className="text-foreground">{item.wallet?.user?.email || 'External Guest'}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 opacity-50" /> {formatDate(item.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-none border-border/40">
                                            <Button
                                                variant="outline"
                                                className="flex-1 md:flex-none rounded-2xl h-14 px-8 border-destructive/20 text-destructive hover:bg-destructive/5 font-black text-[10px] uppercase tracking-widest transition-all"
                                                onClick={() => openRefundPrompt(item.id, item.reference)}
                                                disabled={isProcessing}
                                            >
                                                <Ban className="h-4 w-4 mr-2" /> Auto-Refund
                                            </Button>
                                            <Link href={`/admin/ledger/reallocate/${item.id}`} className="flex-1 md:flex-none">
                                                <Button
                                                    className="w-full h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                                    disabled={isProcessing}
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" /> Re-allocate
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* --- TAB 2: MANUAL SYNC --- */}
                <TabsContent value="reconcile" className="space-y-8 pt-4 outline-none">
                    <Card className="rounded-[48px] p-2 border-border/50 bg-card shadow-2xl overflow-hidden">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Verify External Reference (Paystack)..."
                                    className="pl-14 h-16 rounded-[32px] bg-muted/20 border-none ring-1 ring-border/50 focus-visible:ring-primary text-lg font-mono tracking-tight"
                                    value={refInput}
                                    onChange={(e) => setRefInput(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleVerifyRef}
                                disabled={isVerifying || !refInput}
                                className="h-16 px-12 rounded-[32px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-xs"
                            >
                                {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search Global Ledger'}
                            </Button>
                        </CardContent>
                    </Card>

                    {reconcileResult && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                            {/* Paystack Node */}
                            <Card className="rounded-[40px] bg-card border-border/50 overflow-hidden shadow-lg group hover:border-blue-500/20 transition-all">
                                <CardHeader className="bg-blue-500/[0.02] border-b border-border/50 p-8">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-blue-500">
                                        <Globe className="h-4 w-4" /> External Gateway Node
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gateway Status</span>
                                        <BadgeStatus status={reconcileResult.external.status} />
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/40">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Transaction Value</span>
                                        <div className="text-right">
                                            <p className="font-black text-xl text-foreground">₦{(reconcileResult.external.amount / 100).toLocaleString()}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">{reconcileResult.external.currency}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Channel</span>
                                        <span className="text-xs font-black uppercase tracking-widest bg-secondary px-4 py-1.5 rounded-xl border border-border/50">{reconcileResult.external.channel}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Givar Node */}
                            <Card className="rounded-[40px] bg-card border-border/50 overflow-hidden shadow-lg relative group hover:border-primary/20 transition-all">
                                <CardHeader className="bg-primary/[0.02] border-b border-border/50 p-8">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary">
                                        <Database className="h-4 w-4" /> Internal Givar Ledger
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 h-full flex flex-col justify-center min-h-[220px]">
                                    <div className="flex justify-between items-center mb-10">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ledger Sync</span>
                                        <BadgeStatus status={reconcileResult.internal.status === 'success' ? 'Synchronized' : 'Missing'} />
                                    </div>

                                    {reconcileResult.canReconcile ? (
                                        <div className="space-y-6">
                                            <div className="p-5 rounded-[24px] bg-amber-500/[0.03] border border-amber-500/20 flex gap-4">
                                                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                                                <p className="text-xs text-amber-800 leading-relaxed font-bold uppercase tracking-tight">
                                                    A critical sync discrepancy was detected. The payment is verified externally but remains unrecorded in the internal ledger.
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full h-16 rounded-[24px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/30 text-white gap-2 transition-all hover:scale-[1.02]"
                                                onClick={handleExecuteReconcile}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                                Initialize Forensic Repair
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-emerald-500 animate-in zoom-in duration-500">
                                            <div className="h-20 w-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center mb-4 ring-8 ring-emerald-500/[0.03]">
                                                <CheckCircle2 className="h-10 w-10" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-[0.3em]">Consensus Achieved</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <ConfirmModal
                isOpen={refundModal.isOpen}
                onClose={() => setRefundModal({ ...refundModal, isOpen: false })}
                onConfirm={handleRefund}
                isLoading={isProcessing}
                variant="destructive"
                title="Trigger Audit Refund"
                description={`Initialize an automated Paystack refund for ${refundModal.reference}? This procedure is forensic and irreversible. The internal ledger entry will be permanently marked as REVERSED.`}
                confirmText="Confirm Refund"
            />
        </div>
    );
}

function BadgeStatus({ status }: { status: string }) {
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'synchronized';
    return (
        <span className={cn(
            "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all",
            isSuccess
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
        )}>
            {status}
        </span>
    );
}