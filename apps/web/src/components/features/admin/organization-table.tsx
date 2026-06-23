'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Inbox,
    Building2,
    ShieldCheck,
    ShieldAlert,
    Clock,
    ChevronRight,
    ArrowUpRight,
    User
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
    NOT_SUBMITTED: { color: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', icon: Clock, label: 'No Submission' },
    PENDING: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock, label: 'Pending Review' },
    VERIFIED: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: ShieldCheck, label: 'Verified' },
    REJECTED: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: ShieldAlert, label: 'Rejected' },
};

export const OrganizationTable = memo(function OrganizationTable({ profiles }: { profiles: any[] }) {
    const router = useRouter();

    if (profiles.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 tracking-widest ">No Identities Found</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Try adjusting your active filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Card Stack */}
            <div className="grid gap-2.5 md:hidden">
                <AnimatePresence mode="popLayout">
                    {profiles.map((profile) => {
                        const config = statusConfig[profile.status] || statusConfig.NOT_SUBMITTED;
                        const StatusIcon = config.icon;
                        const isIndividual = profile.kycType === 'INDIVIDUAL';

                        return (
                            <motion.div
                                key={profile.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card
                                    onClick={() => router.push(`/admin/organizations/${profile.id}`)}
                                    className="rounded-3xl border-border/40 shadow-sm active:scale-[0.98] transition-all cursor-pointer overflow-hidden bg-card"
                                >
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={cn(
                                                    "h-11 w-11 rounded-2xl flex items-center justify-center border shrink-0 shadow-inner",
                                                    isIndividual ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                                )}>
                                                    {isIndividual ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate leading-tight mb-1">{profile.legalName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 rounded-3xl font-bold border-border/40 bg-muted/30 text-muted-foreground">
                                                            {isIndividual ? 'Individual' : 'Corporate'}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-mono opacity-60">
                                                            {profile.registrationNumber || 'No ID'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 mt-1" />
                                        </div>

                                        <div className="flex justify-between items-center border-t border-border/40 pt-3.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="h-7 w-7 rounded-2xl bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0 border border-border/40 shadow-sm">
                                                    {profile.user?.firstName?.[0]}{profile.user?.lastName?.[0]}
                                                </div>
                                                <p className="text-[11px] font-bold text-foreground truncate">
                                                    {profile.user.firstName} {profile.user.lastName}
                                                </p>
                                            </div>
                                            <Badge className={cn("gap-1.5 px-3 py-1 rounded-3xl border text-[9px] font-black tracking-widest shadow-none ", config.color)}>
                                                <StatusIcon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* DESKTOP: Directory Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="px-7 py-4 font-bold text-[10px] tracking-widest ">Legal Entity</th>
                                <th className="px-7 py-4 font-bold text-[10px] tracking-widest ">Applicant Type</th>
                                <th className="px-7 py-4 font-bold text-[10px] tracking-widest ">Proposer Identity</th>
                                <th className="px-7 py-4 font-bold text-[10px] tracking-widest  text-center">Projects</th>
                                <th className="px-7 py-4 font-bold text-[10px] tracking-widest ">Status</th>
                                <th className="px-7 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {profiles.map((profile) => {
                                const config = statusConfig[profile.status] || statusConfig.NOT_SUBMITTED;
                                const StatusIcon = config.icon;
                                const isIndividual = profile.kycType === 'INDIVIDUAL';

                                return (
                                    <tr
                                        key={profile.id}
                                        className="hover:bg-muted/20 transition-all cursor-pointer group"
                                        onClick={() => router.push(`/admin/organizations/${profile.id}`)}
                                    >
                                        <td className="px-7 py-4">
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate text-sm">
                                                    {profile.legalName}
                                                </p>
                                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5 opacity-60">
                                                    ID: {profile.registrationNumber || 'N/A'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-7 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1 rounded-3xl border text-[10px] font-bold",
                                                isIndividual ? "bg-blue-500/5 text-blue-600 border-blue-500/10" : "bg-purple-500/5 text-purple-600 border-purple-500/10"
                                            )}>
                                                {isIndividual ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                                                {isIndividual ? 'Individual' : 'Corporate'}
                                            </div>
                                        </td>
                                        <td className="px-7 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-2xl bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border/40 shadow-sm">
                                                    {profile.user?.firstName?.[0]}{profile.user?.lastName?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-xs leading-tight">
                                                        {profile.user.firstName} {profile.user.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate opacity-70 mt-0.5">
                                                        {profile.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-7 py-4 text-center">
                                            <div className="inline-flex items-center px-3 py-0.5 rounded-3xl bg-muted/50 border border-border/40 shadow-inner">
                                                <span className="font-black text-foreground text-[10px] tabular-nums">{profile.user._count.projects}</span>
                                            </div>
                                        </td>
                                        <td className="px-7 py-4">
                                            <Badge variant="outline" className={cn("gap-1.5 pl-2 pr-3 py-1 rounded-3xl border font-bold text-[9px] tracking-widest shadow-none  transition-all", config.color)}>
                                                <StatusIcon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </td>
                                        <td className="px-7 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="rounded-3xl h-8 text-[10px] font-black tracking-widest  gap-2 hover:bg-background border border-transparent hover:border-border/40 transition-all active:scale-95">
                                                Review <ArrowUpRight className="h-3.5 w-3.5" />
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
});