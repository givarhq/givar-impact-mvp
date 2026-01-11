'use client';

import { useState, useEffect } from 'react';
import { Share2, MapPin, Calendar, CheckCircle2, User, Flag, Clock } from 'lucide-react';
import { Project, Wallet } from '../../../types';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DonationModal } from '../donation/donation-modal';
import { apiClient } from '../../../lib/api-client';
import { formatCurrency, formatDate } from '../../../lib/utils/format';

interface ProjectDetailsClientProps {
  project: Project & { 
    category?: { name: string, icon: string };
    updates?: any[];
    donorCount?: number;
    location?: string;
    tags?: string[];
  };
}

export function ProjectDetailsClient({ project }: ProjectDetailsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    apiClient.get('/wallet').then(res => setWallet(res.data)).catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Main Content */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Header */}
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
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

        {/* Hero Image */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-muted relative">
            {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                    No Image Available
                </div>
            )}
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="story" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-card border border-border/50 rounded-xl overflow-x-auto">
                <TabsTrigger value="story" className="rounded-lg px-6 py-2.5">Story</TabsTrigger>
                <TabsTrigger value="updates" className="rounded-lg px-6 py-2.5">Updates <Badge className="ml-2 bg-primary/20 text-primary hover:bg-primary/30 h-5 px-1.5">{project.updates?.length || 0}</Badge></TabsTrigger>
                <TabsTrigger value="impact" className="rounded-lg px-6 py-2.5">Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-6 space-y-6 animate-in fade-in-50">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground text-lg">
                        {project.description}
                    </p>
                </div>
            </TabsContent>

            <TabsContent value="updates" className="mt-6 animate-in fade-in-50">
                <div className="space-y-8">
                    {/* SOTA: Vertical Timeline */}
                    {project.updates && project.updates.length > 0 ? (
                        <div className="border-l-2 border-border ml-3 space-y-8 pl-8 relative">
                            {project.updates.map((update, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[39px] top-0 h-5 w-5 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
                                    <span className="text-xs text-muted-foreground block mb-1">
                                        {formatDate(update.createdAt)}
                                    </span>
                                    <h4 className="text-lg font-semibold">{update.title}</h4>
                                    <p className="text-muted-foreground mt-2">{update.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No updates posted yet.</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT COLUMN: Sticky Sidebar Actions */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
            
            {/* Progress Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5">
                <div className="mb-6">
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-3xl font-bold text-foreground">
                            {formatCurrency(project.raisedAmount, project.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            of {formatCurrency(project.targetAmount, project.currency)}
                        </span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: `${project.percentFunded}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-3 text-sm font-medium">
                        <span className="flex items-center gap-1.5 text-foreground">
                            <User className="h-4 w-4 text-primary" /> {project.donorCount || 0} Donors
                        </span>
                        <span className="text-primary">{project.percentFunded}% Funded</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button 
                        size="lg" 
                        className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 rounded-xl"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Donate Now
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                        <Share2 className="mr-2 h-4 w-4" /> Share Cause
                    </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
                    <Flag className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong>Givar Guarantee:</strong> This project has been verified. Funds are released in tranches based on milestone completion.
                    </p>
                </div>
            </div>

            {/* Organizer Card (Placeholder) */}
            <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    O
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organizer</p>
                    <p className="font-semibold text-foreground">Verified Organization</p>
                </div>
                <div className="ml-auto">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                </div>
            </div>

        </div>
      </div>

      <DonationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        project={project} 
        wallet={wallet}
      />
    </div>
  );
}