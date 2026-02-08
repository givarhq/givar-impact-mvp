'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Filter, LayoutGrid } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

export function AdminProposalFilters({ categories }: { categories: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) params.set('search', search); else params.delete('search');
    if (status !== 'all') params.set('status', status); else params.delete('status');
    if (category !== 'all') params.set('category', category); else params.delete('category');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`);
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
    <div className="space-y-8">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 w-full relative min-h-[40px]">
        <div className="flex items-center gap-6 flex-1 min-w-0">

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search proposals..."
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
              <SelectTrigger className="w-[180px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="CHANGES_REQUESTED">Needs Edits</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || status !== 'all' || category !== 'all') && (
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
              placeholder="Search proposals..."
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
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="CHANGES_REQUESTED">Needs Edits</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || status !== 'all' || category !== 'all') && (
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