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
  hideSearch?: boolean;
}

export const ImpactFilters = memo(function ImpactFilters({ categories, totalCount, hideSearch = false }: ImpactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [activeSubcategory, setActiveSubcategory] = useState(searchParams.get('subcategory') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'ACTIVE');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

  useEffect(() => {
    if (search === (searchParams.get('search') || '') &&
      activeCategory === (searchParams.get('category') || 'all') &&
      activeSubcategory === (searchParams.get('subcategory') || 'all') &&
      sort === (searchParams.get('sort') || 'newest') &&
      activeStatus === (searchParams.get('status') || 'ACTIVE')) return;

    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set('search', search); else params.delete('search');
    if (activeCategory !== 'all') params.set('category', activeCategory); else params.delete('category');
    if (activeSubcategory !== 'all') params.set('subcategory', activeSubcategory); else params.delete('subcategory');
    if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');
    if (activeStatus !== 'ACTIVE') params.set('status', activeStatus); else params.delete('status');

    params.delete('page');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, activeCategory, activeSubcategory, sort, activeStatus, router, searchParams]);

  const handleStatusChange = (status: 'ACTIVE' | 'COMPLETED') => {
    setActiveStatus(status);
  };

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setActiveSubcategory('all');
    setSort('newest');
    setActiveStatus('ACTIVE');
  };

  const selectedCategoryObj = categories.find(c => c.slug === activeCategory);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const SortDropdown = (
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger className="w-[140px] md:w-[150px] h-9 rounded-full bg-card border-border/60 font-bold text-xs tracking-wider transition-all hover:bg-muted/60">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="h-3 w-3 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Sort" className="truncate" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-3xl shadow-xl border-border/40">
        <SelectItem value="newest" className="text-xs font-bold rounded-2xl py-2">Newest arrival</SelectItem>
        <SelectItem value="most_funded" className="text-xs font-bold rounded-2xl py-2">Highest funded</SelectItem>
        <SelectItem value="ending_soon" className="text-xs font-bold rounded-2xl py-2">Closing soon</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-3 w-full min-w-0">
      {/* Row 1: Heading & Search Input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Explore Causes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Discover and support verified causes creating real change.
          </p>
        </div>

        {!hideSearch && (
          <div className="hidden md:flex items-center w-full max-w-xs group border-b border-border/40 focus-within:border-primary/40 transition-all min-w-0">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
            <Input
              placeholder="Search causes by title or location..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-xs h-9 w-full placeholder:text-muted-foreground/50 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Mobile Search Toggle */}
        <div className="md:hidden flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
            )}
          >
            {isMobileSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Row 2: Active Causes | Completed Causes Tabs */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={() => handleStatusChange('ACTIVE')}
          className={cn(
            "rounded-full px-5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm",
            activeStatus === 'ACTIVE'
              ? "bg-primary text-white border border-primary shadow-primary/20"
              : "bg-card text-foreground border border-border/60 hover:bg-muted/50"
          )}
        >
          Active Causes
        </button>

        <button
          onClick={() => handleStatusChange('COMPLETED')}
          className={cn(
            "rounded-full px-5 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm",
            activeStatus === 'COMPLETED'
              ? "bg-primary text-white border border-primary shadow-primary/20"
              : "bg-card text-foreground border border-border/60 hover:bg-muted/50"
          )}
        >
          Completed Causes
        </button>
      </div>

      {/* Row 3: Category Pills & Sort Dropdown */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex-1 min-w-0 overflow-hidden">
          <CategoryBrowser
            categories={categories}
            selected={activeCategory}
            onSelect={(slug) => {
              setActiveCategory(slug);
              setActiveSubcategory('all');
            }}
          />
        </div>

        <div className="hidden md:block shrink-0">
          {SortDropdown}
        </div>
      </div>

      {/* Mobile Expanded Search */}
      <AnimatePresence>
        {isMobileSearchVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden space-y-3 overflow-hidden w-full min-w-0 pt-2"
          >
            <div className="relative group min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search causes..."
                className="pl-11 h-10 rounded-full bg-muted/30 border-border/40 focus:bg-background text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">{SortDropdown}</div>
              {(search || activeCategory !== 'all' || sort !== 'newest') && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="h-9 px-4 rounded-full text-xs font-bold text-muted-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subcategory Pills */}
      <div className="w-full min-w-0 overflow-hidden">
        <AnimatePresence>
          {activeCategory !== 'all' && availableSubcategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto no-scrollbar py-1"
            >
              <button
                onClick={() => setActiveSubcategory('all')}
                className={cn(
                  "px-3.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0",
                  activeSubcategory === 'all'
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-transparent text-muted-foreground border-border/60 hover:border-foreground hover:text-foreground"
                )}
              >
                All {selectedCategoryObj?.name}
              </button>
              {availableSubcategories.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcategory(sub.slug)}
                  className={cn(
                    "px-3.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0",
                    activeSubcategory === sub.slug
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-transparent text-muted-foreground border-border/60 hover:border-foreground hover:text-foreground"
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});