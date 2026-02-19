'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CategoryBrowser } from '../dashboard/category-browser';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ImpactFiltersProps {
  categories: any[];
  totalCount: number;
}

export const ImpactFilters = memo(function ImpactFilters({ categories, totalCount }: ImpactFiltersProps) {
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
    <div className="space-y-6 md:space-y-8 w-full min-w-0">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 relative min-h-[44px] w-full min-w-0">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <h1 className="md:hidden text-xl font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
            Explore Causes
          </h1>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all min-w-0">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
            <Input
              placeholder="Search causes by title or location..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-11 w-full placeholder:text-muted-foreground/50 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Global Action Group */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className={cn(
              "md:hidden h-11 w-11 rounded-3xl transition-all",
              isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
            )}
          >
            {isMobileSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Desktop Sort */}
          <div className="hidden md:block">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] h-11 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs tracking-wider transition-all hover:bg-muted/60">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Sort" className="truncate" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-3xl shadow-xl border-border/40">
                <SelectItem value="newest" className="text-xs font-bold rounded-2xl py-2">Newest arrival</SelectItem>
                <SelectItem value="most_funded" className="text-xs font-bold rounded-2xl py-2">Highest funded</SelectItem>
                <SelectItem value="ending_soon" className="text-xs font-bold rounded-2xl py-2">Closing soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Expanded Filters Area */}
      <AnimatePresence>
        {isMobileSearchVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden space-y-4 overflow-hidden w-full min-w-0"
          >
            <div className="relative group min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search causes..."
                className="pl-11 h-12 rounded-3xl bg-muted/30 border-border/40 focus:bg-background focus:border-primary/20 text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 min-w-0">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full h-12 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs tracking-wider">
                  <div className="flex items-center gap-2 min-w-0">
                    <SlidersHorizontal className="h-4 w-4 shrink-0" />
                    <SelectValue placeholder="Sort by" className="truncate" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-xl border-border/40">
                  <SelectItem value="newest" className="text-xs font-bold">Newest arrival</SelectItem>
                  <SelectItem value="most_funded" className="text-xs font-bold">Highest funded</SelectItem>
                  <SelectItem value="ending_soon" className="text-xs font-bold">Closing soon</SelectItem>
                </SelectContent>
              </Select>
              {(search || activeCategory !== 'all' || sort !== 'newest') && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full h-12 rounded-3xl border-dashed border-border/60 text-xs font-bold tracking-widest text-muted-foreground hover:text-primary transition-all"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Navigation */}
      <div className="pt-2 w-full min-w-0 overflow-hidden">
        <CategoryBrowser
          categories={categories}
          selected={activeCategory}
          onSelect={setActiveCategory}
        />
      </div>
    </div>
  );
});