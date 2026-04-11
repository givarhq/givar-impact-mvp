'use client';

import React, { memo } from 'react';
import { Project } from '../../../types';
import { Zap } from 'lucide-react';
import { GroupedDiscoveryFeed } from '../impact/grouped-discovery-feed';

interface DiscoveryFeedProps {
    groupedTrending?: Array<{ category: any, projects: Project[] }>;
    completed: Project[];
}

export const DiscoveryFeed = memo(function DiscoveryFeed({ groupedTrending, completed }: DiscoveryFeedProps) {
    return (
        <div className="space-y-8 md:space-y-12">
            <section className="space-y-6">
                {groupedTrending && groupedTrending.length > 0 && (
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
                )}

                <GroupedDiscoveryFeed
                    groupedData={groupedTrending || []}
                    completedProjects={completed}
                    isPublic={false}
                />
            </section>
        </div>
    );
});