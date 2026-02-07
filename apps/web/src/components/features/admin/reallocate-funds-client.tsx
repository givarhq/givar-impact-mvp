'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Search, Database, Calculator,
    Plus, X, Check, ShieldCheck, AlertCircle, Loader2,
    Filter, LayoutGrid, ChevronLeft, ChevronRight, Target,
    AlertTriangle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { ConfirmModal } from '../../ui/confirm-modal';
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

    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const totalOrphanedMinor = BigInt(transaction.amount);

    // 1. Scroll Control Logic for Category Browser
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

    // 2. Filtering Logic
    const filteredProjects = useMemo(() => {
        return initialProjects.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory, initialProjects]);

    // 3. Selection & Split Logic
    const toggleProject = (project: any) => {
        const exists = selectedSplits.find(s => s.id === project.id);
        if (exists) {
            setSelectedSplits(prev => prev.filter(s => s.id !== project.id));
        } else {
            setSelectedSplits(prev => [...prev, { id: project.id, title: project.title, amount: '' }]);
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
            toast.success("Ledger reconciliation successful.");
            router.push('/admin/ledger');
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Reallocation protocol failed");
        } finally {
            setIsProcessing(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Context */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-2"
                    >
                        <ArrowLeft className="h-3 w-3 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Ledger
                    </button>
                    <h1 className="text-xl font-black text-foreground">Fund Re-allocation</h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-muted font-mono text-[10px] py-1 px-3 rounded-lg border-border/50">
                            REF: {transaction.reference}
                        </Badge>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                            <Database className="h-3.5 w-3.5" /> Source Node: <span className="text-foreground font-bold">Givar Suspense Ledger</span>
                        </p>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 flex items-center gap-8 shadow-xl shadow-primary/[0.02]">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">Orphaned Capital</p>
                        <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="default" className="text-foreground" />
                    </div>
                    <div className="h-10 w-px bg-primary/20" />
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Status</p>
                        <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase italic">
                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            Pending Resolution
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: Project Discovery Interface */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search target causes by title or location..."
                                className="pl-11 h-14 rounded-2xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/20 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* --- CATEGORY BROWSER WITH DESKTOP ARROWS --- */}
                    <div className="relative flex items-center group/browser">
                        {showLeftArrow && (
                            <div className="absolute left-0 top-0 bottom-0 z-20 hidden md:flex items-center pr-12 bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none">
                                <button
                                    onClick={() => handleScroll('left')}
                                    className="h-10 w-10 rounded-full border border-border bg-card shadow-xl flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all active:scale-90"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div
                            ref={scrollRef}
                            onScroll={checkScroll}
                            className="flex gap-2 overflow-x-auto pb-4 px-1 no-scrollbar scroll-smooth w-full touch-pan-x"
                        >
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                    activeCategory === 'all'
                                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                        : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                                )}
                            >
                                All Sectors
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={cn(
                                        "px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                                        activeCategory === cat.id
                                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                            : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {showRightArrow && (
                            <div className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center pl-12 bg-gradient-to-l from-background via-background/90 to-transparent pointer-events-none">
                                <button
                                    onClick={() => handleScroll('right')}
                                    className="h-10 w-10 rounded-full border border-border bg-card shadow-xl flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all active:scale-90"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cause Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/20">
                                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">No matching causes found</p>
                            </div>
                        ) : filteredProjects.map(p => {
                            const isSelected = selectedSplits.some(s => s.id === p.id);
                            return (
                                <Card
                                    key={p.id}
                                    onClick={() => toggleProject(p)}
                                    className={cn(
                                        "rounded-[32px] border-2 cursor-pointer transition-all duration-500 group relative overflow-hidden",
                                        isSelected
                                            ? "border-primary bg-primary/[0.02] shadow-2xl shadow-primary/5"
                                            : "border-border/50 bg-card hover:border-primary/30 hover:shadow-lg"
                                    )}
                                >
                                    <div className="p-5 flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-border/50 bg-muted shadow-inner">
                                            {p.imageUrl && <img src={p.imageUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{p.categoryName}</p>
                                            <h4 className="font-black text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight uppercase tracking-tight">{p.title}</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold mt-1.5 flex items-center gap-2">
                                                <Target className="h-3 w-3" /> Goal: {formatCurrency(p.targetAmount, p.currency)}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "h-10 w-10 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0",
                                            isSelected ? "bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20" : "border-border/50 bg-muted/30"
                                        )}>
                                            {isSelected ? <Check className="h-5 w-5 stroke-[4px]" /> : <Plus className="h-5 w-5 text-muted-foreground/40" />}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Split Ledger Summary */}
                <div className="lg:col-span-4 sticky top-24">
                    <Card className="rounded-[40px] border-border/50 bg-card shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-muted/40 p-8 border-b border-border/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" /> Reconciliation Ledger
                                </h3>
                                <Badge variant="outline" className="rounded-lg bg-background font-black text-[10px]">{selectedSplits.length} Splits</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">Allocate funds across verified causes.</p>
                        </div>

                        <CardContent className="p-8 space-y-8">
                            {selectedSplits.length === 0 ? (
                                <div className="py-16 text-center space-y-4">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-40">
                                        <Plus className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                                        Select causes from the discovery grid to begin splitting funds.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                                    {selectedSplits.map(s => (
                                        <div key={s.id} className="p-5 rounded-[24px] bg-muted/20 border border-border/50 space-y-4 animate-in zoom-in-95 duration-300 relative group/split">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] mb-0.5">Target Cause</p>
                                                    <p className="text-sm font-black text-foreground line-clamp-1 uppercase tracking-tight">{s.title}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleProject({ id: s.id }); }}
                                                    className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-foreground">₦</span>
                                                <Input
                                                    placeholder="0.00"
                                                    className="h-14 pl-10 rounded-2xl bg-background border-border/60 text-lg font-black tabular-nums transition-all focus:border-primary"
                                                    value={formatNumberInput(s.amount)}
                                                    onChange={(e) => updateSplitAmount(s.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ledger Totals */}
                            <div className="pt-6 border-t border-border/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orphaned Capital</span>
                                    <span className="font-bold text-foreground tabular-nums">
                                        <SmartCurrency amount={transaction.amount} currency={transaction.currency} visible={true} size="small" />
                                    </span>
                                </div>

                                <div className="p-5 rounded-[24px] bg-zinc-950 text-white shadow-xl shadow-zinc-950/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Unallocated Buffer</span>
                                        <span className={cn(
                                            "text-xl font-black tabular-nums tracking-tighter",
                                            remainingMinor === 0n ? "text-emerald-500" : remainingMinor < 0n ? "text-destructive" : "text-amber-500"
                                        )}>
                                            {remainingMinor < 0n ? '-' : ''}₦{(Math.abs(Number(remainingMinor)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    {remainingMinor !== 0n && selectedSplits.length > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                                            <span>Ledger Mismatch Detected</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full h-16 rounded-[28px] text-lg font-black shadow-2xl shadow-primary/30 gap-3 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                                disabled={!isBalanced || selectedSplits.length === 0 || isProcessing}
                                onClick={() => setShowConfirm(true)}
                            >
                                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                                Execute Re-allocation
                            </Button>

                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold tracking-wider">
                                    Re-allocation generates independent donation receipts for the original actor and updates cause impact nodes.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleCommit}
                isLoading={isProcessing}
                title="Confirm Ledger Entry"
                description={`Audit Protocol: You are about to re-distribute ₦${(Number(transaction.amount) / 100).toLocaleString()} across ${selectedSplits.length} target causes. This transaction is immutable and will be registered in the forensic audit trail.`}
                confirmText="Commit Changes"
            />
        </div>
    );
}