'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { CategoryBrowser } from './category-browser';
import { ApiService } from '../../../services/api';
import { Loader2, Inbox } from 'lucide-react';
import { getCookie } from 'cookies-next';

interface ProjectShowcaseProps {
    initialProjects: Project[];
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
    onDonate: (project: Project) => void;
    onShare: (project: Project) => void;
}

export function ProjectShowcase({ initialProjects, categories, onDonate, onShare }: ProjectShowcaseProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        // We use the recommendation feed even for categorized views to maintain 
        // weighted sorting (velocity/recency) and diversity logic.
        startTransition(() => {
            const token = getCookie('givar_token') as string;

            // If it's the 'all' view, we use the pre-fetched feed from the server
            if (selectedCategory === 'all') {
                setProjects(initialProjects);
                return;
            }

            // For specific categories, we fetch from recommendations to ensure 
            // the ranking engine is still the source of truth for the sort order.
            ApiService.recommendations.getFeed(token)
                .then(response => {
                    const filtered = (response || []).filter((p: any) => p.category?.slug === selectedCategory);
                    setProjects(filtered);
                })
                .catch(() => setProjects([]));
        });
    }, [selectedCategory, initialProjects]);

    return (
        <div className="space-y-4 md:space-y-6">
            <CategoryBrowser
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
            />

            <div className="relative min-h-[200px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isPending ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {projects.map(p => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p as any}
                                        onDonate={onDonate}
                                        onShare={onShare}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-3xl border border-dashed border-border/60 bg-muted/20">
                                <div className="h-10 w-10 rounded-3xl bg-muted flex items-center justify-center mb-3">
                                    <Inbox className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm font-bold text-foreground">No causes found</p>
                                <p className="text-xs text-muted-foreground mt-1">Try another category or check back later.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}