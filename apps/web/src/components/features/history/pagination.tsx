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
    <div className="flex items-center justify-between pt-4 border-t border-border/50">
      <div className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex gap-2">
        <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
        >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
        >
            Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}