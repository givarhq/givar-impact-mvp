'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils/cn';

export const OrganizationFilters = memo(function OrganizationFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

    useEffect(() => {
        if (search === (searchParams.get('search') || '') &&
            status === (searchParams.get('status') || 'all') &&
            sortBy === (searchParams.get('sortBy') || 'createdAt')) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (sortBy !== 'createdAt') params.set('sortBy', sortBy); else params.delete('sortBy');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, sortBy, router, searchParams]);

    const clear = () => {
        setSearch('');
        setStatus('all');
        setSortBy('createdAt');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 relative min-h-[40px] w-full overflow-hidden">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground shrink-0">
                        Organizations
                    </h1>

                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search Legal Entities Or Reg Id..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                            <SelectTrigger className="w-[160px] h-9 bg-muted/40 border-border/40 font-bold text-xs rounded-3xl transition-all hover:bg-muted/60">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                    <SelectValue placeholder="Verification" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border-border shadow-xl">
                                <SelectItem value="all" className="text-xs font-bold py-2">All Entities</SelectItem>
                                <SelectItem value="PENDING" className="text-xs font-bold py-2 text-amber-600">Pending Review</SelectItem>
                                <SelectItem value="VERIFIED" className="text-xs font-bold py-2 text-emerald-600">Verified</SelectItem>
                                <SelectItem value="REJECTED" className="text-xs font-bold py-2 text-destructive">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[140px] h-9 bg-muted/40 border-border/40 font-bold text-xs rounded-3xl transition-all hover:bg-muted/60">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border-border shadow-xl">
                                <SelectItem value="createdAt" className="text-xs font-bold py-2">Date Joined</SelectItem>
                                <SelectItem value="legalName" className="text-xs font-bold py-2">Alphabetical</SelectItem>
                            </SelectContent>
                        </Select>

                        {(search || status !== 'all' || sortBy !== 'createdAt') && (
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
                            placeholder="Search Entities..."
                            className="pl-10 h-11 rounded-2xl bg-muted/30 border-border/40 focus:bg-background transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 rounded-2xl bg-muted/30 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="VERIFIED">Verified</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={clear} className="h-10 px-4 rounded-2xl border-border/60 text-xs font-bold shrink-0 transition-all active:scale-95">
                            Reset Filters
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});