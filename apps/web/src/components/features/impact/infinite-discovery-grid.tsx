'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { Project } from '../../../types';
import { ProjectCard } from './project-card';
import { ShareModal } from './share-modal';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import { motion, AnimatePresence } from 'framer-motion';

interface InfiniteDiscoveryGridProps {
    initialData: Project[];
    initialMeta: { total: number; page: number; lastPage: number };
    isSmartDiscovery: boolean;
    searchParams: string;
    isPublic?: boolean;
}

export const InfiniteDiscoveryGrid = memo(function InfiniteDiscoveryGrid({
    initialData, initialMeta, isSmartDiscovery, searchParams, isPublic = false
}: InfiniteDiscoveryGridProps) {
    const [projects, setProjects] = useState<Project[]>(initialData);
    const [meta, setMeta] = useState(initialMeta);
    const [isLoading, setIsLoading] = useState(false);
    const [shareProject, setShareProject] = useState<Project | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setProjects(initialData);
        setMeta(initialMeta);
    }, [initialData, initialMeta]);

    const loadMore = useCallback(async () => {
        if (isLoading || meta.page >= meta.lastPage) return;

        setIsLoading(true);
        const token = getCookie('givar_token') as string;
        const nextPage = meta.page + 1;

        try {
            let response;
            if (isSmartDiscovery) {
                response = await ApiService.recommendations.getFeed(token, nextPage, 24);
            } else {
                const params = new URLSearchParams(searchParams);
                params.set('page', nextPage.toString());
                params.set('limit', '24');
                response = await ApiService.projects.list(token || '', params);
            }

            if (response?.data) {
                setProjects(prev => [...prev, ...response.data]);
                setMeta(response.meta);
            }
        } catch (error) {
            console.error("[Discovery] Hydration failed", error);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, meta, isSmartDiscovery, searchParams]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMore(); },
            { threshold: 0.1, rootMargin: '600px' }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [loadMore]);

    if (projects.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold text-foreground opacity-60 ">No causes identified</p>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                    {projects.map((project, index) => (
                        <motion.div
                            key={`${project.id}-${index}`}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                contentVisibility: 'auto',
                                containIntrinsicSize: '0 400px'
                            } as React.CSSProperties}
                        >
                            <ProjectCard
                                project={project as any}
                                onDonate={() => { }}
                                onShare={(p) => { setShareProject(p); setIsShareOpen(true); }}
                                isPublic={isPublic}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div ref={observerTarget} className="w-full py-16 flex flex-col items-center justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : meta.page >= meta.lastPage && projects.length > 0 ? (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-xs font-bold text-muted-foreground">End of results</span>
                    </div>
                ) : null}
            </div>

            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} projectTitle={shareProject?.title || ''} projectSlug={shareProject?.slug || ''} />
        </div>
    );
});