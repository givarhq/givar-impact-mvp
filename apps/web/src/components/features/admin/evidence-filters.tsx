'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export const EvidenceFilters = memo(function EvidenceFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'PENDING');
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

    useEffect(() => {
        if (search === (searchParams.get('search') || '') &&
            status === (searchParams.get('status') || 'PENDING')) return;

        const timeout = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', '1');
            if (search) params.set('search', search); else params.delete('search');
            if (status) params.set('status', status); else params.delete('status');
            router.replace(`?${params.toString()}`);
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, status, router, searchParams]);

    const clear = () => {
        setSearch('');
        setStatus('all');
        router.replace('?page=1&status=all');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 relative min-h-[40px] w-full overflow-hidden">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground shrink-0">
                        Evidence
                    </h1>

                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search Cause Or Progress Narrative..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
                        className={cn(
                            "md:hidden h-9 w-9 rounded-3xl transition-all",
                            isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
                        )}
                    >
                        {isMobileSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                    </Button>

                    <div className="hidden md:flex items-center gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[180px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs transition-all hover:bg-muted/60">
                                <div className="flex items-center gap-1.5">
                                    <Filter className="h-3 w-3" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border-border shadow-xl">
                                <SelectItem value="all" className="text-xs font-bold py-2">All Evidence</SelectItem>
                                <SelectItem value="PENDING" className="text-xs font-bold py-2 text-amber-600">Pending Review</SelectItem>
                                <SelectItem value="APPROVED" className="text-xs font-bold py-2 text-emerald-600">Verified Proof</SelectItem>
                                <SelectItem value="REJECTED" className="text-xs font-bold py-2 text-destructive">Declined Proof</SelectItem>
                            </SelectContent>
                        </Select>

                        {(search || status !== 'PENDING') && (
                            <Button variant="ghost" onClick={clear} className="h-9 px-3 rounded-3xl text-muted-foreground text-xs font-bold hover:text-primary transition-colors">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isMobileSearchVisible && (
                <div className="md:hidden space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Evidence..."
                            className="pl-10 h-10 rounded-3xl bg-muted/30 border-border/40 focus:bg-background transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="flex-1 h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Evidence</SelectItem>
                                <SelectItem value="PENDING">Pending Review</SelectItem>
                                <SelectItem value="APPROVED">Verified Proof</SelectItem>
                                <SelectItem value="REJECTED">Declined Proof</SelectItem>
                            </SelectContent>
                        </Select>
                        {(search || status !== 'PENDING') && (
                            <Button variant="outline" onClick={clear} className="h-10 px-4 rounded-3xl border-border/60 text-xs font-bold shrink-0 transition-all active:scale-95">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});