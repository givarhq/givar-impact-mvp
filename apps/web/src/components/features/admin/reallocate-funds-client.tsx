'use client';

import React, { useState, useMemo, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Database, Calculator,
    Plus, X, Check, ShieldCheck, AlertCircle, Loader2,
    ChevronLeft, ChevronRight, Target,
    AlertTriangle, Briefcase, ArrowUpRight
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { ConfirmModal } from '../../ui/confirm-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import { formatCurrency, formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

interface ReallocateFundsClientProps {
    transaction: any;
    initialProjects: any[];
    categories: any[];
}

export const ReallocateFundsClient = memo(function ReallocateFundsClient({
    transaction,
    initialProjects,
    categories
}: ReallocateFundsClientProps) {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedSplits, setSelectedSplits] = useState<Array<{ id: string; title: string; amount: string }>>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isMobileLedgerOpen, setIsMobileLedgerOpen] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const totalOrphanedMinor = BigInt(transaction.amount);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const filteredProjects = useMemo(() => {
        return initialProjects.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory, initialProjects]);

    const toggleProject = (project: any) => {
        const exists = selectedSplits.find(s => s.id === project.id);
        if (exists) {
            setSelectedSplits(prev => prev.filter(s => s.id !== project.id));
        } else {
            setSelectedSplits(prev => [...prev, { id: project.id, title: project.title, amount: '' }]);
            if (window.innerWidth < 1024) {
                toast.success("Added To Ledger", {
                    icon: <Plus className="h-4 w-4" />,
                    style: { borderRadius: '24px', fontWeight: 'bold', fontSize: '12px' }
                });
            }
        }
    };

    const updateSplitAmount = (id: string, value: string) => {
        const formatted = formatNumberInput(value);
        const raw = parseFormattedNumber(formatted);
        setSelectedSplits(prev => prev.map(s => s.id === id ? { ...s, amount: raw } : s));
    };

    const currentTotalAllocatedMinor = selectedSplits.reduce((acc, curr) => {
        const amountBase = Number(curr.amount || '0');
        return acc + BigInt(Math.round(amountBase * 100));
    }, 0n);

    const remainingMinor = totalOrphanedMinor - currentTotalAllocatedMinor;
    const isBalanced = currentTotalAllocatedMinor === totalOrphanedMinor;

    const handleCommit = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Executing Forensic Allocation...');
        try {
            await ApiService.admin.resolveSuspense(transaction.id, {
                action: 'ALLOCATE' as any,
                allocations: selectedSplits.map(s => ({
                    projectId: s.id,
                    amount: (BigInt(parseFormattedNumber(s.amount)) * 100n).toString()
                }))
            });
            toast.success("Reconciliation Complete", { id: toastId });
            router.push('/admin/ledger');
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Allocation Failed", { id: toastId });
        } finally {
            setIsProcessing(false);
            setShowConfirm(false);
            setIsMobileLedgerOpen(false);
        }
    };

    const LedgerContent = (
        <div className="flex flex-col h-full w-full">
            <div className="bg-muted/40 border-b border-border/40 shrink-0">
                <div className="flex justify-center pt-5 lg:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-foreground/10" />
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-black tracking-widest text-foreground flex items-center gap-2 ">
                            <Calculator className="h-3.5 w-3.5 text-primary" /> Reconciliation Ledger
                        </h3>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="rounded-3xl bg-background font-bold text-[10px] shadow-sm">{selectedSplits.length} Target Splits</Badge>
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">Assign orphaned capital to selected nodes.</p>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6 min-h-0">
                <AnimatePresence mode="popLayout">
                    {selectedSplits.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-12 text-center space-y-3 border-2 border-dashed border-border/40 rounded-3xl bg-muted/10"
                        >
                            <div className="h-12 w-12 bg-background rounded-2xl bg-card flex items-center justify-center mx-auto shadow-sm border border-border/50">
                                <Plus className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest max-w-[180px] mx-auto ">
                                Tap project nodes to populate the split ledger.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {selectedSplits.map(s => (
                                <motion.div
                                    key={s.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 rounded-3xl bg-muted/20 border border-border/40 space-y-3 shadow-sm"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-primary tracking-widest  mb-0.5">Target Cause</p>
                                            <p className="text-xs font-bold text-foreground truncate">{s.title}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleProject({ id: s.id }); }}
                                            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all bg-background border border-border/50 shadow-sm"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground">₦</span>
                                        <Input
                                            placeholder="0.00"
                                            className="h-11 pl-8 rounded-2xl bg-background border-border/60 text-sm font-bold tabular-nums shadow-inner transition-all focus:bg-white"
                                            value={formatNumberInput(s.amount)}
                                            onChange={(e) => updateSplitAmount(s.id, e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-6 pb-[max(2rem,env(safe-area-inset-bottom))] bg-card border-t border-border/40 space-y-4 shrink-0 mt-auto">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] font-bold tracking-widest text-muted-foreground ">Original Allocation</span>
                    <span className="font-bold text-foreground tabular-nums text-sm">
                        <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="small" />
                    </span>
                </div>
                <div className="p-5 rounded-[28px] bg-zinc-950 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 ">Ledger Balance</span>
                        <span className={cn(
                            "text-xl font-black tabular-nums tracking-tight transition-colors duration-300",
                            remainingMinor === 0n ? "text-emerald-500" : remainingMinor < 0n ? "text-destructive" : "text-amber-500"
                        )}>
                            {remainingMinor < 0n ? '-' : ''}₦{(Math.abs(Number(remainingMinor)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {remainingMinor !== 0n && selectedSplits.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-zinc-400 animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Entry Must Balance To Zero For Commitment</span>
                        </div>
                    )}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Database className="h-12 w-12" />
                    </div>
                </div>
                <Button
                    className="w-full h-14 rounded-3xl text-xs font-black shadow-lg shadow-primary/20 gap-2 tracking-widest bg-primary hover:bg-primary/90 text-white border-0 transition-all active:scale-[0.98] disabled:opacity-50"
                    disabled={!isBalanced || selectedSplits.length === 0 || isProcessing}
                    onClick={() => setShowConfirm(true)}
                >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Execute Forensic Transfer
                </Button>
            </div>
        </div>
    );

    return (
        <LayoutGroup>
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-32 md:pb-20 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.back()}
                            className="group flex items-center text-[10px] font-black tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-2 "
                        >
                            <ArrowLeft className="h-3 w-3 mr-2 transition-transform group-hover:-translate-x-1" /> Back To Ledger
                        </button>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reallocate Orphaned Funds</h1>
                        <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 rounded-3xl border-border/50 bg-muted/20 shadow-inner">
                                Ref: {transaction.reference}
                            </Badge>
                            <div className="h-1 w-1 rounded-full bg-border" />
                            <p className="text-[11px] text-muted-foreground font-bold tracking-widest flex items-center gap-2 ">
                                <Database className="h-3.5 w-3.5 text-amber-500" /> Source: Suspense Node
                            </p>
                        </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center gap-8 shadow-sm w-full md:w-auto relative overflow-hidden">
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-primary tracking-widest ">Transaction Value</p>
                            <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="large" className="text-foreground font-black" />
                        </div>
                        <div className="h-10 w-px bg-primary/20 relative z-10" />
                        <div className="text-right space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-muted-foreground tracking-widest ">Current State</p>
                            <div className="flex items-center justify-end gap-2 text-amber-600 font-black text-[11px] tracking-widest  italic">
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                Unresolved
                            </div>
                        </div>
                        <Database className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/5 rotate-12" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Filter Active Project Nodes..."
                                className="pl-12 h-14 rounded-[22px] bg-card border-border/40 shadow-sm focus:bg-white transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative flex items-center group/browser">
                            {showLeftArrow && (
                                <div className="absolute left-0 top-0 bottom-0 z-20 hidden md:flex items-center pr-10 bg-gradient-to-r from-background via-background to-transparent pointer-events-none">
                                    <button
                                        onClick={() => handleScroll('left')}
                                        className="h-9 w-9 rounded-2xl border border-border/60 bg-card shadow-lg flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="flex gap-2.5 overflow-x-auto pb-3 px-1 no-scrollbar scroll-smooth w-full touch-pan-x"
                            >
                                <button
                                    onClick={() => setActiveCategory('all')}
                                    className={cn(
                                        "px-6 py-2.5 rounded-3xl text-[11px] font-black tracking-widest transition-all whitespace-nowrap border ",
                                        activeCategory === 'all'
                                            ? "bg-primary text-white border-primary shadow-lg"
                                            : "bg-card text-muted-foreground border-border/40 hover:border-border hover:text-foreground shadow-sm"
                                    )}
                                >
                                    All Sectors
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={cn(
                                            "px-6 py-2.5 rounded-3xl text-[11px] font-black tracking-widest transition-all whitespace-nowrap border ",
                                            activeCategory === cat.id
                                                ? "bg-primary text-white border-primary shadow-lg"
                                                : "bg-card text-muted-foreground border-border/40 hover:border-border hover:text-foreground shadow-sm"
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            {showRightArrow && (
                                <div className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center pl-10 bg-gradient-to-l from-background via-background to-transparent pointer-events-none">
                                    <button
                                        onClick={() => handleScroll('right')}
                                        className="h-9 w-9 rounded-2xl border border-border/60 bg-card shadow-lg flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.length === 0 ? (
                                <div className="col-span-full py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10">
                                    <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="font-black text-muted-foreground tracking-widest text-[11px] ">No Matching Project Nodes Identified</p>
                                </div>
                            ) : filteredProjects.map(p => {
                                const isSelected = selectedSplits.some(s => s.id === p.id);
                                return (
                                    <motion.div key={p.id} layout>
                                        <Card
                                            onClick={() => toggleProject(p)}
                                            className={cn(
                                                "rounded-[28px] border cursor-pointer transition-all duration-300 group relative overflow-hidden h-full",
                                                isSelected
                                                    ? "border-primary bg-primary/[0.03] shadow-lg ring-2 ring-primary/10"
                                                    : "border-border/40 bg-card hover:border-primary/30 hover:shadow-md"
                                            )}
                                        >
                                            <div className="p-5 flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0 border border-border/40 bg-muted shadow-inner">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full bg-secondary/50">
                                                            <Briefcase className="h-6 w-6 text-muted-foreground/40" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-black text-primary tracking-widest  mb-1">{p.categoryName}</p>
                                                    <h4 className="font-bold text-sm text-foreground truncate leading-tight">{p.title}</h4>
                                                    <p className="text-[11px] text-muted-foreground font-bold mt-1.5 flex items-center gap-2">
                                                        <Target className="h-3.5 w-3.5 text-muted-foreground/60" /> Goal: {formatCurrency(p.targetAmount, p.currency)}
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "h-10 w-10 rounded-2xl flex items-center justify-center border transition-all shrink-0 shadow-sm group-active:scale-90",
                                                    isSelected ? "bg-primary border-primary text-white" : "border-border/60 bg-background text-muted-foreground/40"
                                                )}>
                                                    {isSelected ? <Check className="h-5 w-5 stroke-[4px]" /> : <Plus className="h-5 w-5 stroke-[3px]" />}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden lg:block lg:col-span-4 sticky top-24">
                        <Card className="rounded-3xl border-border/40 bg-card shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-140px)] border-2">
                            {LedgerContent}
                        </Card>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedSplits.length > 0 && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="lg:hidden fixed left-4 right-4 bottom-[max(4.5rem,env(safe-area-inset-bottom))] z-40"
                        >
                            <div
                                onClick={() => setIsMobileLedgerOpen(true)}
                                className="bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-full p-2 pl-7 pr-2 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black tracking-[0.2em] text-zinc-500 ">Ledger Balance</span>
                                    <span className={cn(
                                        "text-sm font-black tabular-nums",
                                        remainingMinor === 0n ? "text-emerald-500" : "text-amber-500"
                                    )}>
                                        {remainingMinor < 0n ? '-' : ''}₦{(Math.abs(Number(remainingMinor)) / 100).toLocaleString()}
                                    </span>
                                </div>
                                <Button
                                    className="h-11 rounded-full px-8 font-black text-[10px] tracking-widest bg-primary text-white hover:bg-primary/90 border-0 shadow-lg"
                                >
                                    Commit Ledger <ArrowUpRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Dialog open={isMobileLedgerOpen} onOpenChange={setIsMobileLedgerOpen}>
                    <DialogContent className="w-full max-w-full h-[88dvh] p-0 rounded-t-[40px] rounded-b-none border-none shadow-2xl bg-card flex flex-col overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 z-50">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Reallocation Ledger Terminal</DialogTitle>
                        </DialogHeader>
                        {LedgerContent}
                    </DialogContent>
                </Dialog>

                <ConfirmModal
                    isOpen={showConfirm}
                    onClose={() => setShowConfirm(false)}
                    onConfirm={handleCommit}
                    isLoading={isProcessing}
                    variant="warning"
                    title="Authorize Ledger Commitment"
                    description={`Forensic Protocol: You are about to re-distribute ₦${(Number(transaction.amount) / 100).toLocaleString()} from the Suspense Node across ${selectedSplits.length} target causes. This transaction is immutable and will be recorded in the forensic audit trail.`}
                    confirmText="Commit Changes"
                    cancelText="Return To Ledger"
                />
            </div>
        </LayoutGroup>
    );
});