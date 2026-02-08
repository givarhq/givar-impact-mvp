'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Clock, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export function EvidenceFilters() {
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
        <div className="space-y-8">
            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-4 w-full relative min-h-[40px]">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <h1 className="md:hidden text-xl font-semibold tracking-tight text-foreground whitespace-nowrap">
                        Trust & Safety
                    </h1>

                    {/* Desktop Search */}
                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by title or narrative..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mobile Search Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
                        className={cn(
                            "md:hidden h-10 w-10 rounded-xl transition-all",
                            isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
                        )}
                    >
                        {isMobileSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                    </Button>

                    {/* Desktop Filters */}
                    <div className="hidden md:flex items-center gap-3">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[200px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                    <SelectValue placeholder="Filter Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-xl">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending Audit</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        {(search || status !== 'PENDING') && (
                            <Button variant="ghost" onClick={clear} className="h-10 px-4 rounded-xl text-muted-foreground text-xs font-semibold">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Expanded Search Area */}
            {isMobileSearchVisible && (
                <div className="md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search evidence..."
                            className="pl-11 h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending Audit</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        {(search || status !== 'PENDING') && (
                            <Button variant="outline" onClick={clear} className="h-12 rounded-2xl border-dashed border-border text-xs font-semibold">
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}