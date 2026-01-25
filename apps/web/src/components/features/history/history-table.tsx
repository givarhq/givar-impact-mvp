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
  Calendar,
  ExternalLink,
  ArrowUp,
  Download,
  Loader2
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
import { generateImpactReceipt } from '../../../lib/utils/receipt-generator'; // SOTA Logic

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
  const [isGenerating, setIsGenerating] = useState(false); // SOTA: Receipt state

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Reference copied');
  };

  // PDF Download Handler
  const handleDownloadReceipt = async (tx: Transaction) => {
    setIsGenerating(true);
    const loadToast = toast.loading('Preparing your impact receipt...');
    try {
      await generateImpactReceipt(tx);
      toast.success('Receipt downloaded successfully', { id: loadToast });
    } catch (err) {
      toast.error('Failed to generate receipt', { id: loadToast });
    } finally {
      setIsGenerating(false);
    }
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
        <table className="w-full border-collapse table-fixed md:table-auto">
            <thead className="bg-muted/40 border-b border-border hidden md:table-header-group">
                <tr>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-left w-1/2 md:text-xs lg:text-sm">Transaction</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-left md:text-xs lg:text-sm w-[200px]">Date</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-right md:text-xs lg:text-sm">Amount</th>
                    <th className="px-6 py-4 font-semibold text-muted-foreground text-center md:text-xs lg:text-sm">Status</th>
                    <th className="px-6 py-3"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border block md:table-row-group">
                {transactions.map((tx) => {
                    const typeStyle = typeStyles[tx.type];
                    const statusStyle = statusStyles[tx.status];
                    
                    return (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors group block md:table-row w-full overflow-hidden">
                            <td className="block md:table-cell p-4 md:px-6 md:py-4 border-none w-full">
                                <div className="flex items-center gap-3 w-full">
                                    <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl shadow-sm border border-border/50", typeStyle.bg, typeStyle.text)}>
                                        <typeStyle.icon className="h-5 w-5" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center gap-2">
                                            <p className="font-bold text-foreground truncate text-sm md:text-xs lg:text-sm">
                                                {tx.description}
                                            </p>
                                            <p className={cn("md:hidden font-bold tabular-nums shrink-0 text-sm", typeStyle.text)}>
                                                {typeStyle.sign}{formatCurrency(tx.amount, tx.currency)}
                                            </p>
                                        </div>
                                        
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

                            <td className="px-6 py-4 text-muted-foreground hidden md:table-cell font-medium md:text-xs lg:text-sm whitespace-nowrap">
                                {formatDate(tx.createdAt)}
                            </td>
                            <td className={cn("px-6 py-4 text-right font-bold tabular-nums hidden md:table-cell md:text-xs lg:text-sm", typeStyle.text)}>
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
                    <div className="p-4 md:p-6 space-y-4 overflow-hidden"> {/* SOTA: Reduced padding and spacing */}
                        <DialogHeader className="space-y-2">
                            <div className="flex items-center gap-2 text-primary bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                                <ShieldCheck className="h-3 w-3" />
                                <span className="text-[9px] font-bold uppercase tracking-widest leading-none">Verified Entry</span>
                            </div>
                            <DialogTitle className="text-lg md:text-xl font-extrabold tracking-tight leading-none">Transaction Detail</DialogTitle>
                        </DialogHeader>

                        {/* SOTA: Compressed Amount Card */}
                        <div className="text-center p-4 md:p-6 rounded-[24px] bg-muted/30 border border-border/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <FileText className="h-10 w-10 md:h-12 md:w-12" />
                            </div>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Amount</p>
                            <div className="max-w-full overflow-hidden leading-none">
                                <SmartCurrency amount={selectedTx.amount} currency={selectedTx.currency} visible={true} size="large" className="text-foreground" />
                            </div>
                        </div>

                        {/* --- HIDDEN RECEIPT TEMPLATE --- */}
                        <div className="absolute left-[-9999px] top-[-9999px]">
                            <div id={`receipt-${selectedTx.id}`} className="w-[800px] p-16 bg-white text-slate-900 font-sans">
                                <div className="flex justify-between items-start border-b-2 border-emerald-500 pb-10">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tighter text-emerald-600">Givar.</h1>
                                        <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Impact Receipt</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">Reference</p>
                                        <p className="text-xs font-mono text-slate-500">{selectedTx.reference}</p>
                                    </div>
                                </div>
                                <div className="py-12 grid grid-cols-2 gap-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Donated By</p>
                                        <p className="text-lg font-bold">
                                          {selectedTx.user?.firstName || 'Valued'} {selectedTx.user?.lastName || 'Giver'}
                                        </p>
                                        <p className="text-sm text-slate-500">{selectedTx.user?.email}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                                        <p className="text-lg font-bold">{formatDate(selectedTx.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 mb-10">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Beneficiary Project</p>
                                            <p className="text-xl font-black">{selectedTx.project?.title || selectedTx.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Amount</p>
                                            <p className="text-3xl font-black text-emerald-700">{formatCurrency(selectedTx.amount, selectedTx.currency)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <p className="text-[10px] max-w-[200px] text-slate-400 leading-tight">
                                            This document serves as digital proof of impact. Verified on the Givar Transparent Ledger.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-12 w-32 bg-slate-100 rounded opacity-50 ml-auto mb-2 flex items-center justify-center italic text-xs">Digital Signature</div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized by Givar Platform</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SOTA: Purpose & Reference Unified Card */}
                        <div className="space-y-2 min-w-0">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1">Purpose & Reference</span>
                             <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm space-y-3 min-w-0">
                                {selectedTx.project ? (
                                    /* SOTA FIX: The entire text area is now a clickable Link */
                                    <Link 
                                        href={`/dashboard/impact/${selectedTx.project.slug}`} 
                                        className="block group/link min-w-0"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-foreground leading-tight line-clamp-2 group-hover/link:text-primary transition-colors">
                                                    {selectedTx.description}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5 group-hover/link:opacity-80">
                                                    Cause: {selectedTx.project.title}
                                                </p>
                                            </div>
                                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover/link:text-primary group-hover/link:bg-primary/10 transition-all border border-border/50 shrink-0">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-foreground leading-tight">
                                            {selectedTx.description}
                                        </p>
                                    </div>
                                )}
                                
                                {/* SOTA: Merged Reference ID into this card */}
                                <div className="pt-3 border-t border-border/50 flex justify-between items-center gap-4">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Ref ID</span>
                                        <p className="font-mono text-[10px] truncate text-foreground/60">{selectedTx.reference}</p>
                                    </div>
                                    <button 
                                        onClick={() => copyReference(selectedTx.reference)} 
                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary text-primary transition-colors border border-border/50 shrink-0"
                                        title="Copy Reference"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                             </div>
                        </div>

                        {/* SOTA: Compressed Info Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 md:p-4 rounded-2xl bg-card border border-border/50 shadow-sm min-w-0">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
                                <div className={cn("flex items-center gap-2 font-bold text-[10px] md:text-xs truncate", statusStyles[selectedTx.status].text)}>
                                    {React.createElement(statusStyles[selectedTx.status].icon, { className: "h-3.5 w-3.5 shrink-0" })}
                                    <span className="truncate">{selectedTx.status}</span>
                                </div>
                            </div>
                            <div className="p-3 md:p-4 rounded-2xl bg-card border border-border/50 shadow-sm min-w-0">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Channel</span>
                                <p className="text-[10px] md:text-xs font-bold text-foreground truncate uppercase">
                                    {selectedTx.metadata?.channel || 'Wallet'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                          <Button 
                              onClick={() => handleDownloadReceipt(selectedTx)} 
                              disabled={isGenerating || selectedTx.status !== 'COMPLETED'}
                              className="w-full h-12 rounded-2xl font-bold gap-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border/50 shadow-none"
                          >
                              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              Download Receipt
                          </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}