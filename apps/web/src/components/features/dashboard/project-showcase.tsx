'use client';

import React, { useState, useEffect, useTransition, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { CategoryBrowser } from './category-browser';
import { ApiService } from '../../../services/api';
import { Loader2, Inbox } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { cn } from '../../../lib/utils/cn';

interface ProjectShowcaseProps {
    initialProjects: Project[];
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
    onShare: (project: Project) => void;
}

export const ProjectShowcase = memo(function ProjectShowcase({ initialProjects, categories, onShare }: ProjectShowcaseProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            const token = getCookie('givar_token') as string;

            if (selectedCategory === 'all') {
                setProjects(initialProjects);
                return;
            }

            ApiService.recommendations.getFeed(token, 1, 50)
                .then(response => {
                    const data = response?.data || [];
                    const filtered = data.filter((p: any) => p.categoryId === categories.find(c => c.slug === selectedCategory)?.id);
                    setProjects(filtered.slice(0, 12));
                })
                .catch(() => setProjects([]));
        });
    }, [selectedCategory, initialProjects, categories]);

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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {isPending ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {projects.map((p, pIndex) => (
                                    <div
                                        key={p.id}
                                        className={cn(pIndex === 3 && "hidden xl:block")}
                                    >
                                        <ProjectCard
                                            project={p as any}
                                            onDonate={() => { }}
                                            onShare={onShare}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-3xl border border-dashed border-border/60 bg-muted/20">
                                <div className="h-10 w-10 rounded-3xl bg-muted flex items-center justify-center mb-3">
                                    <Inbox className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm font-bold text-foreground">No Causes Found</p>
                                <p className="text-xs text-muted-foreground mt-1">Try another category or check back later.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
});