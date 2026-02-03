// apps/web/src/components/features/admin/user-filters.tsx

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Download, Loader2 } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

export function UserFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [role, setRole] = useState(searchParams.get('role') || 'all');
    const [type, setType] = useState(searchParams.get('accountType') || 'all');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1');

        if (search) params.set('search', search); else params.delete('search');
        if (status !== 'all') params.set('status', status); else params.delete('status');
        if (role !== 'all') params.set('role', role); else params.delete('role');
        if (type !== 'all') params.set('accountType', type); else params.delete('accountType');

        const timeout = setTimeout(() => {
            if (params.toString() !== searchParams.toString()) {
                router.replace(`?${params.toString()}`);
            }
        }, 400);

        return () => clearTimeout(timeout);
    }, [search, status, role, type, router, searchParams]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('page');
            params.delete('limit');

            const response = await ApiService.admin.exportUsers(params);

            // FIX: If the response is actually JSON (an error), the interceptor might have failed
            // but we check the type to be sure.
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const error = JSON.parse(text);
                throw new Error(error.message || 'Export failed');
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `givar-users-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Forensic ledger exported');
        } catch (e: any) {
            console.error('Export Error:', e);
            toast.error(e.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const clear = () => {
        setSearch('');
        setStatus('all');
        setRole('all');
        setType('all');
        router.replace('?page=1');
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-1">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search by name, email, or UUID..."
                    className="pl-11 h-12 bg-card border-border rounded-2xl shadow-sm focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px] h-12 bg-card border-border rounded-2xl shadow-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active Only</SelectItem>
                        <SelectItem value="LOCKED">Flagged/Locked</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-[140px] h-12 bg-card border-border rounded-2xl shadow-sm">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="USER">Standard Users</SelectItem>
                        <SelectItem value="ADMIN">Administrators</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-[160px] h-12 bg-card border-border rounded-2xl shadow-sm">
                        <SelectValue placeholder="Account Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="ORGANIZER">Organizer</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="h-12 px-4 rounded-xl border-border bg-card font-bold text-xs gap-2"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Export CSV
                    </Button>

                    {(search || status !== 'all' || role !== 'all' || type !== 'all') && (
                        <Button variant="ghost" onClick={clear} className="h-12 px-4 rounded-xl text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4 mr-2" /> Reset
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}