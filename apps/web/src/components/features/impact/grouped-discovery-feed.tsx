'use client';

import React, { memo } from 'react';
import { Project } from '../../../types';
import { ProjectCard } from './project-card';
import { ShareModal } from './share-modal';
import { Button } from '../../ui/button';
import { ArrowRight, Heart, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils/cn';

interface CategoryGroup {
    category: {
        id: string;
        name: string;
        slug: string;
    };
    projects: Project[];
}

interface GroupedDiscoveryFeedProps {
    groupedData: CategoryGroup[];
    completedProjects?: Project[];
    isPublic?: boolean;
}

export const GroupedDiscoveryFeed = memo(function GroupedDiscoveryFeed({
    groupedData,
    completedProjects = [],
    isPublic = false,
}: GroupedDiscoveryFeedProps) {
    const [shareProject, setShareProject] = React.useState<Project | null>(null);
    const [isShareOpen, setIsShareOpen] = React.useState(false);

    const handleShareClick = (project: Project) => {
        setShareProject(project);
        setIsShareOpen(true);
    };

    const hasActiveGroups = groupedData && groupedData.some(g => g.projects && g.projects.length > 0);
    const isEmpty = !hasActiveGroups && completedProjects.length === 0;

    // Empty state matching Image 1
    if (isEmpty) {
        return (
            <div className="w-full rounded-[32px] border border-dashed border-border/60 bg-card/50 p-8 sm:p-14 flex flex-col items-center justify-center text-center space-y-3 min-w-0">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <Heart className="h-7 w-7 stroke-[2.2]" />
                </div>
                <div className="space-y-1 max-w-sm">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">Nothing here... for now</h3>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
                        New causes will appear here when they’re ready. Check back soon.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-12 md:space-y-16 min-w-0 pb-12">
            <AnimatePresence mode="popLayout">
                {groupedData.map((group, index) => {
                    if (!group.projects || group.projects.length === 0) return null;

                    return (
                        <motion.section
                            key={group.category.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="space-y-6 min-w-0"
                        >
                            {/* Category Header */}
                            <div className="flex items-center justify-between px-1">
                                <div className="space-y-1">
                                    <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                                        {group.category.name}
                                    </h3>
                                </div>
                                <Link
                                    href={isPublic ? `/explore?category=${group.category.slug}` : `/dashboard/impact?category=${group.category.slug}`}
                                    className="hidden sm:flex"
                                >
                                    <Button variant="ghost" className="h-9 px-4 rounded-3xl text-xs font-bold text-muted-foreground hover:text-primary transition-colors group/btn">
                                        See all
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>

                            {/* Project Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 min-w-0">
                                {group.projects.map((project, pIndex) => (
                                    <motion.div
                                        key={project.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className={cn(
                                            "min-w-0 flex-1",
                                            pIndex === 3 && "hidden xl:block"
                                        )}
                                    >
                                        <ProjectCard
                                            project={project}
                                            onDonate={() => { }}
                                            onShare={handleShareClick}
                                            isPublic={isPublic}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Mobile "See All" Button */}
                            <div className="flex sm:hidden justify-center pt-2">
                                <Link
                                    href={isPublic ? `/explore?category=${group.category.slug}` : `/dashboard/impact?category=${group.category.slug}`}
                                    className="w-full"
                                >
                                    <Button variant="outline" className="w-full h-10 rounded-3xl text-xs font-bold border-border/60 hover:bg-muted transition-all active:scale-95 group/btn">
                                        See all {group.category.name}
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.section>
                    );
                })}
            </AnimatePresence>

            {/* Dedicated "Completed Causes" Section (2 columns for horizontal cards matching Image 1) */}
            <AnimatePresence>
                {completedProjects.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={cn("space-y-6 min-w-0", hasActiveGroups && "pt-8 border-t border-border/40")}
                    >
                        {hasActiveGroups && (
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-9 w-9 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Completed Causes</h3>
                                    <p className="text-xs text-muted-foreground font-medium tracking-tight">Verified Outcomes</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
                            {completedProjects.map((project) => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    className="min-w-0 flex-1"
                                >
                                    <ProjectCard
                                        project={project}
                                        onDonate={() => { }}
                                        onShare={handleShareClick}
                                        isPublic={isPublic}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                project={shareProject}
            />
        </div>
    );
});