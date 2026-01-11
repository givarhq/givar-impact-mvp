'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils/cn';

// Categories (Ideally fetched from API, hardcoded for MVP speed based on seed)
const categories = [
  { name: 'All Causes', slug: 'all' },
  { name: 'Education', slug: 'education' },
  { name: 'Health', slug: 'health' },
  { name: 'Environment', slug: 'environment' },
  { name: 'Emergency', slug: 'emergency' },
  { name: 'Community', slug: 'community' },
];

export function ImpactFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  // Debounced Search & Filter Logic
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Search
    if (search) params.set('search', search);
    else params.delete('search');

    // Category
    if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
    else params.delete('category');

    // Sort
    if (sort && sort !== 'newest') params.set('sort', sort);
    else params.delete('sort');

    // Reset page on filter change
    params.delete('page');

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [search, activeCategory, sort, router, searchParams]);

  return (
    <div className="space-y-6">
      
      {/* Top Bar: Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search causes..." 
            className="pl-10 h-12 rounded-xl bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <Select value={sort} onValueChange={setSort}>
             <SelectTrigger className="w-[180px] h-12 rounded-xl bg-card border-border/50">
               <SelectValue placeholder="Sort by" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="newest">Newest First</SelectItem>
               <SelectItem value="most_funded">Most Funded</SelectItem>
               <SelectItem value="ending_soon">Ending Soon</SelectItem>
               <SelectItem value="oldest">Oldest</SelectItem>
             </SelectContent>
           </Select>
        </div>
      </div>

      {/* Categories: Horizontal Scrollable Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient-r">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
              activeCategory === cat.slug
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      {isPending && (
          <div className="h-1 w-full overflow-hidden bg-secondary rounded-full">
              <div className="h-full bg-primary w-1/3 animate-progress origin-left"></div>
          </div>
      )}
    </div>
  );
}