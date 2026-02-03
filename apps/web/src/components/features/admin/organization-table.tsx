'use client';

import { useRouter } from 'next/navigation';
import {
    Inbox, Building2, User, Mail,
    ArrowUpRight, ShieldCheck, ShieldAlert, Clock
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
    NOT_SUBMITTED: { color: 'bg-zinc-500/10 text-zinc-500', icon: Clock, label: 'No Submission' },
    PENDING: { color: 'bg-amber-500/10 text-amber-600', icon: Clock, label: 'Pending' },
    VERIFIED: { color: 'bg-emerald-500/10 text-emerald-600', icon: ShieldCheck, label: 'Verified' },
    REJECTED: { color: 'bg-destructive/10 text-destructive', icon: ShieldAlert, label: 'Rejected' },
};

export function OrganizationTable({ profiles }: { profiles: any[] }) {
    const router = useRouter();

    if (profiles.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/20">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-foreground">No organizations found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Legal Entity</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Proposer / Owner</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Projects</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {profiles.map((profile) => {
                            const config = statusConfig[profile.status] || statusConfig.NOT_SUBMITTED;
                            const StatusIcon = config.icon;

                            return (
                                <tr
                                    key={profile.id}
                                    className="hover:bg-muted/30 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/admin/organizations/${profile.id}`)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {profile.legalName}
                                                </p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
                                                    {profile.registrationNumber || 'No RC Number'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            <div className="min-w-0">
                                                <p className="font-medium text-foreground text-xs">
                                                    {profile.user.firstName} {profile.user.lastName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    {profile.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className="font-bold text-foreground">{profile.user._count.projects}</span>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Impacts</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={cn("gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border font-bold text-[9px] uppercase tracking-widest", config.color)}>
                                            <StatusIcon className="h-3 w-3" />
                                            {config.label}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Button variant="ghost" size="sm" className="rounded-xl h-8 text-xs font-bold gap-2">
                                            Details <ArrowUpRight className="h-3 w-3" />
                                        </Button>
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