'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { Search, X, Filter, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export const AdminProposalFilters = memo(function AdminProposalFilters({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

  useEffect(() => {
    if (search === (searchParams.get('search') || '') &&
      status === (searchParams.get('status') || 'all') &&
      category === (searchParams.get('category') || 'all')) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) params.set('search', search); else params.delete('search');
    if (status !== 'all') params.set('status', status); else params.delete('status');
    if (category !== 'all') params.set('category', category); else params.delete('category');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, status, category, router, searchParams]);

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 relative min-h-[40px] w-full overflow-hidden">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground shrink-0">
            Proposals
          </h1>

          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search proposer or title..."
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
              <SelectTrigger className="w-[140px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem value="all" className="text-xs">All statuses</SelectItem>
                <SelectItem value="SUBMITTED" className="text-xs">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW" className="text-xs">Review</SelectItem>
                <SelectItem value="CHANGES_REQUESTED" className="text-xs">Edits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3 w-3" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem value="all" className="text-xs">All categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug} className="text-xs">{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || status !== 'all' || category !== 'all') && (
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
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Review</SelectItem>
                <SelectItem value="CHANGES_REQUESTED">Edits</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(search || status !== 'all' || category !== 'all') && (
            <Button variant="outline" onClick={clearFilters} className="w-full h-9 rounded-3xl border-border/60 text-xs font-bold">
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
});