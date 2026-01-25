'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowDown, 
  ArrowUp, 
  Search,
  Copy,
  ShieldCheck,
  FileText,
  Share2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Transaction, TxStatus, TxType } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { SmartCurrency } from '../../ui/smart-currency';
import { Button } from '../../ui/button';
import toast from 'react-hot-toast';

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
    <th className={cn("px-6 py-4 font-semibold text-muted-foreground transition-colors hover:text-foreground", className)}>
        <button className="flex items-center gap-2 group outline-none" onClick={() => onSort(column)}>
            {title}
            {isActive ? (
                sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />
            ) : (
                <ArrowUp className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
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
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Reference copied to clipboard');
  };

  if (transactions.length === 0) {
    return (
        <Card className="border-dashed border-2 rounded-2xl bg-muted/20">
            <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border shadow-inner">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-bold text-lg text-foreground">No Transactions Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                    Try adjusting your filters or search terms to find what you&apos;re looking for.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border">
                    <tr>
                        <SortableHeader 
                            column="description" 
                            title="Transaction" 
                            sortBy={sortBy} 
                            sortOrder={sortOrder} 
                            onSort={onSort}
                            className="w-1/2"
                        />
                        
                        <SortableHeader column="createdAt" title="Date" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="hidden md:table-cell" />
                        <SortableHeader column="amount" title="Amount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-right" />
                        <SortableHeader column="status" title="Status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-center hidden lg:table-cell" />

                        <th className="px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {transactions.map((tx) => {
                        const typeStyle = typeStyles[tx.type];
                        const statusStyle = statusStyles[tx.status];
                        
                        return (
                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm border border-border/50", typeStyle.bg, typeStyle.text)}>
                                            <typeStyle.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-foreground truncate max-w-[150px] sm:max-w-xs transition-colors group-hover:text-primary">
                                                {tx.description}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground opacity-70 truncate md:hidden">
                                                {tx.reference.slice(0, 12)}...
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground hidden md:table-cell font-medium">
                                    {formatDate(tx.createdAt)}
                                </td>
                                <td className={cn("px-6 py-4 text-right font-bold tabular-nums", typeStyle.text)}>
                                    {typeStyle.sign} {formatCurrency(tx.amount, tx.currency)}
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex justify-center">
                                        <statusStyle.icon className={cn("h-5 w-5", statusStyle.text)} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setSelectedTx(tx)}
                                        className="rounded-xl h-8 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        Details
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        {/* --- Forensics Detail Drawer (Dialog) --- */}
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
            <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                
                {selectedTx && (
                    <div className="p-8 space-y-8">
                        <DialogHeader className="space-y-4">
                            <div className="flex items-center gap-2 text-primary bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Verified Entry</span>
                            </div>
                            <DialogTitle className="text-2xl font-extrabold tracking-tight">Transaction Detail</DialogTitle>
                        </DialogHeader>

                        {/* Amount Hero Section */}
                        <div className="text-center p-8 rounded-[24px] bg-muted/30 border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <FileText className="h-16 w-16" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-3">Total Amount</p>
                            <SmartCurrency 
                                amount={selectedTx.amount} 
                                currency={selectedTx.currency} 
                                visible={true} 
                                size="large" 
                                className="text-foreground"
                            />
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4 px-1">
                            <div className="space-y-1.5 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Process Status</span>
                                <div className={cn("flex items-center gap-2 font-bold text-sm", statusStyles[selectedTx.status].text)}>
                                    {React.createElement(statusStyles[selectedTx.status].icon, { className: "h-4 w-4" })}
                                    {selectedTx.status}
                                </div>
                            </div>
                            <div className="space-y-1.5 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Transaction Type</span>
                                <p className={cn("text-sm font-bold capitalize", typeStyles[selectedTx.type].text)}>
                                    {selectedTx.type.toLowerCase()}
                                </p>
                            </div>
                        </div>

                        {/* Reference Section */}
                        <div className="p-5 rounded-[20px] bg-secondary/30 border border-border/50 space-y-3 relative group">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference ID</span>
                                <button 
                                    onClick={() => copyReference(selectedTx.reference)}
                                    className="flex items-center gap-1.5 text-primary hover:text-primary/80 font-bold transition-colors"
                                >
                                    <Copy className="h-3 w-3" /> 
                                    <span className="text-[10px] uppercase">Copy</span>
                                </button>
                            </div>
                            <p className="font-mono text-[11px] break-all leading-relaxed text-foreground/80 pr-4 select-all">
                                {selectedTx.reference}
                            </p>
                        </div>

                        {/* Primary Action */}
                        <div className="pt-2">
                            <Button 
                                className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex gap-2"
                                onClick={() => toast.success('Feature coming soon')}
                            >
                                <Share2 className="h-4 w-4" /> Share Receipt
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}