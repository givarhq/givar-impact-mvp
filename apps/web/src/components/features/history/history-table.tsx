'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Clock, CheckCircle2, XCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Search } from 'lucide-react';
import { Transaction, TxStatus, TxType } from '../../../types';

const typeStyles: Record<TxType, { icon: React.ElementType, bg: string, text: string, sign: string }> = {
  DEBIT: {
    icon: ArrowUpRight,
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    sign: '-',
  },
  CREDIT: {
    icon: ArrowDownLeft,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    sign: '+',
  },
};

const statusStyles: Record<TxStatus, { icon: React.ElementType, text: string }> = {
    COMPLETED: { icon: CheckCircle2, text: 'text-emerald-500' },
    PENDING: { icon: Clock, text: 'text-amber-500' },
    FAILED: { icon: XCircle, text: 'text-destructive' },
    REVERSED: { icon: XCircle, text: 'text-muted-foreground' },
};

const SortableHeader = ({
  column,
  title,
  sortBy,
  sortOrder,
  onSort,
  className = ''
}: {
  column: string;
  title: string;
  sortBy: string;
  sortOrder: string;
  onSort: (column: any) => void;
  className?: string;
}) => {
  const isActive = sortBy === column;
  return (
    <th className={`px-6 py-3 font-medium text-muted-foreground ${className}`}>
        <button className="flex items-center gap-2 group" onClick={() => onSort(column)}>
            {title}
            {isActive ? (
                sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
            ) : (
                <ArrowUp className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
        </button>
    </th>
  );
};

export function HistoryTable({
  transactions,
  sortBy,
  sortOrder,
  onSort,
}: {
  transactions: Transaction[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: 'createdAt' | 'amount' | 'status' | 'description') => void;
}) {
  if (transactions.length === 0) {
    return (
        <Card className="border-dashed">
            <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">No Transactions Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or check back later.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="border-b border-border">
                        <SortableHeader 
                            column="description" 
                            title="Transaction" 
                            sortBy={sortBy} 
                            sortOrder={sortOrder} 
                            onSort={onSort}
                            className="text-left w-1/2"
                        />
                        
                        <SortableHeader column="createdAt" title="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-left hidden md:table-cell" />
                        <SortableHeader column="amount" title="Amount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-right" />
                        <SortableHeader column="status" title="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-center hidden lg:table-cell" />

                        <th className="px-6 py-3 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {transactions.map((tx) => {
                        const typeStyle = typeStyles[tx.type];
                        const statusStyle = statusStyles[tx.status];
                        
                        return (
                            <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-9 w-9 shrink-0 flex items-center justify-center rounded-full", typeStyle.bg, typeStyle.text)}>
                                            <typeStyle.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-xs">
                                                {tx.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground md:hidden">
                                                {formatDate(tx.createdAt).split(',')[0]}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                                    {formatDate(tx.createdAt)}
                                </td>
                                <td className={cn("px-6 py-4 text-right font-semibold", typeStyle.text)}>
                                    {typeStyle.sign} {formatCurrency(tx.amount, tx.currency)}
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex justify-center">
                                        <statusStyle.icon className={cn("h-4 w-4", statusStyle.text)} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
}