'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Clock, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';

export function EvidenceFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'PENDING');

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
        <div className="flex flex-col md:flex-row gap-4 p-1">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by project title or narrative..."
                    className="pl-9 h-11 bg-card border-border rounded-xl shadow-sm focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-[220px] h-11 bg-card border-border text-foreground rounded-xl shadow-sm">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Filter Status" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                    <SelectItem value="all">
                        <div className="flex items-center gap-2 font-medium"><LayoutGrid className="h-3.5 w-3.5" /> All Statuses</div>
                    </SelectItem>
                    <SelectItem value="PENDING">
                        <div className="flex items-center gap-2 font-medium"><Clock className="h-3.5 w-3.5 text-amber-500" /> Pending Audit</div>
                    </SelectItem>
                    <SelectItem value="APPROVED">
                        <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Approved</div>
                    </SelectItem>
                    <SelectItem value="REJECTED">
                        <div className="flex items-center gap-2 font-medium"><XCircle className="h-3.5 w-3.5 text-destructive" /> Rejected</div>
                    </SelectItem>
                </SelectContent>
            </Select>
            {(search || status !== 'PENDING') && (
                <Button variant="ghost" onClick={clear} className="h-11 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    <X className="h-4 w-4 mr-2" /> Reset
                </Button>
            )}
        </div>
    );
}