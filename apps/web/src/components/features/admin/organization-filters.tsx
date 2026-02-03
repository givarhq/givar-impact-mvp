'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X, Building2, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export function OrganizationFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (sortBy !== 'createdAt') params.set('sortBy', sortBy); else params.delete('sortBy');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, sortBy, router, searchParams]);

    const clear = () => {
        setSearch('');
        setStatus('all');
        setSortBy('createdAt');
        router.replace('?page=1');
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 p-1">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by legal name, RC number, or email..."
                    className="pl-9 h-11 bg-card border-border rounded-xl shadow-sm focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-[200px] h-11 bg-card border-border rounded-xl">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Verification Status" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="NOT_SUBMITTED">Incomplete</SelectItem>
                </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px] h-11 bg-card border-border rounded-xl">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                    <SelectItem value="createdAt">Date Joined</SelectItem>
                    <SelectItem value="legalName">Alphabetical</SelectItem>
                </SelectContent>
            </Select>

            {(search || status !== 'all' || sortBy !== 'createdAt') && (
                <Button variant="ghost" onClick={clear} className="h-11 px-4 rounded-xl text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4 mr-2" /> Reset
                </Button>
            )}
        </div>
    );
}