'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
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
        Page <span className="text-foreground font-bold">{currentPage}</span> of <span className="text-foreground font-bold">{totalPages}</span>
      </div>

      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="rounded-3xl h-8 px-4 text-xs font-bold border-border/60 bg-transparent hover:bg-muted"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-3xl h-8 px-4 text-xs font-bold border-border/60 bg-transparent hover:bg-muted"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}