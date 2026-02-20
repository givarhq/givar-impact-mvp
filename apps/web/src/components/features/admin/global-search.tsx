'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Loader2,
    CornerDownLeft,
    User,
    FileText,
    Building2,
    Database,
    ShieldAlert,
    Briefcase,
    X,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { SmartCurrency } from '../../ui/smart-currency';
import { Badge } from '../../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResults {
    users: any[];
    projects: any[];
    proposals: any[];
    organizations: any[];
    transactions: any[];
    auditLogs: any[];
}

type FilterType = 'all' | 'users' | 'projects' | 'proposals' | 'organizations' | 'transactions' | 'auditLogs';

const FILTERS: { id: FilterType; label: string; icon: any }[] = [
    { id: 'all', label: 'All Matches', icon: LayoutGrid },
    { id: 'users', label: 'Identities', icon: User },
    { id: 'projects', label: 'Causes', icon: Briefcase },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'transactions', label: 'Ledger Entries', icon: Database },
    { id: 'auditLogs', label: 'Security Logs', icon: ShieldAlert },
];

export const GlobalSearch = memo(function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                const token = getCookie('givar_token') as string;
                if (!token) return;

                try {
                    const data = await ApiService.admin.globalSearch(query.trim(), token);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search protocol failure", error);
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim().length >= 2) {
            setIsOpen(true);
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleNavigate = (path: string) => {
        router.push(path);
        setIsOpen(false);
        setQuery('');
        setActiveFilter('all');
    };

    const hasResults = results && Object.values(results).some((arr) => arr.length > 0);

    const getFilteredResults = () => {
        if (!results) return null;
        if (activeFilter === 'all') return results;
        return {
            users: activeFilter === 'users' ? results.users : [],
            projects: activeFilter === 'projects' ? results.projects : [],
            proposals: activeFilter === 'proposals' ? results.proposals : [],
            organizations: activeFilter === 'organizations' ? results.organizations : [],
            transactions: activeFilter === 'transactions' ? results.transactions : [],
            auditLogs: activeFilter === 'auditLogs' ? results.auditLogs : [],
        };
    };

    const displayData = getFilteredResults();

    return (
        <div ref={containerRef} className="relative w-full max-w-lg hidden md:block z-50">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Find People, Projects, Or Receipts..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm focus:shadow-md"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (query.trim().length >= 2) setIsOpen(true);
                    }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors outline-none"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1 bg-background border border-border/60 px-2 py-0.5 rounded-3xl text-[10px] text-muted-foreground font-bold shadow-sm">
                            <CornerDownLeft className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.99 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full mt-3 left-0 right-0 bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col origin-top"
                    >
                        {hasResults && (
                            <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border/40 bg-muted/40 shrink-0">
                                {FILTERS.map(f => {
                                    const count = results && f.id !== 'all' ? results[f.id as keyof SearchResults]?.length : 0;
                                    const isAll = f.id === 'all';

                                    if (!isAll && count === 0) return null;

                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => setActiveFilter(f.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-3xl text-[11px] font-bold transition-all whitespace-nowrap border shrink-0",
                                                activeFilter === f.id
                                                    ? "bg-primary text-white border-primary shadow-md scale-105"
                                                    : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                                            )}
                                        >
                                            <f.icon className="h-3 w-3" />
                                            {f.label}
                                            {!isAll && (
                                                <span className={cn(
                                                    "ml-1 px-1.5 py-0.5 rounded-full text-[9px] min-w-[18px] text-center font-black",
                                                    activeFilter === f.id ? "bg-white/20 text-white" : "bg-muted text-foreground"
                                                )}>{count}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="overflow-y-auto no-scrollbar flex-1 p-3">
                            {!hasResults && !isLoading ? (
                                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                                    <div className="h-14 w-14 bg-muted/50 rounded-[22px] flex items-center justify-center border border-border/40 shadow-inner">
                                        <Search className="h-6 w-6 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground">No Matches Identified</p>
                                        <p className="text-xs font-medium opacity-60">Try searching by full name, email address, or reference ID</p>
                                    </div>
                                </div>
                            ) : displayData ? (
                                <div className="space-y-5 pb-2">
                                    {/* IDENTITIES */}
                                    {displayData.users.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                                                <User className="h-3 w-3" /> User Identities
                                            </div>
                                            {displayData.users.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleNavigate(`/admin/users/${user.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
                                                        {user.firstName[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-sm text-foreground">{user.firstName} {user.lastName}</span>
                                                            <Badge variant="secondary" className={cn(
                                                                "text-[9px] px-2 py-0 rounded-full font-black tracking-wider shadow-none border-none",
                                                                user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                                                            )}>{user.role}</Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-2xl bg-background border border-border/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm shrink-0">
                                                        <ArrowRight className="h-4 w-4 text-primary" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* CAUSES */}
                                    {displayData.projects.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2 mt-2">
                                                <Briefcase className="h-3 w-3" /> Project Nodes
                                            </div>
                                            {displayData.projects.map(project => (
                                                <button
                                                    key={project.id}
                                                    onClick={() => handleNavigate(`/admin/projects/${project.id}/edit`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <FileText className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="font-bold text-sm text-foreground truncate">{project.title}</span>
                                                            <SmartCurrency amount={project.raisedAmount.toString()} currency={project.currency} visible={true} size="small" className="shrink-0" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[9px] h-4.5 px-2 font-bold tracking-tight rounded-full bg-background border-border/60 shadow-none ">{project.status}</Badge>
                                                            <span className="text-[10px] text-muted-foreground font-mono truncate opacity-60">Ref: {project.slug.split('-')[0]}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* PROPOSALS */}
                                    {displayData.proposals.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2 mt-2">
                                                <FileText className="h-3 w-3" /> Cause Proposals
                                            </div>
                                            {displayData.proposals.map(prop => (
                                                <button
                                                    key={prop.id}
                                                    onClick={() => handleNavigate(`/admin/proposals/${prop.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <FileText className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-bold text-sm text-foreground truncate block">{prop.title || 'Untitled Draft'}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[9px] h-4.5 px-2 border-purple-500/20 bg-purple-500/5 text-purple-600 font-bold rounded-full ">{prop.status}</Badge>
                                                            <span className="text-[10px] text-muted-foreground font-medium">{prop.category?.name || 'Uncategorized'}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* ORGANIZATIONS */}
                                    {displayData.organizations.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2 mt-2">
                                                <Building2 className="h-3 w-3" /> Partner Entities
                                            </div>
                                            {displayData.organizations.map(org => (
                                                <button
                                                    key={org.id}
                                                    onClick={() => handleNavigate(`/admin/organizations/${org.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className="h-10 w-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <Building2 className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <span className="font-bold text-sm text-foreground block truncate">{org.legalName}</span>
                                                            <Badge variant="outline" className="text-[9px] h-4.5 px-2 font-bold rounded-full shadow-none border-border/60 ">{org.status}</Badge>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-muted-foreground font-medium mt-0.5 block">Reg: {org.registrationNumber || 'No Data Identified'}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* LEDGER */}
                                    {displayData.transactions.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2 mt-2">
                                                <Database className="h-3 w-3" /> Financial Ledger
                                            </div>
                                            {displayData.transactions.map(tx => (
                                                <button
                                                    key={tx.id}
                                                    onClick={() => handleNavigate(`/admin/ledger?search=${tx.reference}`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl flex items-center justify-center font-black text-[11px] border shrink-0 shadow-inner",
                                                        tx.type === 'CREDIT' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    )}>
                                                        {tx.type === 'CREDIT' ? 'CR' : 'DR'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="font-mono text-xs font-bold text-foreground truncate">{tx.reference}</span>
                                                            <SmartCurrency amount={tx.amount.toString()} currency={tx.currency} visible={true} size="small" className="shrink-0" />
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground truncate mt-1 font-medium italic opacity-80">{tx.description || 'System Ledger Transfer'}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* SECURITY */}
                                    {displayData.auditLogs.length > 0 && (
                                        <div className="space-y-1">
                                            <div className="px-4 py-1.5 text-[10px] font-black tracking-widest text-primary flex items-center gap-2 mt-2">
                                                <ShieldAlert className="h-3 w-3" /> Security Protocol
                                            </div>
                                            {displayData.auditLogs.map(log => (
                                                <button
                                                    key={log.id}
                                                    onClick={() => handleNavigate(`/admin/audit?search=${log.id}`)}
                                                    className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group active:scale-[0.98]"
                                                >
                                                    <div className="h-10 w-10 rounded-2xl bg-zinc-500/10 text-zinc-600 flex items-center justify-center shrink-0 shadow-inner">
                                                        <ShieldAlert className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span className="font-bold text-xs text-foreground truncate">{log.action.replace(/_/g, ' ')}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt).split(',')[0]}</span>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">
                                                            {log.entityType} Node • {log.ipAddress}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest ">
                                System Consensus Database Scanned
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});