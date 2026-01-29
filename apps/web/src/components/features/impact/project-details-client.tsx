'use client';

import React, { useState } from 'react';
import { 
  Share2, MapPin, Calendar, CheckCircle2, Clock, 
  BadgeCheck, ShieldCheck, DollarSign, Briefcase, 
  AlertTriangle, ChevronRight, Target, Image as ImageIcon,
  Heart
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
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
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
            {/* Main Hero */}
            <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-border/50 bg-muted shadow-lg">
                {project.imageUrl ? (
                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/20">
                        <span className="text-[10px] font-bold tracking-widest opacity-40 uppercase">Pending Visuals</span>
                    </div>
                )}
            </div>

            {/* SOTA: Secondary Gallery Grid */}
            {gallery.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {gallery.map((item: MediaItem, i: number) => (
                        <button 
                            key={i} 
                            onClick={() => window.open(item.url, '_blank')}
                            className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted hover:ring-2 hover:ring-primary/50 transition-all group"
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
            <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border/50 rounded-2xl overflow-x-auto no-scrollbar">
                <TabsTrigger value="story" className="rounded-xl px-6 py-2.5 text-xs font-bold">Story</TabsTrigger>
                <TabsTrigger value="plan" className="rounded-xl px-6 py-2.5 text-xs font-bold">Execution Plan</TabsTrigger>
                <TabsTrigger value="updates" className="rounded-xl px-6 py-2.5 text-xs font-bold">
                    Updates 
                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">
                        {project.updates?.length || 0}
                    </span>
                </TabsTrigger>
            </TabsList>

            {/* TAB: STORY */}
            <TabsContent value="story" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none">
                <div className="space-y-6">
                    <p className="text-foreground/80 text-lg font-light leading-relaxed italic border-l-2 border-primary/30 pl-6 py-1">
                        {project.shortDesc}
                    </p>
                    <div className="text-foreground/90 leading-relaxed text-sm font-normal whitespace-pre-line">
                        {project.description}
                    </div>
                </div>
                
                {project.riskAnalysis && (
                   <div className="mt-10 p-5 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10">
                       <h4 className="text-[10px] font-bold tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-2 mb-3 uppercase">
                           <AlertTriangle className="h-3.5 w-3.5" /> Risk Analysis
                       </h4>
                       <p className="text-xs text-muted-foreground leading-relaxed italic">
                           {project.riskAnalysis}
                       </p>
                   </div>
                )}
            </TabsContent>

            {/* TAB: PLAN */}
            <TabsContent value="plan" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none space-y-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">Financial Breakdown</h4>
                    </div>
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Type</th>
                                    <th className="px-6 py-4 text-right">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-xs">
                                {budget.map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {item.item}
                                            <div className="md:hidden text-[10px] text-muted-foreground font-normal mt-0.5">{item.type}</div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground font-normal lowercase">{item.type}</td>
                                        <td className="px-6 py-4 text-right font-bold tabular-nums text-foreground">
                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: project.currency }).format(item.cost)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold tracking-widest text-foreground uppercase">Implementation Roadmap</h4>
                    </div>
                    <div className="grid gap-3">
                        {timeline.map((phase: any, i: number) => (
                            <div key={i} className="flex gap-5 group">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px]">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 w-px bg-border group-last:hidden mt-2" />
                                </div>
                                <div className="flex-1 pb-6 space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <h5 className="font-bold text-foreground text-xs">{phase.phase}</h5>
                                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{phase.estimatedDate}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{phase.deliverables}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </TabsContent>

            {/* TAB: UPDATES */}
            <TabsContent value="updates" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 focus-visible:outline-none">
                <div className="space-y-5">
                    {project.updates && project.updates.length > 0 ? (
                        project.updates.map((update, idx) => (
                           <div key={idx} className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                               <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{formatDate(update.createdAt)}</span>
                               <h4 className="text-lg font-bold mt-1 text-foreground">{update.title}</h4>
                               <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{update.content}</p>
                           </div>
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-muted/10">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Awaiting first milestone update</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT COLUMN: Action & Trust Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            
            <TransparencyCard project={project} />

            <div className="space-y-3">
                <Link href={donateLink} className="block w-full">
                  <Button 
                      size="lg" 
                      className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 rounded-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95"
                  >
                      Donate Now
                  </Button>
                </Link>
                
                <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-border text-foreground font-semibold text-xs transition-all active:scale-95"
                    onClick={() => setIsShareModalOpen(true)}
                >
                    <Share2 className="mr-2 h-4 w-4" /> Share Cause
                </Button>
            </div>

            {/* Organizer Trust Module */}
            <div className={cn(
              "rounded-3xl border p-5 flex flex-col gap-4 transition-all relative overflow-hidden",
              project.isVerifiedOrganizer ? "bg-primary/[0.02] border-primary/20 shadow-sm" : "bg-card border-border/50"
            )}>
                <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner",
                      project.isVerifiedOrganizer ? "bg-primary" : "bg-muted text-muted-foreground"
                    )}>
                        {project.organizerName === 'Givar' ? (
                            <Heart className="h-6 w-6 fill-current" />
                        ) : (
                            project.organizerName?.[0] || 'O'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">organizer</p>
                          {project.isVerifiedOrganizer && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                          )}
                        </div>
                        <p className="font-bold text-foreground truncate text-base leading-tight">
                            {project.organizerName}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary">
                        {project.organizerName === 'Givar' ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-tight">
                            {project.organizerName === 'Givar' ? 'official platform project' : 'verified legal entity'}
                        </p>
                    </div>
                    {project.organizerName !== 'Givar' && (
                        <button className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            profile <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    <strong>givar protection:</strong> funds are released in strictly audited tranches based on the execution roadmap.
                </p>
            </div>
        </div>
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} projectTitle={project.title} projectSlug={project.slug} />
    </div>
  );
}