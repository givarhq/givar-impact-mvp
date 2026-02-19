'use client';

import React, { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export const Pagination = memo(function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border/40">
      <div className="text-xs font-medium text-muted-foreground">
        Page <span className="text-foreground font-bold tabular-nums">{currentPage}</span> Of <span className="text-foreground font-bold tabular-nums">{totalPages}</span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="rounded-3xl h-9 px-5 text-xs font-bold border-border/60 bg-transparent hover:bg-muted transition-all active:scale-95"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" /> Previous
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-3xl h-9 px-5 text-xs font-bold border-border/60 bg-transparent hover:bg-muted transition-all active:scale-95"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
});