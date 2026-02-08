'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Search, X, Filter } from 'lucide-react';
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

export function HistoryClient({ initialData }: HistoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  const [sort, setSort] = useState({
    column: (searchParams.get('sortBy') || 'createdAt') as "status" | "createdAt" | "amount" | "description",
    order: (searchParams.get('sortOrder') || 'desc') as "asc" | "desc",
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
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
    setFilters({ search: '', type: 'all', status: 'all' });
    setSort({ column: 'createdAt', order: 'desc' });
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
    });

    params.set('sortBy', sort.column);
    params.set('sortOrder', sort.order);

    const handler = setTimeout(() => {
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [filters, sort, pathname, router, searchParams]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.delete('page');
      params.delete('limit');

      const response = await ApiService.wallet.exportCsv(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `givar-history-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-8">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4 w-full relative min-h-[40px]">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <h1 className="md:hidden text-xl font-semibold tracking-tight text-foreground whitespace-nowrap">
            History
          </h1>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by description or reference..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
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
            <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
              <SelectTrigger className="w-[130px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="w-[130px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-10 px-4 rounded-xl border-dashed border-border text-xs font-semibold gap-2 bg-transparent"
            >
              {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Export
            </Button>

            {hasActiveFilters && (
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
              placeholder="Search history..."
              className="pl-11 h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
                <SelectItem value="DEBIT">Debit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={isExporting} className="h-12 rounded-2xl border-dashed border-border font-bold text-xs gap-2 flex-1">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              CSV
            </Button>
            <Button variant="ghost" onClick={clearFilters} className="h-12 rounded-2xl font-bold text-xs flex-1">
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <HistoryTable
          transactions={initialData.data}
          sortBy={sort.column}
          sortOrder={sort.order}
          onSort={handleSort}
        />

        <Pagination
          currentPage={initialData.meta.page}
          totalPages={initialData.meta.lastPage}
        />
      </div>
    </div>
  );
}