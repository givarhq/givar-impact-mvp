'use client';

import React, { useState } from 'react';
import { Share2, MapPin, Calendar, CheckCircle2, Clock, BadgeCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link'; 
import { ProjectWithDetails } from '../../../types'; // SOTA: Use centralized type
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { formatDate } from '../../../lib/utils/format';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Content */}
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="rounded-lg font-bold">
                    {project.category?.name || 'General'}
                </Badge>
                {project.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-lg bg-background/50">
                        {tag}
                    </Badge>
                ))}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground leading-tight">
                {project.title}
            </h1>
            <div className="flex items-center gap-5 text-sm text-muted-foreground font-medium">
                {project.location && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" /> {project.location}
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> Created {formatDate(project.createdAt).split(',')[0]}
                </div>
            </div>
        </div>

        {/* Hero Media Container */}
        <div className="aspect-video w-full rounded-3xl overflow-hidden border border-border/50 bg-muted relative shadow-2xl">
            {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/20">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Visual Assets</span>
                </div>
            )}
        </div>

        {/* Info Tabs */}
        <Tabs defaultValue="story" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border/50 rounded-2xl overflow-x-auto no-scrollbar shadow-sm">
                <TabsTrigger value="story" className="rounded-xl px-8 py-3 text-sm font-bold">Story</TabsTrigger>
                <TabsTrigger value="updates" className="rounded-xl px-8 py-3 text-sm font-bold">
                    Updates 
                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">
                        {project.updates?.length || 0}
                    </span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line leading-relaxed text-foreground/80 text-lg font-light">
                        {project.description}
                    </p>
                </div>
            </TabsContent>

            <TabsContent value="updates" className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-6">
                    {project.updates && project.updates.length > 0 ? (
                        project.updates.map((update, idx) => (
                           <div key={idx} className="p-6 rounded-2xl border border-border bg-card/50">
                               <span className="text-xs font-bold text-primary uppercase">{formatDate(update.createdAt)}</span>
                               <h4 className="text-lg font-bold mt-1">{update.title}</h4>
                               <p className="text-muted-foreground mt-2 text-sm">{update.content}</p>
                           </div>
                        ))
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-border rounded-[32px] bg-muted/10">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground font-medium">Monitoring project milestones...</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT COLUMN: Action & Trust Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            
            {/* Real-time Transparency Tracker */}
            <TransparencyCard project={project} />

            <div className="space-y-3 pt-2">
                <Link href={donateLink} className="block w-full">
                  <Button 
                      size="lg" 
                      className="w-full h-16 text-lg font-black shadow-xl shadow-primary/30 rounded-2xl bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                      Donate Now
                  </Button>
                </Link>
                
                <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-border hover:bg-muted text-foreground font-bold transition-all active:scale-95"
                    onClick={() => setIsShareModalOpen(true)}
                >
                    <Share2 className="mr-2 h-5 w-5" /> Share Cause
                </Button>
            </div>

            {/* Organizer Trust Module */}
            <div className={cn(
              "rounded-[24px] border p-6 flex flex-col gap-4 transition-all relative overflow-hidden",
              project.isVerifiedOrganizer 
                ? "bg-primary/[0.03] border-primary/20" 
                : "bg-card border-border/50"
            )}>
                {project.isVerifiedOrganizer && (
                    <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/5 blur-3xl rounded-full" />
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-inner",
                      project.isVerifiedOrganizer ? "bg-primary" : "bg-muted text-muted-foreground"
                    )}>
                        {project.organizerName?.[0] || 'O'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Authorized Organizer</p>
                          {project.isVerifiedOrganizer && (
                            <BadgeCheck className="h-4 w-4 text-primary fill-current/10" />
                          )}
                        </div>
                        <p className="font-extrabold text-foreground truncate text-lg leading-none">{project.organizerName}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                    {project.isVerifiedOrganizer ? (
                      <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          <p className="text-xs font-bold uppercase tracking-tight">Vetted Legal Entity</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <p className="text-xs font-bold uppercase tracking-tight">Identity Review Pending</p>
                      </div>
                    )}
                </div>
            </div>

            <div className="mt-8 p-5 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        <strong>The Givar Guarantee:</strong> All funds are secured in tranches. Disbursement only occurs upon verified milestone completion.
                    </p>
                </div>
            </div>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        projectTitle={project.title}
        projectSlug={project.slug}
      />
    </div>
  );
}