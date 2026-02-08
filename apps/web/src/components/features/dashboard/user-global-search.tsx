'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    { id: 'all', label: 'All', icon: LayoutGrid },
    { id: 'projects', label: 'Causes', icon: Compass },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'transactions', label: 'Ledger', icon: Database },
    { id: 'subscriptions', label: 'Recurring', icon: Repeat },
    { id: 'auditLogs', label: 'Activity', icon: History },
];

export function UserGlobalSearch() {
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
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const data = await ApiService.projects.globalSearch(query);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
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

        // At this point, TS knows activeFilter is not 'all', so we return empty arrays for non-matches
        return {
            projects: activeFilter === 'projects' ? results.projects : [],
            proposals: activeFilter === 'proposals' ? results.proposals : [],
            transactions: activeFilter === 'transactions' ? results.transactions : [],
            subscriptions: activeFilter === 'subscriptions' ? results.subscriptions : [],
            auditLogs: activeFilter === 'auditLogs' ? results.auditLogs : [],
            navigation: [] // Shortcuts only show in 'All' view
        };
    };

    const displayData = getFilteredResults();

    return (
        <div ref={containerRef} className="relative w-full max-w-lg hidden md:block z-50">
            <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search causes, receipts, activity..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-2xl py-2.5 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <div className="bg-background border border-border/60 px-1.5 py-0.5 rounded text-[9px] text-muted-foreground font-bold flex items-center gap-1 shadow-sm">
                            <CornerDownLeft className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-[24px] shadow-2xl overflow-hidden max-h-[60vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 origin-top">

                    {hasResults && (
                        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/40 bg-muted/40 shrink-0 px-4">
                            {FILTERS.map(f => {
                                const count = results && f.id !== 'all' ? (results[f.id as keyof UserSearchResults] as any[]).length : 0;
                                if (f.id !== 'all' && count === 0) return null;
                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFilter(f.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0",
                                            activeFilter === f.id
                                                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                                : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <f.icon className="h-3 w-3" />
                                        {f.label}
                                        {f.id !== 'all' && <span className="ml-1 opacity-60">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="overflow-y-auto no-scrollbar flex-1 p-2">
                        {!hasResults && !isLoading ? (
                            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                                <Compass className="h-8 w-8 opacity-20 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">No matches found</p>
                            </div>
                        ) : displayData && (
                            <div className="space-y-4">
                                {activeFilter === 'all' && displayData.navigation.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Shortcuts</div>
                                        {displayData.navigation.map((nav, i) => (
                                            <button key={i} onClick={() => handleNavigate(nav.path)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left group">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Settings className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{nav.label}</span>
                                                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-30" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {displayData.projects.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verified Causes</div>
                                        {displayData.projects.map(p => (
                                            <button key={p.id} onClick={() => handleNavigate(`/dashboard/impact/${p.slug}`)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left">
                                                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <Compass className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-foreground truncate block">{p.title}</span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Goal:</span>
                                                        <SmartCurrency amount={p.targetAmount.toString()} currency={p.currency} visible={true} size="small" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {displayData.proposals.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">My Proposals</div>
                                        {displayData.proposals.map(p => (
                                            <button key={p.id} onClick={() => handleNavigate(`/dashboard/proposals/edit/${p.id}/hook`)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left">
                                                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-foreground truncate block">{p.title || 'Untitled Draft'}</span>
                                                    <Badge variant="outline" className="text-[9px] h-4 mt-1 px-1.5 font-bold uppercase">{p.status}</Badge>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {displayData.transactions.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Ledger History</div>
                                        {displayData.transactions.map(tx => (
                                            <button key={tx.id} onClick={() => handleNavigate(`/dashboard/history`)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left">
                                                <div className="h-9 w-9 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border/50">
                                                    <Database className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <span className="font-mono text-[10px] font-bold text-foreground truncate">{tx.reference}</span>
                                                        <SmartCurrency amount={tx.amount.toString()} currency={tx.currency} visible={true} size="small" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate font-medium">{tx.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {displayData.subscriptions.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Recurring Impact</div>
                                        {displayData.subscriptions.map(s => (
                                            <button key={s.id} onClick={() => handleNavigate(`/dashboard/subscriptions`)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left group">
                                                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                                    <Repeat className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-foreground truncate block">{s.project.title}</span>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{s.interval} Donation</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {displayData.auditLogs.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Account Activity</div>
                                        {displayData.auditLogs.map(log => (
                                            <button key={log.id} onClick={() => handleNavigate(`/dashboard/settings?tab=activity`)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left">
                                                <div className="h-9 w-9 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center shrink-0">
                                                    <History className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-xs text-foreground block">{log.action.replace(/_/g, ' ')}</span>
                                                    <span className="text-[9px] text-muted-foreground font-medium">{formatDate(log.createdAt)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}