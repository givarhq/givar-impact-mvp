'use client';

import React, { memo } from 'react';
import { Project } from '../../../types';
import { Heart, Compass, ArrowRight } from 'lucide-react';
import { GroupedDiscoveryFeed } from '../impact/grouped-discovery-feed';
import Link from 'next/link';
import { Button } from '../../ui/button';

interface DiscoveryFeedProps {
    groupedTrending?: Array<{ category: any, projects: Project[] }>;
    completed?: Project[];
}

export const DiscoveryFeed = memo(function DiscoveryFeed({ groupedTrending }: DiscoveryFeedProps) {
    // Check if there are active projects in any category
    const hasActiveProjects = groupedTrending && groupedTrending.some(g => g.projects && g.projects.length > 0);

    return (
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
                        completedProjects={[]} // Never show completed causes on Home -> Discovery
                        isPublic={false}
                    />

                    <div className="flex justify-center py-6">
                        <Link
                            href="/dashboard/impact"
                            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-wide"
                        >
                            View all
                        </Link>
                    </div>
                </>
            ) : (
                /* Empty state matching Image 2 without any duplicate bottom links */
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
    );
});