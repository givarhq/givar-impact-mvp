'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export function AdminProjectFilters({ categories }: { categories: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all');

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        // Always reset to page 1 on filter change
        params.set('page', '1');

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (categoryId !== 'all') params.set('categoryId', categoryId); else params.delete('categoryId');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.push(`?${params.toString()}`);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, categoryId, router, searchParams]);

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search causes..."
                    className="pl-9 h-11 bg-card border-border rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-[160px] h-11 bg-card rounded-xl">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="FUNDED">Funded</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
            </Select>
            <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full md:w-[160px] h-11 bg-card rounded-xl">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}