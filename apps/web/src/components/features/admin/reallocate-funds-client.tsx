'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../lib/utils/format';
import toast from 'react-hot-toast';

interface ReallocateFundsClientProps {
    transaction: any;
    initialProjects: any[];
    categories: any[];
}

export function ReallocateFundsClient({ transaction, initialProjects, categories }: ReallocateFundsClientProps) {
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
                toast.success("Added to Ledger", { icon: <Plus className="h-4 w-4" /> });
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
        try {
            await ApiService.admin.resolveSuspense(transaction.id, {
                action: 'ALLOCATE' as any,
                allocations: selectedSplits.map(s => ({
                    projectId: s.id,
                    amount: (BigInt(parseFormattedNumber(s.amount)) * 100n).toString()
                }))
            });
            toast.success("Reconciliation complete");
            router.push('/admin/ledger');
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Protocol failed");
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
                        <h3 className="text-[11px] font-black  tracking-widest text-foreground flex items-center gap-2">
                            <Calculator className="h-3.5 w-3.5 text-primary" /> Reconciliation Ledger
                        </h3>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="rounded-3xl bg-background font-bold text-[10px]">{selectedSplits.length} Splits</Badge>
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">Assign capital to selected nodes.</p>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6 min-h-0">
                {selectedSplits.length === 0 ? (
                    <div className="py-12 text-center space-y-3 border-2 border-dashed border-border/40 rounded-3xl bg-muted/10">
                        <div className="h-12 w-12 bg-background rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-border/50">
                            <Plus className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground  tracking-widest max-w-[180px] mx-auto">
                            Tap projects to populate the split ledger.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedSplits.map(s => (
                            <div key={s.id} className="p-4 rounded-3xl bg-muted/20 border border-border/40 space-y-3 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-bold text-primary  tracking-wider mb-0.5">Target Cause</p>
                                        <p className="text-xs font-bold text-foreground truncate">{s.title}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleProject({ id: s.id }); }}
                                        className="h-7 w-7 rounded-3xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all bg-background border border-border/50"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground">₦</span>
                                    <Input
                                        placeholder="0.00"
                                        className="h-10 pl-8 rounded-3xl bg-background border-border/60 text-sm font-bold tabular-nums shadow-sm"
                                        value={formatNumberInput(s.amount)}
                                        onChange={(e) => updateSplitAmount(s.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 pb-[max(2rem,env(safe-area-inset-bottom))] bg-card border-t border-border/40 space-y-4 shrink-0 mt-auto">
                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold  tracking-widest text-muted-foreground">Original Cap</span>
                    <span className="font-bold text-foreground tabular-nums text-sm">
                        <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="small" />
                    </span>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-950 text-white shadow-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold  tracking-widest text-zinc-500">Unallocated</span>
                        <span className={cn(
                            "text-lg font-black tabular-nums tracking-tight",
                            remainingMinor === 0n ? "text-emerald-500" : remainingMinor < 0n ? "text-destructive" : "text-amber-500"
                        )}>
                            {remainingMinor < 0n ? '-' : ''}₦{(Math.abs(Number(remainingMinor)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {remainingMinor !== 0n && selectedSplits.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span>Must balance to zero</span>
                        </div>
                    )}
                </div>
                <Button
                    className="w-full h-12 rounded-3xl text-xs font-bold shadow-lg shadow-primary/20 gap-2  tracking-wider bg-primary hover:bg-primary/90 text-white border-0"
                    disabled={!isBalanced || selectedSplits.length === 0 || isProcessing}
                    onClick={() => setShowConfirm(true)}
                >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Execute Transfer
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 pb-32 md:pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center text-[11px] font-bold  tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-1"
                    >
                        <ArrowLeft className="h-3 w-3 mr-2 transition-transform group-hover:-translate-x-1" /> Back
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Reallocate Funds</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-[10px] py-0.5 px-2 rounded-3xl border-border/50 bg-background">
                            REF: {transaction.reference}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                            <Database className="h-3 w-3" /> Source: <span className="text-foreground font-bold">Suspense Ledger</span>
                        </p>
                    </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center gap-6 shadow-sm w-full md:w-auto">
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold  text-primary tracking-widest">Orphaned Capital</p>
                        <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="default" className="text-foreground" />
                    </div>
                    <div className="h-8 w-px bg-primary/20" />
                    <div className="text-right space-y-0.5">
                        <p className="text-[10px] font-bold  text-muted-foreground tracking-widest">Status</p>
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px]  italic">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    <div className="relative w-full group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search causes..."
                            className="pl-10 h-12 rounded-3xl bg-card border-border/40 shadow-sm focus-visible:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative flex items-center group/browser">
                        {showLeftArrow && (
                            <div className="absolute left-0 top-0 bottom-0 z-20 hidden md:flex items-center pr-8 bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none">
                                <button
                                    onClick={() => handleScroll('left')}
                                    className="h-8 w-8 rounded-3xl border border-border bg-card shadow-sm flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar scroll-smooth w-full touch-pan-x"
                        >
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={cn(
                                    "px-4 py-2 rounded-3xl text-[11px] font-bold  tracking-wider transition-all whitespace-nowrap border",
                                    activeCategory === 'all'
                                        ? "bg-primary text-white border-primary shadow-sm"
                                        : "bg-card text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
                                )}
                            >
                                All Sectors
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-3xl text-[11px] font-bold  tracking-wider transition-all whitespace-nowrap border",
                                        activeCategory === cat.id
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-card text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        {showRightArrow && (
                            <div className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center pl-8 bg-gradient-to-l from-background via-background/90 to-transparent pointer-events-none">
                                <button
                                    onClick={() => handleScroll('right')}
                                    className="h-8 w-8 rounded-3xl border border-border bg-card shadow-sm flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/10">
                                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground opacity-30 mb-3" />
                                <p className="font-bold text-muted-foreground  tracking-widest text-[11px]">No matching causes found</p>
                            </div>
                        ) : filteredProjects.map(p => {
                            const isSelected = selectedSplits.some(s => s.id === p.id);
                            return (
                                <Card
                                    key={p.id}
                                    onClick={() => toggleProject(p)}
                                    className={cn(
                                        "rounded-3xl border cursor-pointer transition-all duration-300 group relative overflow-hidden",
                                        isSelected
                                            ? "border-primary bg-primary/[0.03] shadow-md"
                                            : "border-border/40 bg-card hover:border-primary/30 hover:shadow-sm"
                                    )}
                                >
                                    <div className="p-4 flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-3xl overflow-hidden shrink-0 border border-border/40 bg-muted shadow-sm">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" alt="" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full w-full bg-secondary/50">
                                                    <Briefcase className="h-5 w-5 text-muted-foreground/40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-bold text-primary  tracking-widest mb-0.5">{p.categoryName}</p>
                                            <h4 className="font-bold text-sm text-foreground truncate">{p.title}</h4>
                                            <p className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                                                <Target className="h-3 w-3" /> Goal: {formatCurrency(p.targetAmount, p.currency)}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-9 w-9 rounded-3xl flex items-center justify-center border transition-all shrink-0 shadow-sm",
                                            isSelected ? "bg-primary border-primary text-white" : "border-border/60 bg-background"
                                        )}>
                                            {isSelected ? <Check className="h-4 w-4 stroke-[3px]" /> : <Plus className="h-4 w-4 text-muted-foreground/50" />}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden lg:block lg:col-span-4 sticky top-24">
                    <Card className="rounded-3xl border-border/40 bg-card shadow-lg overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                        {LedgerContent}
                    </Card>
                </div>
            </div>

            {selectedSplits.length > 0 && (
                <div className="lg:hidden fixed left-4 right-4 bottom-[max(4rem,env(safe-area-inset-bottom))] z-40 animate-in slide-in-from-bottom duration-500">
                    <div
                        onClick={() => setIsMobileLedgerOpen(true)}
                        className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-2 shadow-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black  tracking-widest text-zinc-500">Balance</span>
                            <span className={cn(
                                "text-sm font-black tabular-nums text-white",
                                remainingMinor !== 0n && "text-amber-500"
                            )}>
                                {remainingMinor < 0n ? '-' : ''}₦{(Math.abs(Number(remainingMinor)) / 100).toLocaleString()}
                            </span>
                        </div>
                        <Button
                            className="h-11 rounded-3xl px-6 font-bold text-[11px]  tracking-widest bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 border-0"
                        >
                            Review Ledger <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isMobileLedgerOpen} onOpenChange={setIsMobileLedgerOpen}>
                {/* 
                    FIX: Corrected mobile positioning. 
                    - 'left-0 right-0 bottom-0 top-auto': Anchors precisely to the bottom.
                    - 'translate-x-0 translate-y-0': Neutralizes the -50% centering logic from base component.
                    - 'w-full max-w-full': Ensures edge-to-edge width on mobile.
                */}
                <DialogContent className="w-full max-w-full h-[85dvh] p-0 rounded-t-[32px] rounded-b-none border-none shadow-2xl bg-card flex flex-col overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 z-50">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Ledger Management</DialogTitle>
                    </DialogHeader>
                    {LedgerContent}
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleCommit}
                isLoading={isProcessing}
                title="Confirm Ledger Entry"
                description={`Audit Protocol: You are about to re-distribute ₦${(Number(transaction.amount) / 100).toLocaleString()} across ${selectedSplits.length} target causes. This transaction is immutable.`}
                confirmText="Commit Changes"
            />
        </div>
    );
}