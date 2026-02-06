'use client';

import React, { useState } from 'react';
import {
    Share2, MapPin, Calendar, CheckCircle2, Clock,
    BadgeCheck, ShieldCheck, DollarSign, Briefcase,
    AlertTriangle, ChevronRight, Target, Image as ImageIcon,
    Heart, Check, FileText, Megaphone, RefreshCcw
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

interface ProjectDetailsClientProps {
    project: ProjectWithDetails;
    isPublic?: boolean;
}

export function ProjectDetailsClient({ project, isPublic = false }: ProjectDetailsClientProps) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const donateLink = isPublic
        ? `/explore/${project.slug}/donate`
        : `/dashboard/impact/${project.slug}/donate`;

    const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    const gallery = Array.isArray(project.gallery) ? project.gallery : [];

    const raised = Number(project.raisedAmount || 0);
    const target = Number(project.targetAmount || 0);
    const isFunded = (raised >= target && target > 0) || project.status === 'FUNDED' || project.status === 'COMPLETED';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">

            {/* LEFT COLUMN: Content */}
            <div className="lg:col-span-2 space-y-8">

                {/* Header Metadata */}
                <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="rounded-lg font-bold text-[10px] tracking-wide px-2 py-1">
                            {project.category?.name || 'General Impact'}
                        </Badge>
                        {project.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="rounded-lg bg-background/50 text-[10px] font-medium">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground leading-tight">
                        {project.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                        {project.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary" /> {project.location}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" /> Established {formatDate(project.createdAt).split(',')[0]}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-primary" /> Goal: {formatCurrency(project.targetAmount, project.currency)}
                        </div>
                    </div>
                </div>

                {/* Media Section */}
                <div className="space-y-4">
                    <div className="relative aspect-video w-full rounded-[32px] overflow-hidden border border-border/50 bg-muted shadow-lg">
                        {project.imageUrl ? (
                            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/20">
                                <span className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Pending Visuals</span>
                            </div>
                        )}
                    </div>

                    {gallery.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {gallery.map((item: MediaItem, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => window.open(item.url, '_blank')}
                                    className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 bg-muted hover:ring-2 hover:ring-primary/50 transition-all group"
                                >
                                    <img src={item.url} alt={item.caption || `Gallery ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    {item.type === 'VIDEO' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center text-primary shadow-sm">
                                                <ChevronRight className="h-3 w-3 fill-current ml-0.5" />
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
                    <TabsList className="w-full justify-start h-auto p-1.5 bg-muted/50 border border-border/40 rounded-2xl overflow-x-auto no-scrollbar">
                        <TabsTrigger value="story" className="rounded-xl px-8 py-2.5 text-xs font-bold data-[state=active]:shadow-md">Story</TabsTrigger>
                        <TabsTrigger value="plan" className="rounded-xl px-8 py-2.5 text-xs font-bold data-[state=active]:shadow-md">Execution Plan</TabsTrigger>
                        <TabsTrigger value="updates" className="rounded-xl px-8 py-2.5 text-xs font-bold data-[state=active]:shadow-md">
                            Updates
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">
                                {project.updates?.length || 0}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: STORY */}
                    <TabsContent value="story" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none outline-none">
                        <div className="space-y-10">
                            {project.shortDesc && (
                                <p className="text-foreground/90 text-xl font-medium leading-relaxed italic border-l-4 border-primary/40 pl-8 py-2">
                                    {project.shortDesc}
                                </p>
                            )}

                            <div
                                className={cn(
                                    "prose prose-sm md:prose-base dark:prose-invert max-w-none",
                                    "prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4",
                                    "prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-6",
                                    "prose-strong:text-foreground prose-strong:font-bold",
                                    "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:mb-2",
                                    "prose-hr:border-border/50"
                                )}
                                dangerouslySetInnerHTML={{ __html: project.description }}
                            />
                        </div>

                        {project.riskAnalysis && (
                            <div className="mt-12 p-6 rounded-[28px] bg-amber-500/[0.03] border border-amber-500/10">
                                <h4 className="text-[10px] font-black tracking-[0.2em] text-amber-600 dark:text-amber-500 flex items-center gap-2 mb-4 uppercase">
                                    <AlertTriangle className="h-4 w-4" /> Risk Assessment & Mitigation
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    {project.riskAnalysis}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* TAB: PLAN */}
                    <TabsContent value="plan" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none outline-none space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-black tracking-widest text-foreground uppercase">Financial Breakdown</h4>
                            </div>
                            <div className="rounded-[24px] border border-border/60 bg-card shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/40 border-b border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5">Expense Item</th>
                                            <th className="px-6 py-5 hidden md:table-cell">Type</th>
                                            <th className="px-8 py-5 text-right">Allocation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 text-sm">
                                        {budget.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-8 py-5 font-bold text-foreground">
                                                    {item.item}
                                                    <div className="md:hidden text-[10px] text-muted-foreground font-bold uppercase mt-1">{item.type}</div>
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell text-muted-foreground font-medium uppercase text-[10px] tracking-tight">{item.type}</td>
                                                <td className="px-8 py-5 text-right font-black tabular-nums text-foreground">
                                                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: project.currency }).format(item.cost)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Briefcase className="h-4 w-4" />
                                </div>
                                <h4 className="text-sm font-black tracking-widest text-foreground uppercase">Implementation Roadmap</h4>
                            </div>
                            <div className="grid gap-4">
                                {timeline.map((phase: any, i: number) => {
                                    const isCompleted = phase.status === 'COMPLETED';
                                    const isInProgress = phase.status === 'IN_PROGRESS';

                                    return (
                                        <div key={i} className="flex gap-6 group relative">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500 z-10 bg-background",
                                                    isCompleted ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" :
                                                        isInProgress ? "border-primary text-primary animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
                                                            "border-border text-muted-foreground"
                                                )}>
                                                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-black">{i + 1}</span>}
                                                </div>
                                                <div className={cn(
                                                    "flex-1 w-0.5 group-last:hidden mt-3 mb-1 transition-colors duration-500",
                                                    isCompleted ? "bg-primary" : "bg-border/60"
                                                )} />
                                            </div>
                                            <div className="flex-1 pb-10 space-y-2 min-w-0">
                                                <div className="flex justify-between items-baseline gap-4">
                                                    <h5 className={cn("font-black text-sm uppercase tracking-tight", isCompleted || isInProgress ? "text-foreground" : "text-muted-foreground")}>
                                                        {phase.phase}
                                                    </h5>
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className={cn(
                                                            "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border",
                                                            isCompleted ? 'Verified Complete' : phase.estimatedDate
                                                        )}>
                                                            {isCompleted ? 'Verified Complete' : phase.estimatedDate}
                                                        </span>
                                                        {isCompleted && phase.completedAt && (
                                                            <span className="text-[7px] font-medium text-muted-foreground opacity-70 italic">
                                                                {new Date(phase.completedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                                                    {phase.deliverables}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB: UPDATES */}
                    <TabsContent value="updates" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none outline-none">
                        <div className="space-y-6">
                            {project.updates && project.updates.length > 0 ? (
                                project.updates.map((update, idx) => {
                                    const isAdjustment = update.title === 'Financial Goal Adjusted';
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "relative flex flex-col gap-5 p-8 rounded-[32px] border shadow-sm hover:shadow-xl transition-all group",
                                                isAdjustment ? "bg-amber-500/[0.03] border-amber-500/20" : "bg-card border-border/60"
                                            )}
                                        >
                                            {update.imageUrl && (
                                                <div className="w-full aspect-[21/9] rounded-[24px] overflow-hidden mb-2 bg-muted border border-border/50">
                                                    <img src={update.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={update.title} />
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={cn("h-5 px-2 rounded-md text-[9px] font-black uppercase tracking-tighter border-0", isAdjustment ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary")}>
                                                            {isAdjustment ? 'LEDGER AMENDMENT' : update.type.replace('_', ' ')}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] flex items-center gap-1.5">
                                                            <Clock className="h-3 w-3" /> {formatDate(update.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h4 className={cn("text-xl font-black tracking-tight", isAdjustment ? "text-amber-800" : "text-foreground")}>{update.title}</h4>
                                                </div>
                                                {isAdjustment && <RefreshCcw className="h-5 w-5 text-amber-500 shrink-0" />}
                                            </div>

                                            <p className={cn("text-sm leading-relaxed font-medium", isAdjustment ? "text-amber-900/70" : "text-muted-foreground")}>{update.content}</p>

                                            <div className="flex items-center gap-2 mt-2 pt-6 border-t border-border/40 text-[9px] font-black uppercase tracking-[0.2em]">
                                                {isAdjustment ? (
                                                    <span className="text-amber-600 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Audit Verified Modification</span>
                                                ) : update.type === 'MILESTONE' ? (
                                                    <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Forensic Impact Entry</span>
                                                ) : (
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><Megaphone className="h-4 w-4" /> Project Announcement</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-24 border-2 border-dashed border-border/60 rounded-[40px] bg-muted/5">
                                    <Clock className="h-16 w-16 mx-auto text-muted-foreground opacity-10 mb-4" />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">No activity logged</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* RIGHT COLUMN: Sidebar */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                    <TransparencyCard project={project} />

                    <div className="space-y-4">
                        {isFunded ? (
                            <Button size="lg" disabled className="w-full h-16 text-lg font-black rounded-[24px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 opacity-100 cursor-default shadow-none">
                                <Check className="mr-2 h-6 w-6" /> Mission Funded
                            </Button>
                        ) : (
                            <Link href={donateLink} className="block w-full">
                                <Button size="lg" className="w-full h-16 text-lg font-black shadow-2xl shadow-primary/30 rounded-[24px] bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all">
                                    Fund this Impact
                                </Button>
                            </Link>
                        )}

                        <Button variant="outline" className="w-full h-14 rounded-2xl border-border/60 text-foreground font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-muted active:scale-95" onClick={() => setIsShareModalOpen(true)}>
                            <Share2 className="mr-2 h-4 w-4" /> Share Cause
                        </Button>
                    </div>

                    {/* Organizer Identity */}
                    <div className={cn(
                        "rounded-[32px] border p-6 flex flex-col gap-5 transition-all relative overflow-hidden",
                        project.isVerifiedOrganizer ? "bg-primary/[0.03] border-primary/20 shadow-sm" : "bg-card border-border/50"
                    )}>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={cn(
                                "h-14 w-14 rounded-[18px] flex items-center justify-center text-white font-black text-xl shadow-inner",
                                project.isVerifiedOrganizer ? "bg-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {project.organizerName === 'Givar' ? <Heart className="h-7 w-7 fill-current" /> : project.organizerName?.[0] || 'O'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">Registered Entity</p>
                                    {project.isVerifiedOrganizer && <BadgeCheck className="h-4 w-4 text-primary" />}
                                </div>
                                <p className="font-black text-foreground truncate text-lg leading-tight uppercase tracking-tight">
                                    {project.organizerName}
                                </p>
                            </div>
                        </div>

                        <div className="pt-5 border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest">
                                <ShieldCheck className="h-4 w-4" />
                                {project.organizerName === 'Givar' ? 'Official Platform Node' : 'Audit-Verified Identity'}
                            </div>
                            {project.organizerName !== 'Givar' && (
                                <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                    Profile
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-muted/20 rounded-[28px] border border-border/50 flex items-start gap-4">
                        <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                            <strong className="text-foreground">Givar protocol:</strong> funds are strictly released in tranches only after audit nodes verify proof of work.
                        </p>
                    </div>
                </div>
            </div>

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} projectTitle={project.title} projectSlug={project.slug} />
        </div>
    );
}