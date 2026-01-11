'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Search, X } from 'lucide-react';
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

  // State is initialized from the URL search params, making links shareable
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    type: searchParams.get('type') || 'all',
    status: searchParams.get('status') || 'all',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: 'all', status: 'all' });
  };
  
  // This effect syncs the URL with the filter state
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page to 1 whenever filters change
    params.set('page', '1'); 

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    const handler = setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [filters, pathname, router]);


  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('limit');
    
    // Construct the full URL for the export endpoint
    const exportUrl = `/api/wallet/transactions/export?${params.toString()}`;
    
    // Trigger download
    window.open(exportUrl, '_blank');
  };

  const hasActiveFilters = filters.search || filters.type !== 'all' || filters.status !== 'all';

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by description, project..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CREDIT">Credit</SelectItem>
              <SelectItem value="DEBIT">Debit</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
            {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
            ) : <div />}

            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
        </div>
      </div>

      <HistoryTable transactions={initialData.data} />

      <Pagination
        currentPage={initialData.meta.page}
        totalPages={initialData.meta.lastPage}
      />
    </div>
  );
}