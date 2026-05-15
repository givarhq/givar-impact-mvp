'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import {
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    CheckCircle2,
    Check,
    Camera,
    ArrowUpRight,
    ShieldAlert
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';
import Link from 'next/link';

interface EvidenceQueueTableProps {
    proofs: any[];
}

export const EvidenceQueueTable = memo(function EvidenceQueueTable({ proofs }: EvidenceQueueTableProps) {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; items: LightboxItem[]; index: number }>({ isOpen: false, items: [], index: 0 });

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (proofs.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
                <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 tracking-widest">No Pending Evidence</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">All submitted impact proofs have been audited.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2.5 md:hidden min-w-0">
                <AnimatePresence mode="popLayout">
                    {proofs.map((proof) => {
                        const isExpanded = expandedId === proof.id;
                        const isHandled = proof.status !== 'PENDING';

                        // Logic: Extract deliverables from the timeline to create the rich stage name
                        const timeline = Array.isArray(proof.project?.executionTimeline) ? proof.project.executionTimeline : [];
                        const milestone = timeline.find((m: any) => m.id === proof.milestoneId);
                        const displayPhase = milestone?.deliverables ? `${proof.phaseName}: ${milestone.deliverables}` : proof.phaseName;

                        return (
                            <motion.div
                                key={proof.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="min-w-0"
                            >
                                <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card min-w-0">
                                    <CardContent className="p-0 min-w-0">
                                        <button
                                            onClick={() => toggleExpand(proof.id)}
                                            className={cn(
                                                "w-full p-5 flex items-center justify-between gap-4 text-left active:bg-muted/50 transition-colors min-w-0",
                                                isHandled && !isExpanded && "opacity-60"
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-foreground truncate">{proof.project.title}</p>
                                                <div className="flex items-center gap-2 mt-2 min-w-0">
                                                    <Badge variant="outline" className="text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-3xl border-primary/20 bg-primary/5 text-primary shadow-none truncate max-w-[150px]">
                                                        Phase: {displayPhase}
                                                    </Badge>
                                                    {isHandled && (
                                                        <span className={cn("text-[10px] font-black italic shrink-0", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                            {proof.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-5 pb-5 space-y-5 overflow-hidden min-w-0"
                                                >
                                                    <div className="pt-4 border-t border-border/40 space-y-4 min-w-0">
                                                        <div className="space-y-1.5 min-w-0">
                                                            <p className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Organizer Statement</p>
                                                            <p className="text-xs font-medium leading-relaxed italic text-foreground/80 break-words">&quot;{proof.description}&quot;</p>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 min-w-0">
                                                            {proof.imageUrls?.map((url: string, i: number) => (
                                                                <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxState({ isOpen: true, items: proof.imageUrls.map((u: string) => ({ url: u, type: 'IMAGE' })), index: i }); }} className="aspect-square rounded-2xl overflow-hidden border border-border/40 bg-muted shadow-inner active:scale-95 transition-transform relative">
                                                                    <Image src={url} fill sizes="(max-width: 768px) 33vw, 20vw" className="object-cover" alt="Impact Proof" />
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="pt-3 min-w-0">
                                                            <Link href={`/admin/projects/${proof.project.id}/edit?tab=execution`} className="block w-full">
                                                                <Button className="w-full h-11 rounded-3xl text-xs font-bold shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]">
                                                                    <ArrowUpRight className="h-4 w-4 mr-2" /> Open Project Terminal
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* DESKTOP: Queue Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                <div className="overflow-x-auto no-scrollbar min-w-0">
                    <table className="w-full text-sm text-left border-collapse min-w-0">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                            <tr>
                                <th className="px-7 py-4 w-12 shrink-0"></th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px] uppercase">Cause & Execution Phase</th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px] uppercase text-center">Date Submitted</th>
                                <th className="px-7 py-4 font-bold tracking-widest text-[10px] uppercase text-right">Visual Assets</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 min-w-0">
                            {proofs.map((proof) => {
                                const isExpanded = expandedId === proof.id;
                                const isHandled = proof.status !== 'PENDING';

                                // Logic: Extract deliverables from the timeline to create the rich stage name
                                const timeline = Array.isArray(proof.project?.executionTimeline) ? proof.project.executionTimeline : [];
                                const milestone = timeline.find((m: any) => m.id === proof.milestoneId);
                                const displayPhase = milestone?.deliverables ? `${proof.phaseName}: ${milestone.deliverables}` : proof.phaseName;

                                return (
                                    <React.Fragment key={proof.id}>
                                        <tr
                                            onClick={() => toggleExpand(proof.id)}
                                            className={cn(
                                                "transition-colors cursor-pointer hover:bg-muted/20 group min-w-0",
                                                isHandled && !isExpanded && "opacity-60",
                                                isExpanded && "bg-primary/[0.01]"
                                            )}
                                        >
                                            <td className="px-7 py-5 shrink-0">
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                                            </td>
                                            <td className="px-7 py-5 min-w-0">
                                                <div className="space-y-1 min-w-0">
                                                    <p className="font-bold text-foreground text-sm leading-tight truncate group-hover:text-primary transition-colors">{proof.project.title}</p>
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Badge variant="outline" className="text-[10px] font-bold tracking-tight px-2.5 py-0.5 rounded-3xl border-primary/20 bg-primary/5 text-primary shadow-none truncate max-w-[250px]">
                                                            Phase: {displayPhase}
                                                        </Badge>
                                                        {isHandled && (
                                                            <span className={cn("text-[10px] font-black italic shrink-0", proof.status === 'APPROVED' ? "text-emerald-600" : "text-destructive")}>
                                                                {proof.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-7 py-5 text-center shrink-0">
                                                <p className="text-xs font-bold text-foreground tabular-nums">{formatDate(proof.submittedAt).split(',')[0]}</p>
                                            </td>
                                            <td className="px-7 py-5 text-right shrink-0">
                                                <Badge variant="secondary" className="rounded-3xl font-black text-[9px] px-3 py-1 bg-muted/60 border-border/40 shadow-inner tracking-wider">
                                                    {proof.imageKeys.length} Files
                                                </Badge>
                                            </td>
                                        </tr>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={4} className="p-0 border-none min-w-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-muted/[0.02] min-w-0"
                                                        >
                                                            <div className="px-14 py-8 border-t border-border/20 min-w-0">
                                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-w-0 items-start">
                                                                    <div className="lg:col-span-8 space-y-6 min-w-0">
                                                                        <div className="space-y-2 min-w-0">
                                                                            <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest flex items-center gap-2 uppercase ml-1">
                                                                                <FileText className="h-3.5 w-3.5" /> Narrative Update
                                                                            </h4>
                                                                            <p className="text-sm text-foreground/90 leading-relaxed font-medium italic border-l-4 border-primary/30 pl-5 py-1.5 break-words">
                                                                                &quot;{proof.description}&quot;
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-3 min-w-0">
                                                                            <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase ml-1">Evidence Assets</h4>
                                                                            <div className="flex flex-wrap gap-2.5 min-w-0">
                                                                                {proof.imageUrls?.map((url: string, i: number) => (
                                                                                    <button key={i} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxState({ isOpen: true, items: proof.imageUrls.map((u: string) => ({ url: u, type: 'IMAGE' })), index: i }); }} className="relative h-20 w-20 rounded-[20px] overflow-hidden border border-border/40 bg-muted hover:ring-4 ring-primary/10 transition-all shadow-md group">
                                                                                        <Image src={url} fill sizes="80px" className="object-cover transition-transform group-hover:scale-110 duration-500" alt="Proof" />
                                                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                            <ExternalLink className="h-5 w-5 text-white" />
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="lg:col-span-4 min-w-0">
                                                                        <div className="p-6 rounded-3xl border border-border/40 bg-card shadow-sm space-y-4 min-w-0 text-center flex flex-col items-center">
                                                                            <div className={cn(
                                                                                "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-inner mb-2",
                                                                                isHandled
                                                                                    ? (proof.status === 'APPROVED' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive")
                                                                                    : "bg-primary/10 border-primary/20 text-primary"
                                                                            )}>
                                                                                {isHandled ? (
                                                                                    proof.status === 'APPROVED' ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />
                                                                                ) : (
                                                                                    <CheckCircle2 className="h-6 w-6" />
                                                                                )}
                                                                            </div>
                                                                            <div className="space-y-1 min-w-0 w-full">
                                                                                <p className="text-[11px] font-black text-muted-foreground tracking-widest uppercase">Admin Verification</p>
                                                                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                                                    {isHandled ? `Decision recorded on ${formatDate(proof.updatedAt).split(',')[0]}` : 'Review this evidence against the project budget and roadmap in the Execution Terminal.'}
                                                                                </p>
                                                                            </div>

                                                                            <Link href={`/admin/projects/${proof.project.id}/edit?tab=execution`} className="block w-full pt-2">
                                                                                <Button className="w-full h-11 rounded-3xl font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-0 transition-all active:scale-[0.98] min-w-0 truncate gap-2">
                                                                                    Review Project <ArrowUpRight className="h-4 w-4" />
                                                                                </Button>
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
                initialIndex={lightboxState.index}
            />
        </div>
    );
});