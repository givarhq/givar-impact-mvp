'use client';

import { useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, CheckCircle2, Loader2, Database, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { ApiService } from '../../../../services/api';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';

export default function ReconcilePage() {
  const [ref, setRef] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    if (!ref) return;
    setIsSearching(true);
    setResult(null);
    try {
      const token = getCookie('givar_token') as string;
      const data = await ApiService.admin.verifyExternalRef(token, ref);
      setResult(data);
    } catch (e) {
      toast.error('Verification failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReconcile = async () => {
    setIsProcessing(true);
    try {
      await ApiService.admin.executeReconcile(ref);
      toast.success('Ledger successfully reconciled');
      handleSearch(); // Refresh state
    } catch (e) {
      toast.error('Reconciliation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction Reconciliation</h1>
        <p className="text-muted-foreground text-sm">Manually sync missing Paystack transactions with the Givar Ledger.</p>
      </div>

      <Card className="rounded-[32px] p-2 border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6 flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Enter Paystack Reference (e.g. T123456789...)" 
                    className="pl-12 h-14 rounded-2xl bg-background border-none ring-1 ring-border focus-visible:ring-primary"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !ref} className="h-14 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20">
                {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify Reference'}
            </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Paystack State */}
            <Card className="rounded-3xl border-border/50 bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-500" /> Paystack Ground Truth
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <BadgeCheck status={result.external.status} />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="font-mono font-bold text-foreground">₦{result.external.amount / 100}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Channel</span>
                        <span className="text-sm font-medium capitalize">{result.external.channel}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Givar State */}
            <Card className="rounded-3xl border-border/50 bg-card overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" /> Givar Ledger State
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Internal Status</span>
                        <BadgeCheck status={result.internal.status === 'success' ? 'success' : 'missing'} />
                    </div>
                    {result.canReconcile ? (
                        <div className="pt-4">
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Discrepancy detected. This payment is successful on Paystack but missing in Givar.
                                </p>
                            </div>
                            <Button onClick={handleReconcile} disabled={isProcessing} className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20">
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Fix Ledger Now
                            </Button>
                        </div>
                    ) : (
                        <div className="pt-4 flex items-center justify-center py-6 text-emerald-500 gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-bold">Ledger in Sync</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

function BadgeCheck({ status }: { status: string }) {
    const isSuccess = status === 'success';
    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            isSuccess ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
        )}>
            {status}
        </span>
    );
}