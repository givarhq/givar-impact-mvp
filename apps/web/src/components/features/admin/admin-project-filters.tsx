'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';

export function AdminProjectFilters({ categories, activeTab }: { categories: any[], activeTab: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all');

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        // Preserve tab if it exists
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
        router.replace(`?tab=${activeTab}&page=1`);
    };

    // If in Drafts tab, Status filter is redundant (they are all DRAFT).
    const showStatusFilter = activeTab !== 'drafts';

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-1">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder={
                        activeTab === 'proposals' ? "Search proposals..." :
                            activeTab === 'drafts' ? "Search drafts..." :
                                "Search live projects..."
                    }
                    className="pl-11 h-12 bg-card border-border rounded-2xl shadow-sm focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                {showStatusFilter && (
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full lg:w-[200px] h-12 bg-card border-border rounded-2xl shadow-sm">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-xl">
                            <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">All Phases</SelectItem>
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
                    <SelectTrigger className="w-full lg:w-[200px] h-12 bg-card border-border rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Category" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(search || (showStatusFilter && status !== 'all') || categoryId !== 'all') && (
                    <Button variant="ghost" onClick={clearFilters} className="h-12 px-4 rounded-xl text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4 mr-2" /> Reset
                    </Button>
                )}
            </div>
        </div>
    );
}