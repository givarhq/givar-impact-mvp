'use client';

import React, { useState, memo } from 'react';
import { Project } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { Zap, CheckCircle2 } from 'lucide-react';
import { ShareModal } from '../impact/share-modal';
import { GroupedDiscoveryFeed } from '../impact/grouped-discovery-feed';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoveryFeedProps {
    groupedTrending?: Array<{ category: any, projects: Project[] }>;
    completed: Project[];
    // Keeping for type compatibility if needed, though unused in grouped view
    trending?: Project[];
    categories?: any[];
}

export const DiscoveryFeed = memo(function DiscoveryFeed({ groupedTrending, completed }: DiscoveryFeedProps) {
    const [shareProject, setShareProject] = useState<Project | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const handleShare = (project: Project) => {
        setShareProject(project);
        setIsShareOpen(true);
    };

    return (
        <div className="space-y-8 md:space-y-12">
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <Zap className="h-4.5 w-4.5 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Trending Causes</h3>
                            <p className="text-xs text-muted-foreground font-medium tracking-tight">Top Performing Communities</p>
                        </div>
                    </div>
                </div>

                {groupedTrending && groupedTrending.length > 0 ? (
                    <GroupedDiscoveryFeed groupedData={groupedTrending} />
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-sm text-muted-foreground">Loading feed...</p>
                    </div>
                )}
            </section>

            <AnimatePresence>
                {completed.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 pt-8 border-t border-border/40"
                    >
                        <div className="flex items-center gap-3 px-1">
                            <div className="h-9 w-9 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Mission Accomplished</h3>
                                <p className="text-xs text-muted-foreground font-medium tracking-tight">Verified Success</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {completed.map(p => (
                                <ProjectCard
                                    key={p.id}
                                    project={p as any}
                                    onDonate={() => { }}
                                    onShare={handleShare}
                                />
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                projectTitle={shareProject?.title || ''}
                projectSlug={shareProject?.slug || ''}
            />
        </div>
    );
});