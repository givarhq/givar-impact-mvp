'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Search, X } from 'lucide-react';
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

  // 1. Initialize Sort State from URL
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

  // 2. Handle Sort Click
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

    // Sync Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
    });

    // 3. Sync Sort to URL
    params.set('sortBy', sort.column);
    params.set('sortOrder', sort.order);
    
    const handler = setTimeout(() => {
        router.replace(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(handler);
  }, [filters, sort, pathname, router]);

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
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'givar-transactions.csv';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      link.setAttribute('download', fileName);

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
    <div className="space-y-6">
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

            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export CSV
            </Button>
        </div>
      </div>

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
  );
}