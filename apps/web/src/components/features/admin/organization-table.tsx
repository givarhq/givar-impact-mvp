'use client';

import { useRouter } from 'next/navigation';
import {
    Inbox, Building2, User, Mail,
    ArrowUpRight, ShieldCheck, ShieldAlert, Clock,
    ChevronRight, FileText
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
    NOT_SUBMITTED: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', icon: Clock, label: 'No submission' },
    PENDING: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock, label: 'Pending' },
    VERIFIED: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: ShieldCheck, label: 'Verified' },
    REJECTED: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: ShieldAlert, label: 'Rejected' },
};

export function OrganizationTable({ profiles }: { profiles: any[] }) {
    const router = useRouter();

    if (profiles.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground">No organizations found</h3>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Cards */}
            <div className="grid gap-2 md:hidden">
                {profiles.map((profile) => {
                    const config = statusConfig[profile.status] || statusConfig.NOT_SUBMITTED;
                    const StatusIcon = config.icon;

                    return (
                        <Card
                            key={profile.id}
                            onClick={() => router.push(`/admin/organizations/${profile.id}`)}
                            className="rounded-3xl border-border/40 shadow-sm active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
                        >
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{profile.legalName}</p>
                                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                                                {profile.registrationNumber || 'No RC Number'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-border/40 pt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0 border border-border/40">
                                            {profile.user?.firstName?.[0]}{profile.user?.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">
                                                {profile.user.firstName} {profile.user.lastName}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={cn("gap-1 px-2 py-0.5 rounded-3xl border text-[9px] font-bold shadow-none", config.color)}>
                                        <StatusIcon className="h-3 w-3" />
                                        {config.label}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* DESKTOP: Standard Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 font-bold text-xs">Legal entity</th>
                                <th className="px-6 py-4 font-bold text-xs">Proposer / Owner</th>
                                <th className="px-6 py-4 font-bold text-xs text-center">Projects</th>
                                <th className="px-6 py-4 font-bold text-xs">Verification</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {profiles.map((profile) => {
                                const config = statusConfig[profile.status] || statusConfig.NOT_SUBMITTED;
                                const StatusIcon = config.icon;

                                return (
                                    <tr
                                        key={profile.id}
                                        className="hover:bg-muted/30 transition-all cursor-pointer group"
                                        onClick={() => router.push(`/admin/organizations/${profile.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-sm">
                                                        {profile.legalName}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                                        {profile.registrationNumber || 'No RC Number'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-3xl bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground border border-border/40">
                                                    {profile.user?.firstName?.[0]}{profile.user?.lastName?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-xs">
                                                        {profile.user.firstName} {profile.user.lastName}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate opacity-80">
                                                        {profile.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-3xl bg-muted/40 border border-border/40">
                                                <span className="font-bold text-foreground text-xs">{profile.user._count.projects}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={cn("gap-1.5 pl-1.5 pr-2.5 py-0.5 rounded-3xl border font-bold text-[11px] shadow-none", config.color)}>
                                                <StatusIcon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-3xl h-8 text-xs font-bold gap-2 hover:bg-background border border-transparent hover:border-border/40">
                                                Details <ArrowUpRight className="h-3 w-3" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}