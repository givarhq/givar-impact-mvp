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
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

  useEffect(() => {
    if (search === (searchParams.get('search') || '') &&
      activeCategory === (searchParams.get('category') || 'all') &&
      activeSubcategory === (searchParams.get('subcategory') || 'all') &&
      sort === (searchParams.get('sort') || 'newest')) return;

    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set('search', search); else params.delete('search');
    if (activeCategory !== 'all') params.set('category', activeCategory); else params.delete('category');
    if (activeSubcategory !== 'all') params.set('subcategory', activeSubcategory); else params.delete('subcategory');
    if (sort !== 'newest') params.set('sort', sort); else params.delete('sort');

    params.delete('page');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [search, activeCategory, activeSubcategory, sort, router, searchParams]);

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setActiveSubcategory('all');
    setSort('newest');
  };

  // Find the selected category object to render its subcategories
  const selectedCategoryObj = categories.find(c => c.slug === activeCategory);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const SortDropdown = (
    <Select value={sort} onValueChange={setSort}>
      <SelectTrigger className="w-[140px] md:w-[160px] h-11 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs tracking-wider transition-all hover:bg-muted/60">
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
  );

  return (
    <div className="space-y-4 md:space-y-6 w-full min-w-0">
      {hideSearch ? (
        /* Public Mode: CategoryBrowser occupies the top row on desktop alongside Sort */
        <div className="space-y-3 w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full min-w-0">
            <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
              Explore Causes
            </h1>

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

            <div className="flex items-center gap-2 shrink-0 justify-end">
              {SortDropdown}
            </div>
          </div>
        </div>
      ) : (
        /* Auth Mode: Standard Search + Sort top row, CategoryBrowser below */
        <div className="flex items-center justify-between gap-4 relative min-h-[44px] w-full min-w-0">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
              Explore Causes
            </h1>

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

            <div className="hidden md:block">
              {SortDropdown}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Expanded Filters Area */}
      <AnimatePresence>
        {isMobileSearchVisible && !hideSearch && (
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
              {SortDropdown}
              {(search || activeCategory !== 'all' || activeSubcategory !== 'all' || sort !== 'newest') && (
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

      {/* Category Navigation for Authenticated View or Mobile Public View */}
      {!hideSearch ? (
        <div className="pt-2 w-full min-w-0 overflow-hidden space-y-3">
          <CategoryBrowser
            categories={categories}
            selected={activeCategory}
            onSelect={(slug) => {
              setActiveCategory(slug);
              setActiveSubcategory('all');
            }}
          />
        </div>
      ) : (
        <div className="md:hidden pt-2 w-full min-w-0 overflow-hidden">
          <CategoryBrowser
            categories={categories}
            selected={activeCategory}
            onSelect={(slug) => {
              setActiveCategory(slug);
              setActiveSubcategory('all');
            }}
          />
        </div>
      )}

      {/* Subcategory Pill Row (Direct Conditional Render eliminates phantom padding) */}
      <AnimatePresence>
        {activeCategory !== 'all' && availableSubcategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="flex gap-2 overflow-x-auto no-scrollbar py-1 w-full min-w-0"
          >
            <button
              onClick={() => setActiveSubcategory('all')}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0",
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
                  "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shrink-0",
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
  );
});