'use client';

import React, { useState } from 'react';
import { 
  Search, ShieldCheck, AlertTriangle, CheckCircle2, 
  Loader2, Database, Globe, RefreshCcw, ArrowRightLeft, 
  Ban, Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Modal } from '../../ui/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';

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
  const [allocationModal, setAllocationModal] = useState<{ 
    isOpen: boolean; 
    tx: any; 
    targetId: string 
  }>({
      isOpen: false, 
      tx: null, 
      targetId: ''
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
          handleVerifyRef(); // Re-verify to show "In Sync" state
      } catch (e: any) {
          toast.error(e.response?.data?.message || "Sync failed.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleRefund = async (txId: string, reference: string) => {
    if (!confirm(`Trigger automated Paystack refund for ${reference}? This action is irreversible.`)) return;
    
    setIsProcessing(true);
    try {
      await ApiService.admin.resolveSuspense(txId, { action: 'REFUND' });
      toast.success('Paystack refund triggered and ledger marked as REVERSED.');
      await refreshSuspense();
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Refund protocol failed.'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleAllocate = async () => {
    if (!allocationModal.targetId) return toast.error("Please select a target cause.");
    
    setIsProcessing(true);
    try {
      await ApiService.admin.resolveSuspense(allocationModal.tx.id, { 
        action: 'ALLOCATE', 
        targetProjectId: allocationModal.targetId 
      });
      toast.success('Funds successfully re-allocated and target project updated.');
      setAllocationModal({ ...allocationModal, isOpen: false });
      await refreshSuspense();
    } catch (e) { 
      toast.error('Allocation failed.'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full md:w-fit border border-border/50">
                <TabsTrigger value="suspense" className="rounded-xl px-8 h-full gap-2 data-[state=active]:shadow-lg active:scale-95 transition-all">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Suspense Queue</span>
                    <span className="sm:hidden text-xs">Suspense</span>
                    {suspenseItems.length > 0 && (
                        <span className="ml-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {suspenseItems.length}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="reconcile" className="rounded-xl px-8 h-full gap-2 data-[state=active]:shadow-lg active:scale-95 transition-all">
                    <RefreshCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Manual Sync</span>
                    <span className="sm:hidden text-xs">Sync</span>
                </TabsTrigger>
            </TabsList>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl border border-border/50 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-primary" /> Financial Integrity Protocol V2
            </p>
        </div>

        {/* --- TAB 1: SUSPENSE QUEUE --- */}
        <TabsContent value="suspense" className="space-y-6 outline-none">
            {suspenseItems.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-border rounded-[40px] bg-card/30">
                    <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Ledger Fully Allocated</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2 font-medium">
                        No orphaned transactions found. All system capital is correctly routed to active causes.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {suspenseItems.map((item: any) => (
                        <Card key={item.id} className="rounded-[28px] border-border/50 bg-card overflow-hidden group hover:shadow-xl hover:shadow-primary/[0.02] transition-all">
                            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
                                        <Database className="h-7 w-7" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Unallocated Funds</span>
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">REF: {item.reference}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <SmartCurrency amount={item.amount} currency={item.currency} visible={true} size="default" className="text-xl" />
                                            <span className="text-muted-foreground font-medium text-sm line-clamp-1">
                                                from {item.wallet?.user?.email || 'Anonymous Guest'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1.5 truncate flex items-center gap-2 font-medium">
                                            <Calendar className="h-3 w-3" /> {formatDate(item.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-none border-border/50">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 md:flex-none rounded-xl h-12 px-6 border-destructive/20 text-destructive hover:bg-destructive/10 font-bold text-xs"
                                        onClick={() => handleRefund(item.id, item.reference)}
                                        disabled={isProcessing}
                                    >
                                        <Ban className="h-4 w-4 mr-2" /> Auto-Refund
                                    </Button>
                                    <Button 
                                        className="flex-1 md:flex-none rounded-xl h-12 px-6 font-bold text-xs shadow-lg shadow-primary/20"
                                        onClick={() => setAllocationModal({ isOpen: true, tx: item, targetId: '' })}
                                        disabled={isProcessing}
                                    >
                                        <ArrowRightLeft className="h-4 w-4 mr-2" /> Re-allocate
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* --- TAB 2: MANUAL SYNC --- */}
        <TabsContent value="reconcile" className="space-y-8 pt-4 outline-none">
             <Card className="rounded-[40px] p-2 border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Verify Paystack Reference..." 
                            className="pl-12 h-16 rounded-3xl bg-background border-none ring-1 ring-border/50 focus-visible:ring-primary text-lg font-mono tracking-tight"
                            value={refInput}
                            onChange={(e) => setRefInput(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleVerifyRef} 
                        disabled={isVerifying || !refInput} 
                        className="h-16 px-10 rounded-3xl font-bold shadow-xl shadow-primary/20 text-base"
                    >
                        {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search Ledger'}
                    </Button>
                </CardContent>
            </Card>

            {reconcileResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Paystack Node */}
                    <Card className="rounded-[32px] bg-card border-border/50 overflow-hidden shadow-lg">
                        <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-blue-500">
                                <Globe className="h-4 w-4" /> External Node (Paystack)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="flex justify-between items-center py-2 border-b border-border/40">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <BadgeStatus status={reconcileResult.external.status} />
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/40">
                                <span className="text-sm font-medium text-muted-foreground">Amount</span>
                                <div className="text-right">
                                    <p className="font-bold text-foreground">₦{(reconcileResult.external.amount / 100).toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{reconcileResult.external.currency}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-medium text-muted-foreground">Payment Channel</span>
                                <span className="text-sm font-bold capitalize bg-secondary px-3 py-1 rounded-lg border border-border/50">{reconcileResult.external.channel}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Givar Node */}
                    <Card className="rounded-[32px] bg-card border-border/50 overflow-hidden shadow-lg relative">
                        <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                                <Database className="h-4 w-4" /> Internal Node (Givar)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 h-full flex flex-col justify-center min-h-[180px]">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-sm font-medium text-muted-foreground">Ledger Sync</span>
                                <BadgeStatus status={reconcileResult.internal.status === 'success' ? 'Synchronized' : 'Missing'} />
                            </div>
                            
                            {reconcileResult.canReconcile ? (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-700 leading-relaxed font-bold">
                                            A sync discrepancy was detected. The payment exists externally but has not been recorded locally.
                                        </p>
                                    </div>
                                    <Button 
                                        className="w-full h-14 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 text-white" 
                                        onClick={handleExecuteReconcile}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                                        Fix Sync Discrepancy
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-emerald-500">
                                    <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 ring-4 ring-emerald-500/5">
                                        <CheckCircle2 className="h-10 w-10" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-widest">Everything in Sync</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </TabsContent>
      </Tabs>

      {/* --- ALLOCATION MODAL --- */}
      <Modal 
        isOpen={allocationModal.isOpen} 
        onClose={() => !isProcessing && setAllocationModal({ ...allocationModal, isOpen: false })}
        title="Manual Re-allocation"
        description="Choose an active cause to credit these orphaned funds to."
      >
        <div className="space-y-6 pt-4">
            <div className="bg-muted/50 p-5 rounded-2xl border border-border/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Original Context</p>
                <div className="flex justify-between items-end">
                    <SmartCurrency amount={allocationModal.tx?.amount} currency={allocationModal.tx?.currency || 'NGN'} visible={true} size="default" className="text-2xl" />
                    <span className="text-xs font-mono opacity-50">{allocationModal.tx?.reference?.slice(0,12)}...</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">"{allocationModal.tx?.description}"</p>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Target Project</label>
                <Select value={allocationModal.targetId} onValueChange={(id) => setAllocationModal({ ...allocationModal, targetId: id })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-border/50 focus:ring-primary/20">
                        <SelectValue placeholder="Search active causes..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl">
                        {activeProjects.length > 0 ? activeProjects.map((p: any) => (
                            <SelectItem key={p.id} value={p.id} className="rounded-lg h-10 px-3 cursor-pointer">
                                {p.title}
                            </SelectItem>
                        )) : (
                            <p className="p-4 text-center text-xs text-muted-foreground">No active projects available</p>
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex gap-3 pt-4">
                <Button 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl font-bold" 
                    onClick={() => setAllocationModal({ ...allocationModal, isOpen: false })}
                    disabled={isProcessing}
                >
                    Cancel
                </Button>
                <Button 
                    className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-primary/20" 
                    onClick={handleAllocate} 
                    disabled={isProcessing || !allocationModal.targetId}
                >
                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Move'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}

function BadgeStatus({ status }: { status: string }) {
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'synchronized';
    return (
        <span className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
            isSuccess 
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" 
                : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-500"
        )}>
            {status}
        </span>
    );
}