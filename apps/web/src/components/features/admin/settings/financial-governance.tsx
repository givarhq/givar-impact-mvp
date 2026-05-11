'use client';

import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Landmark,
    Loader2,
    Lock,
    History,
    CheckCircle2,
    ShieldAlert,
    Plus,
    Search,
    X,
    Zap
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '../../../ui/select';
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
    const [categories, setCategories] = useState<any[]>([]);

    // Form State
    const [percentage, setPercentage] = useState('');
    const [tipEnabled, setTipEnabled] = useState(true);
    const [password, setPassword] = useState('');
    const [targetType, setTargetType] = useState<'GLOBAL' | 'CATEGORY' | 'SUBCATEGORY' | 'PROJECT'>('GLOBAL');
    const [targetId, setTargetId] = useState<string>('');

    // Project Search State
    const [projectQuery, setProjectQuery] = useState('');
    const [projectResults, setProjectResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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

    useEffect(() => {
        if (showModal && categories.length === 0) {
            ApiService.projects.getCategories().then(setCategories).catch(() => { });
        }
    }, [showModal, categories.length]);

    useEffect(() => {
        if (targetType === 'PROJECT' && projectQuery.trim().length > 2) {
            const timer = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const token = getCookie('givar_token') as string;
                    const res = await ApiService.admin.getProjects(token, new URLSearchParams({ search: projectQuery.trim(), limit: '5' }));
                    setProjectResults(res?.data || []);
                } catch (e) { } finally {
                    setIsSearching(false);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [projectQuery, targetType]);

    const handleUpdate = async () => {
        const parsedPercentage = parseFloat(percentage);
        if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 20) {
            return toast.error("Percentage must be a valid number between 0 and 20.");
        }
        if (!password) {
            return toast.error("SuperAdmin password is required to authorize financial mutation.");
        }
        if (targetType !== 'GLOBAL' && !targetId) {
            return toast.error("Please select the specific target for this fee rule.");
        }

        setIsUpdating(true);
        const toastId = toast.loading("Authorizing ledger mutation...");

        try {
            await ApiService.fees.updateGlobalRule({
                percentage: parsedPercentage,
                optionalTipEnabled: tipEnabled,
                password,
                targetType,
                targetId: targetType === 'GLOBAL' ? undefined : targetId
            });
            toast.success("Financial parameters successfully updated", { id: toastId });
            setShowModal(false);
            setPassword('');
            setPercentage('');
            setTargetId('');
            setProjectQuery('');
            router.refresh();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to authorize mutation. Check credentials.", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    // Separate active overrides from global historical rules
    const activeOverrides = initialFeeHistory.filter(r => r.isActive && !r.appliesGlobally);
    const globalHistory = initialFeeHistory.filter(r => r.appliesGlobally);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-6 md:space-y-8"
        >
            <div className="flex flex-row items-center justify-between gap-4 px-1">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground tracking-tight truncate">Operational Support & Contributions</h2>
                    <p className="text-xs text-muted-foreground font-medium truncate">Configure the platform-wide operational support fee and voluntary contribution system.</p>
                </div>
                {isSuperAdmin && (
                    <Button
                        onClick={() => {
                            setTargetType('GLOBAL');
                            setPercentage(initialFeeRule?.percentage?.toString() || '0');
                            setTipEnabled(initialFeeRule?.optionalTipEnabled ?? false);
                            setShowModal(true);
                        }}
                        className="rounded-3xl h-9 md:h-10 px-4 md:px-6 font-bold text-xs shadow-sm border-0 bg-primary text-white hover:bg-primary/90 transition-all active:scale-95 shrink-0"
                    >
                        <Plus className="h-4 w-4 mr-1.5" /> Modify Rates
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b border-border/40 p-5">
                        <CardTitle className="text-sm font-bold flex items-center justify-between text-foreground">
                            <span className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Global Base Rate</span>
                            {initialFeeRule ? (
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-xs">Active</Badge>
                            ) : (
                                <Badge variant="destructive" className="font-bold text-xs shadow-none">Failsafe</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center flex flex-col justify-center min-h-[160px]">
                        <p className="text-4xl font-black text-primary tracking-tighter mb-2">
                            {initialFeeRule?.percentage ?? 0}%
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">Operational support fee per transaction</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden">
                    <CardHeader className="border-b border-border/40 p-5">
                        <CardTitle className="text-sm font-bold flex items-center justify-between text-foreground">
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> Optional Support Contributions</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 text-center flex flex-col justify-center min-h-[160px]">
                        <div className="flex justify-center mb-3">
                            {initialFeeRule?.optionalTipEnabled ? (
                                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">
                            Donor optional support contribution is <strong className="text-foreground">{initialFeeRule?.optionalTipEnabled ? 'Enabled' : 'Disabled'}</strong>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Overrides Table */}
            {activeOverrides.length > 0 && (
                <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
                        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" /> Active Exceptions & Overrides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile View */}
                        <div className="grid gap-3 md:hidden p-4">
                            {activeOverrides.map(rule => (
                                <div key={rule.id} className="p-4 rounded-2xl border border-border/40 bg-card shadow-sm space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="font-bold text-sm text-foreground leading-tight">{rule.targetName}</span>
                                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">{rule.percentage}%</span>
                                    </div>
                                    <div className="text-xs font-medium text-muted-foreground flex justify-between items-center pt-1 border-t border-border/40">
                                        <span>Added {formatDate(rule.activeFrom).split(',')[0]}</span>
                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-xs">Active</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/5 text-xs font-bold text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-3">Target Scope</th>
                                        <th className="px-6 py-3">Rate</th>
                                        <th className="px-6 py-3 text-right">Added On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-sm">
                                    {activeOverrides.map(rule => (
                                        <tr key={rule.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-3">
                                                <p className="font-bold text-foreground truncate max-w-[300px]">{rule.targetName}</p>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">{rule.percentage}%</span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-muted-foreground text-xs">
                                                {formatDate(rule.activeFrom).split(',')[0]}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Historic Global Rules */}
            <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden">
                <CardHeader className="border-b border-border/40 p-5">
                    <CardTitle className="text-sm font-bold flex items-center justify-between text-foreground">
                        <span className="flex items-center gap-2"><History className="h-4 w-4 text-muted-foreground" /> Global Audit History</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Mobile View */}
                    <div className="grid gap-3 md:hidden p-4">
                        {globalHistory.length === 0 ? (
                            <div className="text-center text-muted-foreground italic text-xs py-4">No history recorded.</div>
                        ) : globalHistory.map(rule => (
                            <div key={rule.id} className={cn("p-4 rounded-2xl border border-border/40 bg-card shadow-sm space-y-3", !rule.isActive && "opacity-60")}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-foreground text-sm">{rule.percentage}%</span>
                                        {rule.optionalTipEnabled ? (
                                            <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded border border-transparent">Contributions On</span>
                                        ) : (
                                            <span className="text-xs font-bold border border-border/60 px-1.5 py-0.5 rounded">Contributions Off</span>
                                        )}
                                    </div>
                                    {rule.isActive ? (
                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-xs">Active</Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-border/60 font-bold text-xs shadow-none">Archived</Badge>
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground pt-2 border-t border-border/40">
                                    <span>{formatDate(rule.activeFrom).split(',')[0]}</span>
                                    <span className="truncate max-w-[150px]">{rule.creator?.email || 'System'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/5 text-xs font-bold text-muted-foreground border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-3">Rate & Contributions</th>
                                    <th className="px-6 py-3">Effective Cycle</th>
                                    <th className="px-6 py-3">Authorized By</th>
                                    <th className="px-6 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 text-xs">
                                {globalHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic font-medium text-xs">No history recorded.</td>
                                    </tr>
                                ) : (
                                    globalHistory.map((rule) => (
                                        <tr key={rule.id} className={cn("hover:bg-muted/10 transition-colors", !rule.isActive && "opacity-60")}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-foreground text-sm">{rule.percentage}%</span>
                                                    {rule.optionalTipEnabled ? (
                                                        <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded border border-transparent">Contributions On</span>
                                                    ) : (
                                                        <span className="text-xs font-bold border border-border/60 px-1.5 py-0.5 rounded">Contributions Off</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-muted-foreground text-xs">
                                                {formatDate(rule.activeFrom).split(',')[0]} - {rule.activeUntil ? formatDate(rule.activeUntil).split(',')[0] : 'Present'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-muted-foreground text-xs">
                                                {rule.creator?.email || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {rule.isActive ? (
                                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-xs">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground border-border/60 font-bold text-xs shadow-none">Archived</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md max-h-[85vh] flex flex-col">
                    <div className="p-5 md:p-6 overflow-y-auto no-scrollbar flex-1 space-y-5">
                        <div className="text-center space-y-2 pb-2">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold tracking-tight text-center leading-none">Financial Configuration</DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
                                Set new operational support fee and contribution rules.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground ml-1">Target Scope</label>
                                <Select value={targetType} onValueChange={(val: any) => { setTargetType(val); setTargetId(''); setProjectQuery(''); }}>
                                    <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 font-bold text-xs focus:bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                                        <SelectItem value="GLOBAL" className="text-xs font-bold py-2">Global (Platform Wide)</SelectItem>
                                        <SelectItem value="CATEGORY" className="text-xs font-bold py-2">Specific Sector</SelectItem>
                                        <SelectItem value="SUBCATEGORY" className="text-xs font-bold py-2">Specific Focus Area</SelectItem>
                                        <SelectItem value="PROJECT" className="text-xs font-bold py-2">Single Cause Override</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <AnimatePresence mode="popLayout">
                                {targetType === 'CATEGORY' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground ml-1">Select Sector</label>
                                        <Select value={targetId} onValueChange={setTargetId}>
                                            <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 font-bold text-xs focus:bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border/40 shadow-xl max-h-48">
                                                {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-medium py-2">{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>
                                )}

                                {targetType === 'SUBCATEGORY' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground ml-1">Select Focus Area</label>
                                        <Select value={targetId} onValueChange={setTargetId}>
                                            <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 font-bold text-xs focus:bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                                            <SelectContent className="rounded-2xl border-border/40 shadow-xl max-h-48">
                                                {categories.map(c => {
                                                    if (!c.subcategories || c.subcategories.length === 0) return null;
                                                    return (
                                                        <SelectGroup key={c.id}>
                                                            <SelectLabel className="text-muted-foreground/50">{c.name}</SelectLabel>
                                                            {c.subcategories.map((sub: any) => (
                                                                <SelectItem key={sub.id} value={sub.id} className="text-xs font-medium py-2 ml-2">
                                                                    {sub.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </motion.div>
                                )}

                                {targetType === 'PROJECT' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground ml-1">Search Live Cause</label>
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                value={targetId ? projectResults.find(p => p.id === targetId)?.title : projectQuery}
                                                onChange={(e) => { setTargetId(''); setProjectQuery(e.target.value); }}
                                                placeholder="Search by title..."
                                                className="h-11 pl-9 rounded-2xl bg-muted/20 border-border/60 font-medium text-xs focus:bg-background"
                                            />
                                            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                                            {targetId && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => { setTargetId(''); setProjectQuery(''); }} />}
                                        </div>
                                        {!targetId && projectQuery.length > 2 && (
                                            <div className="mt-1 bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg p-1">
                                                {projectResults.length === 0 ? (
                                                    <div className="p-3 text-center text-xs text-muted-foreground italic">No causes found</div>
                                                ) : (
                                                    projectResults.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => setTargetId(p.id)}
                                                            className="w-full text-left p-2 text-xs font-medium hover:bg-muted/50 rounded-xl transition-colors truncate"
                                                        >
                                                            {p.title}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Percentage Rate</label>
                                    <div className="relative group">
                                        <Input
                                            type="number" step="0.1" min="0" max="20"
                                            value={percentage}
                                            onChange={(e) => setPercentage(e.target.value)}
                                            className="pr-8 h-11 text-sm font-bold rounded-2xl bg-muted/20 border-border/60 focus:bg-background shadow-inner transition-all tabular-nums"
                                            placeholder="2.5"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">%</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground ml-1 truncate">Allow Support Contributions</label>
                                    <div className="h-11 flex items-center justify-center p-1 rounded-2xl bg-muted/20 border border-border/60 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => setTipEnabled(true)}
                                            className={cn("flex-1 h-full rounded-xl text-xs font-bold transition-all", tipEnabled ? "bg-primary shadow-sm border border-primary/40 text-white" : "text-muted-foreground opacity-60 hover:bg-muted/50")}
                                        >On</button>
                                        <button
                                            type="button"
                                            onClick={() => setTipEnabled(false)}
                                            className={cn("flex-1 h-full rounded-xl text-xs font-bold transition-all", !tipEnabled ? "bg-background shadow-sm border border-border/40 text-foreground" : "text-muted-foreground opacity-60 hover:bg-muted/50")}
                                        >Off</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-bold text-destructive ml-1 flex items-center gap-1.5"><Lock className="h-3 w-3" /> Step-Up Authorization</label>
                                <Input
                                    type="password"
                                    placeholder="SuperAdmin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 rounded-2xl bg-destructive/5 border-destructive/20 focus:bg-background shadow-inner transition-all text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2 pt-2">
                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating || !password || percentage === '' || (targetType !== 'GLOBAL' && !targetId)}
                                className="w-full h-12 rounded-full font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0 bg-primary text-white hover:bg-primary/90"
                            >
                                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : 'Authorize Protocol'}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { setShowModal(false); setPassword(''); }}
                                className="w-full h-10 rounded-full font-bold text-xs text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
});