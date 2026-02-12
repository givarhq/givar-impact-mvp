'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    ChevronRight,
    LayoutGrid,
    ArrowRight
} from 'lucide-react';
import { Input } from '../../ui/input';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { SmartCurrency } from '../../ui/smart-currency';
import { Badge } from '../../ui/badge';

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
    { id: 'all', label: 'All Results', icon: LayoutGrid },
    { id: 'users', label: 'Users', icon: User },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'organizations', label: 'Orgs', icon: Building2 },
    { id: 'transactions', label: 'Ledger', icon: Database },
    { id: 'auditLogs', label: 'Audit', icon: ShieldAlert },
];

export function GlobalSearch() {
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
            if (query.length >= 2) {
                setIsLoading(true);
                const token = getCookie('givar_token') as string;
                if (!token) return;

                try {
                    const data = await ApiService.admin.globalSearch(query, token);
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.length >= 2) {
            setIsOpen(true);
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
                    placeholder="Search ledger, users, forensic IDs..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm focus:shadow-md"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true);
                    }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1 bg-background border border-border/60 px-2 py-0.5 rounded-3xl text-[9px] text-muted-foreground font-bold shadow-sm">
                            <CornerDownLeft className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 
  bg-card border border-border/60 
  rounded-3xl shadow-2xl overflow-hidden 
  max-h-[60vh] flex flex-col 
  animate-in fade-in zoom-in-95 duration-200 
  origin-top min-w-0">
                    {hasResults && (
                        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border/40 bg-muted/40 shrink-0 px-4">
                            {FILTERS.map(f => {
                                const count = results && f.id !== 'all' ? results[f.id as keyof SearchResults]?.length : 0;
                                const isAll = f.id === 'all';

                                if (!isAll && count === 0) return null;

                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => setActiveFilter(f.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-3xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border shrink-0",
                                            activeFilter === f.id
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm"
                                        )}
                                    >
                                        <f.icon className="h-3 w-3" />
                                        {f.label}
                                        {!isAll && (
                                            <span className={cn(
                                                "ml-1 px-1.5 py-0.5 rounded-3xl text-[9px] min-w-[18px] text-center",
                                                activeFilter === f.id ? "bg-white/20 text-white" : "bg-muted text-foreground"
                                            )}>{count}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="overflow-y-auto no-scrollbar flex-1 p-2">
                        {!hasResults && !isLoading ? (
                            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                                <div className="h-12 w-12 bg-muted/50 rounded-3xl flex items-center justify-center mb-3 border border-border/50">
                                    <Search className="h-6 w-6 opacity-20" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No matches found</p>
                                <p className="text-[11px] text-muted-foreground/60 mt-1">Try searching by UUID, Email, or Ref ID</p>
                            </div>
                        ) : displayData ? (
                            <div className="space-y-4 pb-2">
                                {/* USERS */}
                                {displayData.users.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                            <User className="h-3 w-3" /> Identities
                                        </div>
                                        {displayData.users.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleNavigate(`/admin/users/${user.id}`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-3xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                                                    {user.firstName[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground">{user.firstName} {user.lastName}</span>
                                                        <span className={cn(
                                                            "text-[8px] px-1.5 py-0.5 rounded-3xl uppercase font-black tracking-wider",
                                                            user.role === 'ADMIN' ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                                                        )}>{user.role}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                                                </div>
                                                <div className="h-7 w-7 rounded-3xl bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* PROJECTS */}
                                {displayData.projects.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-2">
                                            <Briefcase className="h-3 w-3" /> Projects
                                        </div>
                                        {displayData.projects.map(project => (
                                            <button
                                                key={project.id}
                                                onClick={() => handleNavigate(`/admin/projects/${project.id}/edit`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-bold text-sm text-foreground truncate">{project.title}</span>
                                                        <SmartCurrency amount={project.raisedAmount.toString()} currency={project.currency} visible={true} size="small" className="shrink-0" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold uppercase tracking-tight rounded-3xl">{project.status}</Badge>
                                                        <span className="text-[9px] text-muted-foreground font-mono truncate opacity-60">ID: {project.slug}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* PROPOSALS */}
                                {displayData.proposals.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-2">
                                            <FileText className="h-3 w-3" /> Proposals
                                        </div>
                                        {displayData.proposals.map(prop => (
                                            <button
                                                key={prop.id}
                                                onClick={() => handleNavigate(`/admin/proposals/${prop.id}`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-foreground truncate block">{prop.title}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-purple-500/30 text-purple-600 font-bold uppercase rounded-3xl">{prop.status}</Badge>
                                                        <span className="text-[9px] text-muted-foreground font-medium">{prop.category?.name}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ORGANIZATIONS */}
                                {displayData.organizations.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-2">
                                            <Building2 className="h-3 w-3" /> Organizations
                                        </div>
                                        {displayData.organizations.map(org => (
                                            <button
                                                key={org.id}
                                                onClick={() => handleNavigate(`/admin/organizations/${org.id}`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-3xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-foreground block truncate">{org.legalName}</span>
                                                    <span className="text-[9px] font-mono text-muted-foreground font-medium">{org.registrationNumber || 'No Reg ID'}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] font-bold uppercase rounded-3xl">{org.status}</Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* TRANSACTIONS */}
                                {displayData.transactions.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-2">
                                            <Database className="h-3 w-3" /> Ledger
                                        </div>
                                        {displayData.transactions.map(tx => (
                                            <button
                                                key={tx.id}
                                                onClick={() => handleNavigate(`/admin/ledger?search=${tx.reference}`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className={cn(
                                                    "h-9 w-9 rounded-3xl flex items-center justify-center font-black text-[11px] border shrink-0",
                                                    tx.type === 'CREDIT' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                )}>
                                                    {tx.type === 'CREDIT' ? 'CR' : 'DR'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-mono text-xs font-bold text-foreground truncate">{tx.reference}</span>
                                                        <SmartCurrency amount={tx.amount.toString()} currency={tx.currency} visible={true} size="small" className="shrink-0" />
                                                    </div>
                                                    <p className="text-[9px] text-muted-foreground truncate mt-0.5 font-medium">{tx.description || 'System Transfer'}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* AUDIT LOGS */}
                                {displayData.auditLogs.length > 0 && (
                                    <div className="space-y-1">
                                        <div className="px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 mt-2">
                                            <ShieldAlert className="h-3 w-3" /> Security
                                        </div>
                                        {displayData.auditLogs.map(log => (
                                            <button
                                                key={log.id}
                                                onClick={() => handleNavigate(`/admin/audit?search=${log.id}`)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-3xl hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left group"
                                            >
                                                <div className="h-9 w-9 rounded-3xl bg-zinc-500/10 text-zinc-600 flex items-center justify-center shrink-0">
                                                    <ShieldAlert className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center gap-2">
                                                        <span className="font-bold text-xs text-foreground truncate">{log.action}</span>
                                                        <span className="text-[8px] text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt).split(',')[0]}</span>
                                                    </div>
                                                    <p className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">
                                                        {log.entityType} • {log.ipAddress}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}