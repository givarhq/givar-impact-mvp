'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { Search, Filter, X, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export const AdminProjectFilters = memo(function AdminProjectFilters({ categories, activeTab }: { categories: any[], activeTab: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all');
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

    useEffect(() => {
        if (search === (searchParams.get('search') || '') &&
            status === (searchParams.get('status') || 'all') &&
            categoryId === (searchParams.get('categoryId') || 'all')) return;

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
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 relative min-h-[40px] w-full overflow-hidden">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground shrink-0">
                        Causes
                    </h1>

                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search Title Or Location..."
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
                        {showStatusFilter && (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[120px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Filter className="h-3 w-3" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl">
                                    <SelectItem value="all" className="text-xs">All Status</SelectItem>
                                    {activeTab === 'live' ? (
                                        <>
                                            <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                                            <SelectItem value="FUNDED" className="text-xs">Funded</SelectItem>
                                            <SelectItem value="COMPLETED" className="text-xs">Completed</SelectItem>
                                            <SelectItem value="SUSPENDED" className="text-xs">Suspended</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="SUBMITTED" className="text-xs">Submitted</SelectItem>
                                            <SelectItem value="UNDER_REVIEW" className="text-xs">Review</SelectItem>
                                            <SelectItem value="CHANGES_REQUESTED" className="text-xs">Edits</SelectItem>
                                            <SelectItem value="REJECTED" className="text-xs">Rejected</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="w-[140px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                                <div className="flex items-center gap-1.5">
                                    <LayoutGrid className="h-3 w-3" />
                                    <SelectValue placeholder="Category" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(search || (showStatusFilter && status !== 'all') || categoryId !== 'all') && (
                            <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 rounded-3xl text-muted-foreground text-xs font-bold">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isMobileSearchVisible && (
                <div className="md:hidden space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-10 h-10 rounded-3xl bg-muted/30 border-border/40 focus:bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {showStatusFilter && (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="FUNDED">Funded</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {(search || (showStatusFilter && status !== 'all') || categoryId !== 'all') && (
                        <Button variant="outline" onClick={clearFilters} className="w-full h-9 rounded-3xl border-border/60 text-xs font-bold">
                            Reset Filters
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
});