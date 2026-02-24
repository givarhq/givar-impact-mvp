'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Loader2,
    CornerDownLeft,
    FileText,
    Database,
    History,
    Repeat,
    Compass,
    Settings,
    X,
    ChevronRight,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { SmartCurrency } from '../../ui/smart-currency';
import { Badge } from '../../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface UserSearchResults {
    projects: any[];
    proposals: any[];
    transactions: any[];
    subscriptions: any[];
    auditLogs: any[];
    navigation: Array<{ label: string; path: string }>;
}

type FilterType = 'all' | 'projects' | 'proposals' | 'transactions' | 'subscriptions' | 'auditLogs';

const FILTERS: { id: FilterType; label: string; icon: any }[] = [
    { id: 'all', label: 'All Results', icon: LayoutGrid },
    { id: 'projects', label: 'Verified Causes', icon: Compass },
    { id: 'proposals', label: 'My Proposals', icon: FileText },
    { id: 'transactions', label: 'Ledger History', icon: Database },
    { id: 'subscriptions', label: 'Recurring Support', icon: Repeat },
    { id: 'auditLogs', label: 'Activity Logs', icon: History },
];

export const UserGlobalSearch = memo(function UserGlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<UserSearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                try {
                    const data = await ApiService.projects.globalSearch(query.trim());
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("The search failed to execute properly");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults(null);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavigate = (path: string) => {
        router.push(path);
        setIsOpen(false);
        setQuery('');
        setActiveFilter('all');
    };

    const hasResults = results && (
        results.projects.length > 0 ||
        results.proposals.length > 0 ||
        results.transactions.length > 0 ||
        results.subscriptions.length > 0 ||
        results.auditLogs.length > 0 ||
        results.navigation.length > 0
    );

    const getFilteredResults = () => {
        if (!results) return null;
        if (activeFilter === 'all') return results;

        return {
            projects: activeFilter === 'projects' ? results.projects : [],
            proposals: activeFilter === 'proposals' ? results.proposals : [],
            transactions: activeFilter === 'transactions' ? results.transactions : [],
            subscriptions: activeFilter === 'subscriptions' ? results.subscriptions : [],
            auditLogs: activeFilter === 'auditLogs' ? results.auditLogs : [],
            navigation: []
        };
    };

    const displayData = getFilteredResults();

    return (
        <div
            ref={containerRef}
            className="relative w-full hidden md:block z-50 min-w-0"
        >
            <div className="relative group min-w-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search anything..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors outline-none active:scale-90">
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="bg-background border border-border/60 px-2 py-0.5 rounded-3xl text-[11px] text-muted-foreground font-bold flex items-center gap-1 shadow-sm tracking-tighter">
                            <CornerDownLeft className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full mt-2 left-0 right-0 bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col origin-top min-w-0"
                    >
                        {hasResults && (
                            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/40 bg-muted/60 shrink-0 px-4">
                                {FILTERS.map(f => {
                                    const rawArr = results ? (results[f.id as keyof UserSearchResults] || []) : [];
                                    const count = Array.isArray(rawArr) ? rawArr.length : 0;
                                    if (f.id !== 'all' && count === 0) return null;
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setActiveFilter(f.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-4 py-1.5 rounded-3xl text-xs font-bold transition-all whitespace-nowrap border shrink-0",
                                                activeFilter === f.id
                                                    ? "bg-primary text-white border-primary shadow-sm"
                                                    : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <f.icon className="h-3.5 w-3.5" />
                                            {f.label}
                                            {f.id !== 'all' && <span className="ml-1 opacity-60 tabular-nums">{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="overflow-y-auto no-scrollbar flex-1 p-2 min-w-0">
                            {!hasResults && !isLoading ? (
                                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                                    <div className="h-14 w-14 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/40 shadow-inner">
                                        <Compass className="h-7 w-7 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground">We Couldn't Find Any Matches</p>
                                        <p className="text-xs font-medium opacity-60 max-w-[240px] mx-auto">Try searching for a different cause title, location, or transaction ID.</p>
                                    </div>
                                </div>
                            ) : displayData && (
                                <div className="space-y-4 pb-2 min-w-0">
                                    {activeFilter === 'all' && displayData.navigation.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">Shortcuts</div>
                                            {displayData.navigation.map((nav, i) => (
                                                <button key={i} onClick={() => handleNavigate(nav.path)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left group min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                                                        <Settings className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block truncate">{nav.label}</span>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {displayData.projects.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">Verified Causes</div>
                                            {displayData.projects.map(p => (
                                                <button key={p.id} onClick={() => handleNavigate(`/dashboard/impact/${p.slug}`)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <Compass className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground truncate block group-hover:text-primary">{p.title}</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] text-muted-foreground font-bold tracking-tighter">Goal:</span>
                                                            <SmartCurrency amount={p.targetAmount.toString()} currency={p.currency} visible={true} size="small" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {displayData.proposals.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">My Proposals</div>
                                            {displayData.proposals.map(p => (
                                                <button key={p.id} onClick={() => handleNavigate(`/dashboard/proposals/edit/${p.id}/hook`)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground truncate block">{p.title || 'Untitled Draft'}</span>
                                                        <Badge variant="outline" className="text-[11px] h-5 mt-1 px-2 font-bold rounded-3xl border-purple-500/20 bg-purple-500/5 shadow-none">{p.status}</Badge>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {displayData.transactions.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">Ledger History</div>
                                            {displayData.transactions.map(tx => (
                                                <button key={tx.id} onClick={() => handleNavigate(`/dashboard/history`)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/40 shadow-inner">
                                                        <Database className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-4">
                                                            <span className="font-mono text-xs font-bold text-foreground truncate">ID: {tx.reference.slice(0, 8)}...</span>
                                                            <SmartCurrency amount={tx.amount.toString()} currency={tx.currency} visible={true} size="small" className="shrink-0" />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate font-medium">{tx.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {displayData.subscriptions.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">Recurring Support</div>
                                            {displayData.subscriptions.map(s => (
                                                <button key={s.id} onClick={() => handleNavigate(`/dashboard/subscriptions`)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left group min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <Repeat className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground truncate block group-hover:text-primary">{s.project.title}</span>
                                                        <p className="text-xs text-muted-foreground font-bold tracking-tight">{s.interval} Contribution</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {displayData.auditLogs.length > 0 && (
                                        <div className="space-y-1 min-w-0">
                                            <div className="px-4 py-1 text-[11px] font-bold tracking-widest text-muted-foreground/60">Account Activity</div>
                                            {displayData.auditLogs.map(log => (
                                                <button key={log.id} onClick={() => handleNavigate(`/dashboard/settings?tab=activity`)} className="w-full flex items-center gap-4 p-3 rounded-3xl hover:bg-primary/5 transition-all text-left min-w-0 active:scale-[0.99]">
                                                    <div className="h-10 w-10 rounded-2xl bg-zinc-500/10 text-zinc-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <History className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground block truncate group-hover:text-primary">{log.action.replace(/_/g, ' ')}</span>
                                                        <span className="text-xs text-muted-foreground font-medium">{formatDate(log.createdAt)}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});