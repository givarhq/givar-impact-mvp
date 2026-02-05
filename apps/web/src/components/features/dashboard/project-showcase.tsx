'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { CategoryBrowser } from './category-browser';
import { ApiService } from '../../../services/api';
import { Loader2, Inbox } from 'lucide-react';

interface ProjectShowcaseProps {
    initialProjects: Project[];
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
}

export function ProjectShowcase({ initialProjects, categories }: ProjectShowcaseProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(() => {
            const params = new URLSearchParams({ limit: '6', status: 'ACTIVE' });
            if (selectedCategory !== 'all') {
                params.set('category', selectedCategory);
            }

            ApiService.projects.list('', params)
                .then(response => setProjects(response?.data || []))
                .catch(() => setProjects([]));
        });
    }, [selectedCategory]);

    const handleDonate = () => { };
    const handleShare = () => { };

    return (
        <div className="space-y-6">
            <CategoryBrowser
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
            />

            <div className="relative min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isPending ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map(p => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p as any}
                                        onDonate={handleDonate}
                                        onShare={handleShare}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-muted/20">
                                <Inbox className="h-10 w-10 opacity-20 mb-3" />
                                <p className="font-semibold">No active causes in this category</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}