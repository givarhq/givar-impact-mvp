'use client';

import { useState } from 'react';
import { Share2, MapPin, Calendar, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link'; 
import { Project } from '../../../types';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { formatDate } from '../../../lib/utils/format';
import { TransparencyCard } from './transparency-card';
import { ShareModal } from './share-modal';

interface ProjectDetailsClientProps {
  project: Project & { 
    category?: { name: string, icon: string };
    updates?: any[];
    donorCount?: number;
    location?: string;
    tags?: string[];
  };
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
        <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="rounded-lg">
                    {project.category?.name || 'General'}
                </Badge>
                {project.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-lg bg-background">
                        {tag}
                    </Badge>
                ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                {project.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {project.location && (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {project.location}
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Created {formatDate(project.createdAt as unknown as string).split(',')[0]}
                </div>
            </div>
        </div>

        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-muted relative shadow-sm">
            {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                    No Image Available
                </div>
            )}
        </div>

        <Tabs defaultValue="story" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border/50 rounded-xl overflow-x-auto">
                <TabsTrigger value="story" className="rounded-lg px-6 py-2.5">Story</TabsTrigger>
                <TabsTrigger value="updates" className="rounded-lg px-6 py-2.5">Updates <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30 h-5 px-1.5">{project.updates?.length || 0}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-6 space-y-6 animate-in fade-in-50">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground text-md">
                        {project.description}
                    </p>
                </div>
            </TabsContent>

            <TabsContent value="updates" className="mt-6 animate-in fade-in-50">
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No updates posted yet.</p>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT COLUMN: Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            
            <TransparencyCard project={project} />

            <div className="space-y-3">
                <Link href={donateLink} className="block w-full">
                  <Button 
                      size="lg" 
                      className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 rounded-xl bg-primary hover:bg-primary/90"
                  >
                      Donate Now
                  </Button>
                </Link>
                
                <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 active:scale-95 transition-all"
                    onClick={() => setIsShareModalOpen(true)}
                >
                    <Share2 className="mr-2 h-4 w-4" /> Share Cause
                </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-start gap-3 opacity-80">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Givar Guarantee:</strong> Funds are released in tranches. We audit every milestone before releasing the next batch of funds.
                </p>
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