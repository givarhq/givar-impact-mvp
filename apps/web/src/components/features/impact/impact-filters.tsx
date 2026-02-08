'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CategoryBrowser } from '../dashboard/category-browser';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';

interface ImpactFiltersProps {
  categories: any[];
  totalCount: number;
}

export function ImpactFilters({ categories, totalCount }: ImpactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set('search', search); else params.delete('search');
    if (activeCategory !== 'all') params.set('category', activeCategory); else params.delete('category');
    if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');

    params.delete('page');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.push(`?${params.toString()}`);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, activeCategory, sort, router, searchParams]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setSort('newest');
  };

  return (
    <div className="space-y-8">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 relative min-h-[40px]">
        <div className="flex items-center gap-6 flex-1">
          <h1 className="md:hidden text-xl font-semibold tracking-tight text-foreground whitespace-nowrap">
            Explore Causes
          </h1>

          {/* Desktop Search: Beside H1, no background */}
          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search causes..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Action Group: Mobile Search Toggle + Desktop Sort */}
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

          {/* Sort Dropdown - Desktop Only in this row */}
          <div className="hidden md:block">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-muted/50 border-none font-semibold text-xs tracking-widest">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3 w-3" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-border/50">
                <SelectItem value="newest" className="text-xs font-semibold">Newest</SelectItem>
                <SelectItem value="most_funded" className="text-xs font-semibold">Most Funded</SelectItem>
                <SelectItem value="ending_soon" className="text-xs font-semibold">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Expanded Mobile Search Area */}
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
          <div className="flex gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="flex-1 h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3 w-3" />
                  <SelectValue placeholder="Sort" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl border-border/50">
                <SelectItem value="newest" className="text-xs font-semibold">Newest</SelectItem>
                <SelectItem value="most_funded" className="text-xs font-semibold">Most Funded</SelectItem>
                <SelectItem value="ending_soon" className="text-xs font-semibold">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
            {(search || activeCategory !== 'all' || sort !== 'newest') && (
              <Button variant="outline" onClick={clearFilters} className="h-12 rounded-2xl border-dashed border-border text-xs font-semibold">
                Reset
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="pt-2">
        <CategoryBrowser
          categories={categories}
          selected={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>
    </div>
  );
}