'use client';

import React, { memo } from 'react';
import { Project } from '../../../types';
import { Heart, Compass, ArrowRight } from 'lucide-react';
import { GroupedDiscoveryFeed } from '../impact/grouped-discovery-feed';
import { ProjectCard } from '../impact/project-card';
import Link from 'next/link';
import { Button } from '../../ui/button';
import { motion } from 'framer-motion';

interface DiscoveryFeedProps {
    groupedTrending?: Array<{ category: any, projects: Project[] }>;
    completed?: Project[];
}

export const DiscoveryFeed = memo(function DiscoveryFeed({ groupedTrending, completed = [] }: DiscoveryFeedProps) {
    const hasActiveProjects = groupedTrending && groupedTrending.some(g => g.projects && g.projects.length > 0);
    const displayCompleted = completed.slice(0, 4);

    return (
        <div className="space-y-12 md:space-y-16">
            {/* 1. ACTIVE CAUSES SECTION */}
            <div className="space-y-6 md:space-y-8">
                {/* Header Section */}
                <div className="flex items-center gap-3 px-1">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Compass className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-foreground">Discover Causes</h3>
                        <p className="text-xs text-muted-foreground font-medium">Support verified causes and be part of real change.</p>
                    </div>
                </div>

                {hasActiveProjects ? (
                    <>
                        <GroupedDiscoveryFeed
                            groupedData={groupedTrending || []}
                            completedProjects={[]} // Keep active section strictly active
                            isPublic={false}
                        />

                        <div className="flex justify-center py-2">
                            <Link
                                href="/dashboard/impact?status=ACTIVE"
                                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-wide"
                            >
                                View all active causes →
                            </Link>
                        </div>
                    </>
                ) : (
                    /* Empty state matching Image 2 */
                    <div className="w-full rounded-[32px] border border-dashed border-border/60 bg-card/50 p-8 sm:p-14 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            <Heart className="h-7 w-7 stroke-[2.2]" />
                        </div>
                        <div className="space-y-1 max-w-sm">
                            <h3 className="text-xl md:text-2xl font-bold text-foreground">Nothing here... for now</h3>
                            <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
                                New causes will appear here when they’re ready. Check back soon.
                            </p>
                        </div>
                        <div className="pt-2 flex flex-col items-center gap-2">
                            <Link href="/dashboard/impact?status=ACTIVE">
                                <Button className="rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-primary font-bold h-11 px-8 gap-2 border-0 shadow-none text-sm transition-all active:scale-95">
                                    View all <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <span className="text-xs text-muted-foreground font-medium">See all active causes</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. COMPLETED CAUSES SECTION (Social Proof / Verified Outcomes) */}
            {displayCompleted.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-border/40">
                    <div className="flex items-center justify-between px-1">
                        <div className="space-y-1">
                            <h3 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Completed Causes</h3>
                            <p className="text-xs text-muted-foreground font-medium">Verified outcomes and real-world impact made possible by our community.</p>
                        </div>
                        <Link
                            href="/dashboard/impact?status=COMPLETED"
                            className="hidden sm:flex"
                        >
                            <Button variant="ghost" className="h-9 px-4 rounded-3xl text-xs font-bold text-muted-foreground hover:text-primary transition-colors group/btn">
                                View all outcomes
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
                        {displayCompleted.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="min-w-0 flex-1"
                            >
                                <ProjectCard
                                    project={project}
                                    onDonate={() => { }}
                                    onShare={() => { }}
                                    isPublic={false}
                                />
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex sm:hidden justify-center pt-2">
                        <Link
                            href="/dashboard/impact?status=COMPLETED"
                            className="w-full"
                        >
                            <Button variant="outline" className="w-full h-10 rounded-3xl text-xs font-bold border-border/60 hover:bg-muted transition-all active:scale-95 group/btn">
                                View all outcomes
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
});