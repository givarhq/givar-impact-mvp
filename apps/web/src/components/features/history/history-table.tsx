'use client';

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Copy,
  ShieldCheck,
  FileText,
  Share2,
  Calendar,
  ExternalLink,
  ArrowUp
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { Transaction, TxStatus, TxType } from '../../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { SmartCurrency } from '../../ui/smart-currency';
import { Button } from '../../ui/button';
import Link from 'next/link';
import toast from 'react-hot-toast';

const typeStyles: Record<TxType, { icon: React.ElementType, bg: string, text: string, sign: string }> = {
  DEBIT: { icon: ArrowUpRight, bg: 'bg-rose-500/10', text: 'text-rose-500', sign: '-' },
  CREDIT: { icon: ArrowDownLeft, bg: 'bg-emerald-500/10', text: 'text-emerald-500', sign: '+' },
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
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
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
    toast.success('Reference copied');
  };

  if (transactions.length === 0) {
    return (
        <Card className="border-dashed border-2 rounded-2xl bg-muted/20">
            <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border shadow-inner">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-bold text-lg text-foreground">No Transactions</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                    Your history is currently empty.
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* SOTA: Table layout fixed to prevent horizontal push */}
        <table className="w-full border-collapse table-fixed md:table-auto">
            <thead className="bg-muted/40 border-b border-border hidden md:table-header-group">
                <tr>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-left w-1/2">Transaction</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-left">Date</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-center">Status</th>
                    <th className="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border block md:table-row-group">
                {transactions.map((tx) => {
                    const typeStyle = typeStyles[tx.type];
                    const statusStyle = statusStyles[tx.status];
                    
                    return (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden">
                            {/* Mobile Detail Block */}
                            <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full">
                                <div className="flex items-center gap-3 w-full">
                                    {/* Icon */}
                                    <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm border border-border/50", typeStyle.bg, typeStyle.text)}>
                                        <typeStyle.icon className="h-5 w-5" />
                                    </div>
                                    
                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <p className="font-bold text-foreground truncate text-sm md:text-base">
                                                {tx.description}
                                            </p>
                                            {/* Mobile Amount */}
                                            <p className={cn("md:hidden font-bold tabular-nums shrink-0 text-sm", typeStyle.text)}>
                                                {typeStyle.sign}{formatCurrency(tx.amount, tx.currency)}
                                            </p>
                                        </div>
                                        
                                        {/* Mobile Sub-line */}
                                        <div className="md:hidden flex items-center gap-2 mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Calendar className="h-3 w-3" /> {formatDate(tx.createdAt).split(',')[0]}
                                            </span>
                                            <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                                            <span className={cn("flex items-center gap-1 shrink-0", statusStyle.text)}>
                                                <statusStyle.icon className="h-3 w-3" /> {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Mobile-only Action Button - Compact and full width */}
                                <div className="mt-3 md:hidden">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => setSelectedTx(tx)}
                                        className="rounded-xl h-9 w-full text-[11px] font-bold shadow-none border border-border/50"
                                    >
                                        Transaction Details
                                    </Button>
                                </div>
                            </td>

                            {/* Desktop-only Columns */}
                            <td className="px-6 py-4 text-muted-foreground hidden md:table-cell font-medium">
                                {formatDate(tx.createdAt)}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell", typeStyle.text)}>
                                {typeStyle.sign} {formatCurrency(tx.amount, tx.currency)}
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell text-center">
                                <div className="flex justify-center">
                                    <statusStyle.icon className={cn("h-5 w-5", statusStyle.text)} />
                                </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 text-right">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedTx(tx)}
                                    className="rounded-xl h-8 text-xs font-bold"
                                >
                                    Details
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {/* --- Forensics Detail Drawer --- */}
        <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-card">
                {selectedTx && (
                    <div className="p-5 md:p-8 space-y-6 overflow-hidden"> {/* overflow-hidden parent */}
                        <DialogHeader className="space-y-4">
                            <div className="flex items-center gap-2 text-primary bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Verified Entry</span>
                            </div>
                            <DialogTitle className="text-xl md:text-2xl font-extrabold tracking-tight">Transaction Detail</DialogTitle>
                        </DialogHeader>

                        {/* Amount Section */}
                        <div className="text-center p-6 md:p-8 rounded-[24px] bg-muted/30 border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <FileText className="h-12 w-12 md:h-16 md:w-16" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-3">Total Amount</p>
                            {/* Ensure currency doesn't overflow */}
                            <div className="max-w-full overflow-hidden">
                                <SmartCurrency amount={selectedTx.amount} currency={selectedTx.currency} visible={true} size="large" className="text-foreground" />
                            </div>
                        </div>

                        {/* Purpose Section - FIX: Added gap and min-w-0 */}
                        <div className="space-y-3 min-w-0">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1">Purpose</span>
                             <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-between gap-3 min-w-0">
                                <div className="min-w-0 flex-1"> {/* CRITICAL: min-w-0 for flex children */}
                                    <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">
                                        {selectedTx.description}
                                    </p>
                                    {selectedTx.project && (
                                        <p className="text-[11px] text-muted-foreground truncate mt-1">
                                            Cause: {selectedTx.project.title}
                                        </p>
                                    )}
                                </div>
                                {selectedTx.project && (
                                    <Link href={`/dashboard/impact/${selectedTx.project.slug}`} className="shrink-0">
                                        <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border/50">
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                    </Link>
                                )}
                             </div>
                        </div>

                        {/* Metadata Grid - FIX: text-xs and truncate */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm min-w-0">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
                                <div className={cn("flex items-center gap-2 font-bold text-[11px] md:text-xs truncate", statusStyles[selectedTx.status].text)}>
                                    {React.createElement(statusStyles[selectedTx.status].icon, { className: "h-3.5 w-3.5 shrink-0" })}
                                    <span className="truncate">{selectedTx.status}</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm min-w-0">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Channel</span>
                                <p className="text-[11px] md:text-xs font-bold text-foreground truncate uppercase">
                                    {selectedTx.metadata?.channel || 'Wallet'}
                                </p>
                            </div>
                        </div>

                        {/* Reference - FIX: break-all and smaller text */}
                        <div className="p-5 rounded-[20px] bg-secondary/30 border border-border/50 space-y-3 min-w-0">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference</span>
                                <button onClick={() => copyReference(selectedTx.reference)} className="flex items-center gap-1 text-primary hover:text-primary/80 font-bold transition-colors">
                                    <Copy className="h-3 w-3" /> <span className="text-[10px] uppercase">Copy</span>
                                </button>
                            </div>
                            <p className="font-mono text-[9px] md:text-[10px] break-all leading-relaxed text-foreground/70">
                                {selectedTx.reference}
                            </p>
                        </div>

                        <Button className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex gap-2 active:scale-[0.98] transition-transform">
                            <Share2 className="h-4 w-4" /> Share Impact
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}