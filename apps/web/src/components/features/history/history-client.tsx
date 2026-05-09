'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { HistoryTable } from './history-table';
import { Pagination } from './pagination';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryClientProps {
  initialData: {
    data: any[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
    };
  };
}

export const HistoryClient = memo(function HistoryClient({ initialData }: HistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

  const prevFiltersRef = useRef<string>('');

  const [sort, setSort] = useState({
    column: (searchParams.get('sortBy') || 'createdAt') as "status" | "createdAt" | "amount" | "description",
    order: (searchParams.get('sortOrder') || 'desc') as "asc" | "desc",
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (column: "status" | "createdAt" | "amount" | "description") => {
    setSort(prev => ({
      column,
      order: prev.column === column && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearFilters = () => {
    setFilters({ search: '', status: 'all' });
    setSort({ column: 'createdAt', order: 'desc' });
  };

  useEffect(() => {
    const params = new URLSearchParams();

    const currentFiltersStr = JSON.stringify({ ...filters, ...sort });
    const filtersChanged = prevFiltersRef.current !== '' && prevFiltersRef.current !== currentFiltersStr;

    if (filtersChanged) {
      params.set('page', '1');
    } else {
      params.set('page', searchParams.get('page') || '1');
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
    });

    params.set('sortBy', sort.column);
    params.set('sortOrder', sort.order);

    const newQueryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (newQueryString !== currentQueryString) {
      const handler = setTimeout(() => {
        router.replace(`${pathname}?${newQueryString}`, { scroll: false });
        prevFiltersRef.current = currentFiltersStr;
      }, 300);
      return () => clearTimeout(handler);
    }

    if (prevFiltersRef.current === '') {
      prevFiltersRef.current = currentFiltersStr;
    }
  }, [filters, sort, pathname, router, searchParams]);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Preparing Your Impact Record Export...');
    try {
      const params = new URLSearchParams(searchParams);
      params.delete('page');
      params.delete('limit');

      const response = await ApiService.wallet.exportCsv(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Givar-Impact-History-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Your History Record Is Ready', { id: toastId });
    } catch (error) {
      toast.error('We Couldn\'t Export Your Records At This Time', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <div className="space-y-4 md:space-y-6 w-full min-w-0 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 relative min-h-[44px] w-full min-w-0">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground whitespace-nowrap shrink-0">
            Transaction History
          </h1>

          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all min-w-0">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors shrink-0" />
            <Input
              placeholder="Search Reference Or Cause..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-11 w-full placeholder:text-muted-foreground/50 font-medium"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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

          <div className="hidden md:flex items-center gap-2">
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="w-[140px] h-11 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs tracking-wider transition-all hover:bg-muted/60">
                <div className="flex items-center gap-2 truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Record Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-3xl shadow-xl border-border/40">
                <SelectItem value="all" className="text-xs font-bold rounded-2xl py-2">All statuses</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs font-bold rounded-2xl py-2 text-emerald-600">Completed</SelectItem>
                <SelectItem value="PENDING" className="text-xs font-bold rounded-2xl py-2 text-amber-600">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-11 px-6 rounded-3xl border-border/60 font-bold text-xs tracking-widest gap-2 bg-transparent hover:bg-muted transition-all"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export CSV
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-11 px-4 rounded-3xl text-muted-foreground text-xs font-bold hover:text-primary transition-colors">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

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
                placeholder="Search Your History..."
                className="pl-11 h-12 rounded-3xl bg-muted/30 border-border/40 focus:bg-background focus:border-primary/20 text-sm font-medium"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 min-w-0">
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="h-12 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs tracking-wider">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport} disabled={isExporting} className="h-12 rounded-3xl border-border/60 font-bold text-xs tracking-widest gap-2 flex-1 bg-background active:scale-95 transition-all">
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export CSV
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="h-12 rounded-3xl font-bold text-xs tracking-widest flex-1 border border-transparent active:scale-95 transition-all">
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 w-full min-w-0 overflow-hidden">
        <HistoryTable
          transactions={initialData.data}
          sortBy={sort.column}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <div className="pt-4 border-t border-border/40">
          <Pagination
            currentPage={initialData.meta.page}
            totalPages={initialData.meta.lastPage}
          />
        </div>
      </div>
    </div>
  );
});