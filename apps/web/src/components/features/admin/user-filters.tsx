'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { Search, X, Download, Loader2, Filter } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

export const UserFilters = memo(function UserFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [role, setRole] = useState(searchParams.get('role') || 'all');
    const [type, setType] = useState(searchParams.get('accountType') || 'all');
    const [isExporting, setIsExporting] = useState(false);
    const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));

    useEffect(() => {
        if (search === (searchParams.get('search') || '') &&
            status === (searchParams.get('status') || 'all') &&
            role === (searchParams.get('role') || 'all') &&
            type === (searchParams.get('accountType') || 'all')) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (role !== 'all') params.set('role', role); else params.delete('role');
        if (type !== 'all') params.set('accountType', type); else params.delete('accountType');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, role, type, router, searchParams]);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generating...");
        try {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('page');
            params.delete('limit');
            const response = await ApiService.admin.exportUsers(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `givar-users-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Successfully exported', { id: toastId });
        } catch (e: any) {
            toast.error('Export failed', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const clear = () => {
        setSearch('');
        setStatus('all');
        setType('all');
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between gap-4 w-full relative min-h-[40px]">
                <div className="flex items-center gap-6 flex-1 min-w-0">
                    <h1 className="md:hidden text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
                        Users
                    </h1>

                    <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
                        <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name, email, or ID..."
                            className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
                        className={cn(
                            "md:hidden h-10 w-10 rounded-3xl transition-all",
                            isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
                        )}
                    >
                        {isMobileSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                    </Button>

                    <div className="hidden md:flex items-center gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[130px] h-10 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                                <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                                <SelectItem value="LOCKED" className="text-xs">Locked</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="w-[130px] h-10 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="Account Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                <SelectItem value="INDIVIDUAL" className="text-xs">Individual</SelectItem>
                                <SelectItem value="ORGANIZER" className="text-xs">Organizer</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-10 px-4 rounded-3xl border-border/60 font-bold text-xs gap-2 bg-transparent"
                        >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            Export
                        </Button>

                        {(search || status !== 'all' || type !== 'all') && (
                            <Button variant="ghost" onClick={clear} className="h-10 px-4 rounded-3xl text-muted-foreground text-xs font-bold">
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isMobileSearchVisible && (
                <div className="md:hidden space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Identities..."
                            className="pl-11 h-11 rounded-3xl bg-muted/30 border-border/40 focus:bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="LOCKED">Locked</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                                <SelectValue placeholder="Account Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl">
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                <SelectItem value="ORGANIZER">Organizer</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="h-10 rounded-3xl border-border/60 font-bold text-xs gap-2 flex-1"
                        >
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            CSV Export
                        </Button>
                        <Button variant="ghost" onClick={clear} className="h-10 rounded-3xl font-bold text-xs flex-1">
                            Reset Filters
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});