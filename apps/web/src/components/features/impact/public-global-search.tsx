'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft, Loader2, Compass, ArrowRight, Briefcase } from 'lucide-react';
import { ApiService } from '../../../services/api';
import { SmartCurrency } from '../../ui/smart-currency';
import { motion, AnimatePresence } from 'framer-motion';

export const PublicGlobalSearch = memo(function PublicGlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 2) {
                setIsLoading(true);
                try {
                    const params = new URLSearchParams({ search: query.trim(), limit: '5' });
                    // Utilize the public list endpoint to bypass authentication guards
                    const res = await ApiService.projects.list('', params);
                    setResults(res?.data || []);
                    setIsOpen(true);
                } catch (error) {
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length > 0) {
            router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    const handleNavigate = (slug: string) => {
        router.push(`/explore/${slug}`);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-lg hidden md:block z-50 min-w-0">
            <form onSubmit={handleSearch} className="relative group min-w-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search causes, locations, or keywords..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm focus:shadow-md"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
                            className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors outline-none active:scale-90"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <div className="bg-background border border-border/60 px-2 py-0.5 rounded-3xl text-[11px] text-muted-foreground font-semibold flex items-center gap-1 shadow-sm tracking-tighter">
                            <CornerDownLeft className="h-3 w-3" />
                        </div>
                    )}
                </div>
            </form>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full mt-2 left-0 right-0 bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col origin-top min-w-0"
                    >
                        <div className="overflow-y-auto no-scrollbar flex-1 p-2 min-w-0">
                            {results.length === 0 && !isLoading ? (
                                <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                                    <div className="h-14 w-14 bg-muted/50 rounded-2xl flex items-center justify-center border border-border/40 shadow-inner">
                                        <Compass className="h-7 w-7 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-foreground">No Causes Found</p>
                                        <p className="text-xs font-medium opacity-60 max-w-[240px] mx-auto">Try searching for a different location or keyword.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1 min-w-0">
                                    <div className="px-4 py-2 text-[10px] font-black tracking-widest text-primary flex items-center gap-2">
                                        <Briefcase className="h-3 w-3" /> Matching Causes
                                    </div>
                                    {results.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleNavigate(p.slug)}
                                            className="w-full flex items-center gap-4 p-3 rounded-[22px] hover:bg-primary/5 hover:border-primary/10 border border-transparent transition-all text-left min-w-0 active:scale-[0.99] group"
                                        >
                                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-inner">
                                                <Compass className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-sm text-foreground truncate block group-hover:text-primary">{p.title}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] text-muted-foreground font-semibold tracking-tighter">Goal:</span>
                                                    <SmartCurrency amount={p.targetAmount.toString()} currency={p.currency} visible={true} size="small" />
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all shrink-0 mr-2" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {results.length > 0 && (
                            <div className="p-3 bg-muted/20 border-t border-border/40 text-center">
                                <button
                                    onClick={(e) => handleSearch(e as any)}
                                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    View all results
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});