'use client';

import React, { useState, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft } from 'lucide-react';

export const PublicGlobalSearch = memo(function PublicGlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length > 0) {
            router.push(`/explore?search=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-lg hidden md:block z-50 min-w-0">
            <div className="relative group min-w-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-4 w-4" />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search causes, locations, or keywords..."
                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm focus:shadow-md"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
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
            </div>
        </form>
    );
});