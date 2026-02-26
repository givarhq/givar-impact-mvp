'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Landmark,
    Loader2,
    Lock,
    History,
    CheckCircle2,
    ShieldAlert,
    AlertTriangle,
    ShieldCheck,
    Info
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../ui/dialog';
import { ApiService } from '../../../../services/api';
import { Badge } from '../../../ui/badge';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';
import { formatDate } from '../../../../lib/utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { getCookie } from 'cookies-next';

interface FinancialGovernanceProps {
    initialFeeRule: any;
    initialFeeHistory: any[];
}

export const FinancialGovernance = memo(function FinancialGovernance({ initialFeeRule, initialFeeHistory }: FinancialGovernanceProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [percentage, setPercentage] = useState(initialFeeRule?.percentage?.toString() || '0');
    const [tipEnabled, setTipEnabled] = useState(initialFeeRule?.optionalTipEnabled ?? false);
    const [password, setPassword] = useState('');

    const isSuperAdmin = (() => {
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                return user.role === 'SUPERADMIN';
            } catch (e) { return false; }
        }
        return false;
    })();

    const handleUpdate = async () => {
        const parsedPercentage = parseFloat(percentage);
        if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 20) {
            return toast.error("Percentage must be a valid number between 0 and 20.");
        }
        if (!password) {
            return toast.error("SuperAdmin password is required to authorize financial mutation.");
        }

        setIsUpdating(true);
        const toastId = toast.loading("Authorizing ledger mutation...");

        try {
            await ApiService.fees.updateGlobalRule({
                percentage: parsedPercentage,
                optionalTipEnabled: tipEnabled,
                password
            });
            toast.success("Financial parameters successfully updated", { id: toastId });
            setShowModal(false);
            setPassword('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to authorize mutation. Check credentials.", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-4 md:space-y-6"
        >
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-widest text-foreground ">
                                <Landmark className="h-4 w-4 text-primary" /> Fee Configuration
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground font-bold tracking-widest ">Global Platform Rate</p>
                        </div>
                        {initialFeeRule ? (
                            <Badge variant="outline" className="rounded-3xl px-3 py-1 font-bold text-[10px] tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                                <CheckCircle2 className="h-3 w-3 mr-1.5" /> Active Protocol
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="rounded-3xl px-3 py-1 font-bold text-[10px] tracking-widest border bg-amber-50 text-amber-600 border-amber-100">
                                <ShieldAlert className="h-3 w-3 mr-1.5" /> Failsafe Mode
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 shadow-inner flex flex-col justify-center">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest mb-2">Base Platform Cut</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-primary tracking-tighter">
                                    {initialFeeRule?.percentage ?? 0}%
                                </span>
                                <span className="text-xs font-bold text-muted-foreground mb-1.5">/ transaction</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-muted/20 border border-border/40 shadow-inner flex flex-col justify-center">
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest mb-2">Donor Optional Tipping</p>
                            <div className="flex items-center gap-3">
                                {initialFeeRule?.optionalTipEnabled ? (
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shadow-sm">
                                        <ShieldAlert className="h-5 w-5" />
                                    </div>
                                )}
                                <span className="text-lg font-bold text-foreground tracking-tight">
                                    {initialFeeRule?.optionalTipEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[11px] text-blue-700 font-bold tracking-tight leading-relaxed">
                                Financial Guardrail: Fee changes are strictly append-only. When modified, the current rule is deactivated to preserve historical integrity, and a new rule is established.
                            </p>
                        </div>
                    </div>

                    {isSuperAdmin ? (
                        <Dialog open={showModal} onOpenChange={setShowModal}>
                            <DialogTrigger asChild>
                                <Button className="w-auto px-8 mx-auto flex h-12 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98] border-0">
                                    <Lock className="h-4 w-4 mr-2" /> Modify Financial Protocol
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-w-md bg-card">
                                <div className="p-8 space-y-6">
                                    <div className="text-center space-y-2">
                                        <div className="h-14 w-14 bg-amber-500/10 text-amber-500 rounded-[22px] flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                                            <AlertTriangle className="h-7 w-7" />
                                        </div>
                                        <DialogHeader>
                                            <DialogTitle className="text-xl font-bold tracking-tight text-center leading-none">Step-Up Authorization</DialogTitle>
                                        </DialogHeader>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
                                            Adjusting the financial parameters affects all future transactions platform-wide.
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold tracking-widest text-foreground ml-1">New Fee Percentage (%)</label>
                                            <div className="relative group">
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="20"
                                                    value={percentage}
                                                    onChange={(e) => setPercentage(e.target.value)}
                                                    className="pl-4 pr-10 h-12 text-lg font-bold rounded-2xl bg-muted/20 border-border/40 focus:bg-background shadow-inner transition-all tabular-nums"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-bold text-foreground">Optional Tipping</p>
                                                <p className="text-[10px] text-muted-foreground">Allow donors to add a tip for the platform</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTipEnabled(!tipEnabled)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                                                    tipEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                    tipEnabled ? "translate-x-5" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold tracking-widest text-destructive ml-1">SuperAdmin Verification</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="password"
                                                    placeholder="Enter your password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="pl-11 h-12 rounded-2xl bg-destructive/5 border-destructive/20 focus:bg-background shadow-inner transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
    onClick={handleUpdate}
    disabled={isUpdating || !password || percentage === ''}
    className="w-auto px-8 mx-auto flex h-12 rounded-3xl font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
>
                                            {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Changes'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setShowModal(false); setPassword(''); }}
                                            className="w-full h-10 rounded-3xl font-bold text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="p-4 rounded-3xl bg-muted/20 border border-dashed border-border/60 text-center">
                            <p className="text-xs font-bold text-muted-foreground tracking-tight">Only SuperAdmins can mutate financial parameters.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-5 md:p-6">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground tracking-tight">
                        <History className="h-4 w-4 text-muted-foreground" />
                        Fee Audit History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-muted/20 text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4">Fee Profile</th>
                                <th className="px-6 py-4">Optional Tips</th>
                                <th className="px-6 py-4">Effective Dates</th>
                                <th className="px-6 py-4">Authorized By</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-xs font-medium">
                            {initialFeeHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No historical fee rules recorded.
                                    </td>
                                </tr>
                            ) : (
                                initialFeeHistory.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground">
                                            <span className="text-sm">{rule.percentage}%</span>
                                            <p className="text-[9px] font-mono text-muted-foreground tracking-tighter mt-1 opacity-60">ID: {rule.id.slice(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {rule.optionalTipEnabled ? (
                                                <Badge variant="outline" className="text-[10px] rounded-full border-border/60 bg-muted/30 font-bold shadow-none">Enabled</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] rounded-full border-border/60 text-muted-foreground bg-transparent shadow-none">Disabled</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-foreground">{formatDate(rule.activeFrom).split(',')[0]}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {rule.activeUntil ? `to ${formatDate(rule.activeUntil).split(',')[0]}` : 'Present'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-3.5 w-3.5 text-purple-500 opacity-60" />
                                                <span className="text-muted-foreground truncate max-w-[150px]">{rule.creator?.email || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {rule.isActive ? (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px] rounded-3xl shadow-none">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground border-border/60 font-bold text-[10px] rounded-3xl shadow-none">Archived</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </motion.div>
    );
});
