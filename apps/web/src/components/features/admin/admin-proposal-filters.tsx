'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export function AdminProposalFilters({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) params.set('search', search); else params.delete('search');
    if (status !== 'all') params.set('status', status); else params.delete('status');
    if (category !== 'all') params.set('category', category); else params.delete('category');

    const timeout = setTimeout(() => router.replace(`?${params.toString()}`), 400);
    return () => clearTimeout(timeout);
  }, [search, status, category, router, searchParams]);

  return (
    <div className="flex flex-col md:flex-row gap-4 p-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search proposals..." 
            className="pl-9 h-11 bg-card border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full md:w-[180px] h-11 bg-card rounded-xl">
            <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="CHANGES_REQUESTED">Needs Edits</SelectItem>
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full md:w-[180px] h-11 bg-card rounded-xl">
            <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}