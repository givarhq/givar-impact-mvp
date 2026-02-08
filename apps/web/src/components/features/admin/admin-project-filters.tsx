'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export function AdminProjectFilters({ categories, activeTab }: { categories: any[], activeTab: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all');
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        if (activeTab) params.set('tab', activeTab);

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (categoryId !== 'all') params.set('categoryId', categoryId); else params.delete('categoryId');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, categoryId, activeTab, router, searchParams]);

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setCategoryId('all');
    };

    const showStatusFilter = activeTab !== 'drafts';

    return (
        <div className="space-y-8">
            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-4 relative min-h-[40px]">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <h1 className="md:hidden text-xl font-semibold tracking-tight text-foreground whitespace-nowrap">
                        Cause Management
                    </h1>

                    {/* Desktop Search: Beside Title */}
                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by title or location..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Group: Mobile Toggle + Desktop Selects */}
                <div className="flex items-center gap-2">
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

                    {/* Desktop Selects */}
                    <div className="hidden md:flex items-center gap-3">
                        {showStatusFilter && (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-muted/50 border-none font-semibold text-xs tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl border-border/50">
                                    <SelectItem value="all">All Phases</SelectItem>
                                    {activeTab === 'live' ? (
                                        <>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="FUNDED">Funded</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                            <SelectItem value="CHANGES_REQUESTED">Needs Edits</SelectItem>
                                            <SelectItem value="REJECTED">Rejected</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="w-[160px] h-10 rounded-xl bg-muted/50 border-none font-semibold text-xs tracking-widest">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-3 w-3" />
                                    <SelectValue placeholder="Category" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-border/50">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(search || (showStatusFilter && status !== 'all') || categoryId !== 'all') && (
                            <Button variant="ghost" onClick={clearFilters} className="h-10 px-4 rounded-xl text-muted-foreground text-xs font-semibold">
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
                            placeholder="Search causes..."
                            className="pl-11 h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        {showStatusFilter && (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Phases</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="FUNDED">Funded</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="h-3 w-3" />
                                    <SelectValue placeholder="Category" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {(search || (showStatusFilter && status !== 'all') || categoryId !== 'all') && (
                            <Button variant="outline" onClick={clearFilters} className="h-12 rounded-2xl border-dashed border-border text-xs font-semibold">
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}