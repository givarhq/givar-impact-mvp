'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import {
    Share2, MapPin, Calendar,
    BadgeCheck, ShieldCheck, DollarSign, Briefcase,
    AlertTriangle, ChevronRight, Target,
    Heart, Check, UserCheck,
    RefreshCcw,
    Clock,
    CheckCircle2,
    Landmark
} from 'lucide-react';
import Link from 'next/link';
import { ProjectWithDetails } from '../../../types';
import { MediaItem } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { TransparencyCard } from './transparency-card';
import { ShareModal } from './share-modal';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';

interface ProjectDetailsClientProps {
    project: ProjectWithDetails;
    isPublic?: boolean;
}

export const ProjectDetailsClient = memo(function ProjectDetailsClient({ project, isPublic = false }: ProjectDetailsClientProps) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const donateLink = isPublic
        ? `/explore/${project.slug}/donate`
        : `/dashboard/impact/${project.slug}/donate`;

    const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    const gallery = Array.isArray(project.gallery) ? project.gallery : [];

    const raised = Number(project.raisedAmount || 0);
    const target = Number(project.targetAmount || 0);
    const percent = target > 0 ? Math.min(100, Math.floor((raised / target) * 100)) : 0;

    const isCompleted = project.status === 'COMPLETED';
    const isFundedState = project.status === 'FUNDED' || (raised >= target && target > 0 && !isCompleted);

    const isMedical = project.category?.name?.toLowerCase() === 'medical' || project.categoryName?.toLowerCase() === 'medical';
    const completedText = isMedical ? 'Treatment Completed' : 'Impact Achieved';

    const getVerificationMeta = () => {
        if (project.organizerType === 'SYSTEM' || project.organizerName === 'Givar') {
            return { label: 'Givar Team', icon: BadgeCheck, color: 'text-primary', badgeStyle: 'bg-primary/10 text-primary border-primary/20' };
        }
        if (project.organizerType === 'ORGANIZATION') {
            return { label: 'Verified Organization', icon: ShieldCheck, color: 'text-blue-600', badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        return { label: 'Verified Advocate', icon: UserCheck, color: 'text-emerald-600', badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    const verMeta = getVerificationMeta();
    const VerIcon = verMeta.icon;

    const finalUpdate = project.updates?.find(u => u.type === 'IMPACT_ACHIEVED' || u.type === 'IMPACT_REPORT');

    const formatUpdateType = (type: string) => {
        return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-32 md:pb-20"
        >

            {/* LEFT COLUMN: Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">

                {/* Header Metadata */}
                <div className="space-y-2.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="rounded-3xl font-bold text-xs px-3 py-1 border-none bg-muted">
                            {project.category?.name || 'General impact'}
                        </Badge>

                        {project.isVerifiedOrganizer && (
                            <Badge variant="outline" className={cn("rounded-3xl font-bold text-xs px-3 py-1 border gap-1.5", verMeta.badgeStyle)}>
                                <VerIcon className="h-3 w-3" /> {verMeta.label}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {project.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
                        {project.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary" /> {project.location}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" /> {formatDate(project.createdAt).split(',')[0]}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-primary" /> Goal: {formatCurrency(project.targetAmount, project.currency)}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isCompleted && finalUpdate && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: 20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            className="pt-2"
                        >
                            <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.03] shadow-sm overflow-hidden">
                                <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 py-4 px-6 flex flex-row items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-sm font-bold text-emerald-800">{completedText}</CardTitle>
                                        <p className="text-[11px] text-emerald-700/80 font-bold">Final evidence and verification report</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-emerald-950 dark:text-emerald-50 leading-tight">{finalUpdate.title}</h4>
                                            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed font-medium">
                                                {finalUpdate.content}
                                            </p>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-full border border-emerald-500/20">
                                                <ShieldCheck className="h-4 w-4" /> Verified by Givar Audit
                                            </div>
                                        </div>
                                        {finalUpdate.imageUrl && (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/20 shadow-md bg-muted">
                                                <Image src={finalUpdate.imageUrl} alt="Impact Evidence" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Media Section */}
                <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-border/40 bg-muted shadow-sm">
                        {project.imageUrl ? (
                            <Image
                                src={project.imageUrl}
                                alt={project.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 66vw"
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/10">
                                <span className="text-xs font-bold opacity-40">Pending visuals</span>
                            </div>
                        )}
                    </div>

                    {gallery.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {gallery.map((item: MediaItem, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => window.open(item.url, '_blank')}
                                    className="relative aspect-square rounded-3xl overflow-hidden border border-border/40 bg-muted hover:ring-2 hover:ring-primary/40 transition-all group active:scale-95"
                                >
                                    <Image
                                        src={item.url}
                                        alt={item.caption || `Gallery ${i}`}
                                        fill
                                        sizes="(max-width: 768px) 25vw, 16vw"
                                        className="object-cover transition-transform group-hover:scale-110"
                                    />
                                    {item.type === 'VIDEO' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="h-6 w-6 rounded-3xl bg-white/90 flex items-center justify-center text-primary shadow-sm">
                                                <ChevronRight className="h-3.5 w-3.5 fill-current ml-0.5" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation Tabs */}
                <Tabs defaultValue="story" className="w-full">
                    <TabsList className="w-full h-11 p-1 bg-muted/50 border border-border/40 rounded-3xl overflow-x-auto no-scrollbar">
                        <TabsTrigger value="story" className="flex-1 rounded-3xl px-2 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Story</TabsTrigger>
                        <TabsTrigger value="plan" className="flex-1 rounded-3xl px-2 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Use of Funds</TabsTrigger>
                        <TabsTrigger value="updates" className="flex-1 rounded-3xl px-2 h-full text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Updates
                            <span className="ml-2 px-1.5 py-0.5 rounded-3xl bg-primary/10 text-primary text-[11px] font-bold">
                                {project.updates?.length || 0}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <AnimatePresence mode="wait">
                        <TabsContent value="story" className="mt-6 outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {project.shortDesc && (
                                    <p className="text-foreground/90 text-md font-medium leading-relaxed italic border-l-4 border-primary/30 pl-6 py-1">
                                        {project.shortDesc}
                                    </p>
                                )}

                                <div
                                    className={cn(
                                        "text-sm text-foreground/80 leading-relaxed max-w-none break-words",
                                        "[&_h2]:font-bold [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-3",
                                        "[&_h3]:font-bold [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2",
                                        "[&_p]:mb-4 [&_p]:last:mb-0",
                                        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:text-foreground/80 [&_ul_li::marker]:text-primary/70",
                                        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 [&_ol]:text-foreground/80",
                                        "[&_li]:pl-1",
                                        "[&_strong]:font-bold [&_strong]:text-foreground",
                                        "[&_em]:italic",
                                        "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors",
                                        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/[0.02] [&_blockquote]:rounded-r-xl",
                                        "[&_hr]:border-border/40 [&_hr]:my-6"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: project.description }}
                                />

                                {project.riskAnalysis && (
                                    <div className="mt-8 p-5 rounded-3xl bg-amber-50 border border-amber-100">
                                        <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
                                            <AlertTriangle className="h-4 w-4" /> Additional Notes
                                        </h4>
                                        <div
                                            className={cn(
                                                "text-xs text-amber-900/80 leading-relaxed break-words font-medium whitespace-pre-line",
                                                "[&_p]:mb-2 [&_p]:last:mb-0",
                                                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:space-y-1",
                                                "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:space-y-1",
                                                "[&_li]:pl-1",
                                                "[&_strong]:font-bold [&_strong]:text-amber-950",
                                                "[&_em]:italic"
                                            )}
                                            dangerouslySetInnerHTML={{ __html: project.riskAnalysis }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="plan" className="mt-6 outline-none space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* NEW: Pre-Collected Funds Note */}
                                {project.hasPreCollectedFunds && project.preCollectedAmount && (
                                    <div className="mb-8 p-5 rounded-3xl bg-blue-50/50 border border-blue-100 shadow-sm">
                                        <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-1">
                                            <Landmark className="h-4 w-4" /> Previously Raised Funds
                                        </h4>
                                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                            This cause has already raised <span className="font-bold">{formatCurrency(project.preCollectedAmount, project.currency)}</span> externally.
                                            {project.preCollectedVerified && " These funds have been verified by Givar."}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                            <DollarSign className="h-4 w-4" />
                                        </div>
                                        <h4 className="text-xs font-bold text-foreground">Verified Cost Breakdown</h4>
                                    </div>
                                    <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-muted/40 border-b border-border/40 text-[11px] font-bold text-muted-foreground">
                                                <tr>
                                                    <th className="px-6 py-4">Item</th>
                                                    <th className="px-6 py-4 hidden md:table-cell">Type</th>
                                                    <th className="px-6 py-4 text-right">Allocation</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40 text-xs">
                                                {budget.map((item: any, i: number) => (
                                                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-foreground">
                                                            {item.description || item.item}
                                                            <div className="md:hidden text-[11px] text-muted-foreground font-medium mt-0.5">{item.costType || item.type}</div>
                                                        </td>
                                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground font-medium text-[11px]">{item.costType || item.type}</td>
                                                        <td className="px-6 py-4 text-right font-bold tabular-nums text-foreground">
                                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: project.currency }).format(item.amount || item.cost || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {timeline.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                                <Briefcase className="h-4 w-4" />
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground">Implementation roadmap</h4>
                                        </div>
                                        <div className="grid gap-3">
                                            {timeline.map((phase: any, i: number) => {
                                                const isCompletedPhase = phase.status === 'COMPLETED';
                                                const isInProgress = phase.status === 'IN_PROGRESS';

                                                return (
                                                    <div key={i} className="flex gap-4 group relative">
                                                        <div className="flex flex-col items-center shrink-0">
                                                            <div className={cn(
                                                                "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 bg-background",
                                                                isCompletedPhase ? "bg-primary border-primary text-primary-foreground shadow-sm" :
                                                                    isInProgress ? "border-primary text-primary animate-pulse" :
                                                                        "border-border text-muted-foreground"
                                                            )}>
                                                                {isCompletedPhase ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                                            </div>
                                                            <div className={cn(
                                                                "flex-1 w-0.5 group-last:hidden mt-2 mb-0.5 transition-colors",
                                                                isCompletedPhase ? "bg-primary" : "bg-border/40"
                                                            )} />
                                                        </div>
                                                        <div className="flex-1 pb-6 space-y-1 min-w-0">
                                                            <div className="flex justify-between items-baseline gap-4">
                                                                <h5 className={cn("font-bold text-sm", isCompletedPhase || isInProgress ? "text-foreground" : "text-muted-foreground")}>
                                                                    {phase.phase}
                                                                </h5>
                                                                <div className="flex flex-col items-end shrink-0">
                                                                    <span className={cn(
                                                                        "text-[11px] font-bold px-2 py-0.5 rounded-3xl border",
                                                                        isCompletedPhase ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-muted/50 border-border/40'
                                                                    )}>
                                                                        {isCompletedPhase ? 'Complete' : phase.estimatedDate}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                                                                {phase.deliverables}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="updates" className="mt-6 outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {project.updates && project.updates.length > 0 ? (
                                    project.updates.map((update, idx) => {
                                        const isAdjustment = update.type === 'GOAL_ADJUSTMENT' || update.title === 'Financial Goal Adjusted';
                                        const isImpact = update.type === 'IMPACT_ACHIEVED';
                                        return (
                                            <Card
                                                key={idx}
                                                className={cn(
                                                    "relative flex flex-col gap-4 p-5 md:p-6 rounded-3xl border shadow-sm transition-all",
                                                    isAdjustment ? "bg-amber-50 border-amber-100" : isImpact ? "bg-emerald-50 border-emerald-100" : "bg-card border-border/40"
                                                )}
                                            >
                                                {update.imageUrl && (
                                                    <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-muted border border-border/10 shadow-inner">
                                                        <Image
                                                            src={update.imageUrl}
                                                            alt=""
                                                            fill
                                                            sizes="(max-width: 1024px) 100vw, 66vw"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <Badge className={cn("h-5 px-2 rounded-3xl text-[10px] font-bold border-none",
                                                                isAdjustment ? "bg-amber-500/10 text-amber-700" :
                                                                    isImpact ? "bg-emerald-500/10 text-emerald-700" :
                                                                        "bg-primary/10 text-primary")}>
                                                                {isAdjustment ? 'Amendment' : formatUpdateType(update.type)}
                                                            </Badge>
                                                            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> {formatDate(update.createdAt).split(',')[0]}
                                                            </span>
                                                        </div>
                                                        <h4 className={cn("text-lg font-bold", isAdjustment ? "text-amber-900" : isImpact ? "text-emerald-900" : "text-foreground")}>{update.title}</h4>
                                                    </div>
                                                    {isAdjustment && <RefreshCcw className="h-4 w-4 text-amber-500 shrink-0" />}
                                                    {isImpact && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                                </div>

                                                <p className={cn("text-xs leading-relaxed font-medium", isAdjustment ? "text-amber-900/80" : isImpact ? "text-emerald-900/80" : "text-muted-foreground")}>{update.content}</p>

                                                <div className="pt-4 border-t border-border/40 text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <ShieldCheck className={cn("h-3 w-3", isImpact ? "text-emerald-600" : "text-primary")} /> Verified entry
                                                </div>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                                        <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                        <p className="text-xs font-bold text-muted-foreground">No activity logged</p>
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>
                    </AnimatePresence>
                </Tabs>
            </div>

            {/* RIGHT COLUMN: Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-20 space-y-4 md:space-y-6">
                    <TransparencyCard project={project} />

                    <div className="space-y-3 hidden md:block">
                        {isCompleted ? (
                            <Button size="lg" disabled className="w-full h-12 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-100 cursor-default shadow-none font-bold text-sm">
                                <Check className="mr-2 h-4 w-4" /> {completedText}
                            </Button>
                        ) : isFundedState ? (
                            <Button size="lg" disabled className="w-full h-12 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-100 cursor-default shadow-none font-bold text-sm">
                                <Check className="mr-2 h-4 w-4" /> Goal Reached
                            </Button>
                        ) : (
                            <Link href={donateLink} className="block w-full">
                                <Button size="lg" className="w-full h-12 rounded-3xl bg-primary text-white hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95">
                                    Fund this impact
                                </Button>
                            </Link>
                        )}

                        <Button variant="outline" className="w-full h-11 rounded-3xl border-border/60 text-foreground font-bold text-xs gap-2 hover:bg-muted transition-all active:scale-95" onClick={() => setIsShareModalOpen(true)}>
                            <Share2 className="h-4 w-4" /> Share cause
                        </Button>
                    </div>

                    {/* Organizer Identity Card */}
                    <Card className={cn(
                        "rounded-3xl border p-5 flex flex-col gap-4 transition-all relative overflow-hidden shadow-sm",
                        project.isVerifiedOrganizer ? "border-primary/20 bg-primary/5" : "bg-card border-border/40"
                    )}>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={cn(
                                "h-11 w-11 rounded-3xl flex items-center justify-center text-white font-bold text-lg shrink-0",
                                project.isVerifiedOrganizer ? "bg-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {project.organizerName === 'Givar' ? <Heart className="h-5 w-5 fill-current" /> : project.organizerName?.[0] || 'O'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <p className="text-[11px] text-muted-foreground font-bold">Entity</p>
                                    {project.isVerifiedOrganizer && <BadgeCheck className="h-3 w-3 text-primary" />}
                                </div>
                                <p className="font-bold text-foreground truncate text-sm">
                                    {project.organizerName}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                            <div className={cn("flex items-center gap-1.5 font-bold text-[11px]", verMeta.color)}>
                                <VerIcon className="h-3.5 w-3.5" />
                                {verMeta.label}
                            </div>
                            {project.organizerType !== 'SYSTEM' && (
                                <button className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                                    Profile
                                </button>
                            )}
                        </div>
                    </Card>

                    {/* Expandable Verification Documents Section */}
                    <details className="bg-card rounded-3xl border border-border/40 group overflow-hidden shadow-sm transition-all">
                        <summary className="p-5 flex items-center justify-between cursor-pointer list-none font-bold text-sm outline-none">
                            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Verification Documents</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="px-5 pb-5 space-y-3">
                            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
                                <span>Submitter Government ID</span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                <span>Beneficiary Identity</span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                <span>Vendor Contact Details</span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                                <span>Supporting Evidence</span>
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            </div>
                        </div>
                    </details>

                    <div className="p-5 bg-muted/20 rounded-3xl border border-border/40 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            <strong className="text-foreground">Givar Protocol:</strong> Funds are released in tranches only after audit exercise verify proof of work.
                        </p>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className={cn(
                "md:hidden fixed left-0 right-0 p-4 z-40 flex items-center gap-3 pointer-events-none",
                isPublic ? "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]" : "bottom-14"
            )}>
                {isCompleted ? (
                    <Button
                        size="lg"
                        disabled
                        className="flex-1 h-12 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-100 cursor-default shadow-none font-bold text-sm pointer-events-auto"
                    >
                        <Check className="mr-2 h-4 w-4" /> {completedText}
                    </Button>
                ) : isFundedState ? (
                    <Button
                        size="lg"
                        disabled
                        className="flex-1 h-12 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-100 cursor-default shadow-none font-bold text-sm pointer-events-auto"
                    >
                        <Check className="mr-2 h-4 w-4" /> Goal Reached
                    </Button>
                ) : (
                    <Link href={donateLink} className="flex-1 block w-full pointer-events-auto">
                        <Button size="lg" className="w-full h-12 rounded-3xl bg-primary text-white hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 border-0">
                            Fund this impact
                        </Button>
                    </Link>
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsShareModalOpen(true)}
                    className="h-12 w-12 rounded-3xl border-border/60 text-foreground shrink-0 bg-background shadow-lg active:scale-95 transition-all pointer-events-auto"
                >
                    <Share2 className="h-5 w-5" />
                </Button>
            </div>

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} projectTitle={project.title} projectSlug={project.slug} />
        </motion.div>
    );
});