'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Calendar, Download, X,
    Loader2, Search, Check,
    Plus, ArrowRight
} from 'lucide-react';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../ui/dialog';
import { ApiService } from '../../../../services/api';
import { cn } from '../../../../lib/utils/cn';
import toast from 'react-hot-toast';

interface FinanceFilterBarProps {
    categories: any[];
}

export const FinanceFilterBar = memo(function FinanceFilterBar({ categories }: FinanceFilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isExporting, setIsExporting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [catQuery, setCatQuery] = useState('');

    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.getAll('categoryIds') || []
    );

    useEffect(() => {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        selectedCategories.forEach(id => params.append('categoryIds', id));

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [startDate, endDate, selectedCategories, router, searchParams]);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading('Preparing your treasury report...');
        try {
            const params = new URLSearchParams(searchParams.toString());
            const response = await ApiService.admin.exportFinanceCsv(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Givar-Treasury-Audit-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Your report is ready for download', { id: toastId });
        } catch (e) {
            toast.error('We could not complete the export request', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleCategory = (id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedCategories([]);
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.name.toLowerCase().includes(catQuery.toLowerCase())
        );
    }, [categories, catQuery]);

    const activeCategoryObjects = categories.filter(c => selectedCategories.includes(c.id));

    return (
        <div className="space-y-6 min-w-0">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 min-w-0">

                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-[24px] border border-border/40 shadow-inner w-full lg:w-auto min-w-0">
                    <div className="flex items-center px-3 gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">From</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent h-9 text-[11px] font-bold text-foreground outline-none border-none cursor-pointer"
                        />
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                    <div className="flex items-center px-3 gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tight">To</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent h-9 text-[11px] font-bold text-foreground outline-none border-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto min-w-0 flex-nowrap">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-3xl h-11 px-5 font-bold text-xs gap-2 border-border/60 bg-background hover:bg-muted transition-all active:scale-95">
                                <Plus className="h-4 w-4" />
                                <span>Filter By Sectors</span>
                                {selectedCategories.length > 0 && (
                                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-white border-0 text-[10px] font-black">
                                        {selectedCategories.length}
                                    </Badge>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-w-md h-[550px] flex flex-col z-[110] bg-card">
                            <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
                                <DialogTitle className="text-lg font-bold">Select Impact Sectors</DialogTitle>
                            </DialogHeader>

                            <div className="p-4 shrink-0">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search Sectors..."
                                        value={catQuery}
                                        onChange={(e) => setCatQuery(e.target.value)}
                                        className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/40 focus:bg-background shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                                <div className="grid gap-1">
                                    {filteredCategories.map((cat) => {
                                        const isSelected = selectedCategories.includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleCategory(cat.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl transition-all text-left group",
                                                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                            >
                                                <span className="text-sm font-bold">{cat.name}</span>
                                                {isSelected && <Check className="h-4 w-4" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t border-border/40 bg-muted/10 shrink-0">
                                <Button
                                    className="w-full h-12 rounded-3xl font-bold shadow-lg shadow-primary/20 border-0 active:scale-95"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Confirm Selection
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex-shrink min-w-0 lg:flex-none h-11 px-4 rounded-3xl font-bold text-xs shadow-lg shadow-primary/20 gap-2 border-0 transition-all active:scale-95"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Generate CSV
                    </Button>
                </div>
            </div>

            {activeCategoryObjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground mr-1 tracking-tight">Active Filters:</span>
                    {activeCategoryObjects.map((cat) => (
                        <Badge
                            key={cat.id}
                            variant="secondary"
                            className="rounded-3xl pl-3 pr-1.5 py-1 gap-2 font-bold text-[10px] bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        >
                            {cat.name}
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="h-4 w-4 rounded-full hover:bg-primary/20 flex items-center justify-center transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <button
                        onClick={() => setSelectedCategories([])}
                        className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                        Clear All
                    </button>
                </div>
            )}
        </div>
    );
});