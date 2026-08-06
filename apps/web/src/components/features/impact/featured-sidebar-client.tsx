'use client';

import React, { useState, memo } from 'react';
import { Zap } from 'lucide-react';
import { Project } from '../../../types';
import { ProjectCard } from './project-card';
import { ShareModal } from './share-modal';

interface FeaturedSidebarClientProps {
    projects: Project[];
}

export const FeaturedSidebarClient = memo(function FeaturedSidebarClient({ projects }: FeaturedSidebarClientProps) {
    const [shareProject, setShareProject] = useState<Project | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);

    if (!projects || projects.length === 0) return null;

    const handleShareClick = (project: Project) => {
        setShareProject(project);
        setIsShareOpen(true);
    };

    return (
        <div className="sticky top-28 space-y-5 w-full">
            <div className="flex items-center gap-3 px-1">
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner shrink-0">
                    <Zap className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-bold text-sm text-foreground tracking-tight">Featured Causes</h3>
            </div>

            <div className="grid gap-5">
                {projects.map(p => (
                    <ProjectCard
                        key={p.id}
                        project={p as any}
                        onDonate={() => { }}
                        onShare={handleShareClick}
                        isPublic={true}
                    />
                ))}
            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                projectTitle={shareProject?.title || ''}
                projectSlug={shareProject?.slug || ''}
            />
        </div>
    );
});