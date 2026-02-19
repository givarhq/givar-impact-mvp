'use client';

import React, { useState, memo } from 'react';
import Link from 'next/link';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { ShareModal } from '../impact/share-modal';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { DonationForm } from '../../../app/(dashboard)/dashboard/impact/[slug]/donate/donation-form';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import { ProjectShowcase } from './project-showcase';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoveryFeedProps {
    trending: Project[];
    completed: Project[];
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
}

export const DiscoveryFeed = memo(function DiscoveryFeed({ trending, completed, categories }: DiscoveryFeedProps) {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [shareProject, setShareProject] = useState<Project | null>(null);
    const [isDonateOpen, setIsDonateOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [wallet, setWallet] = useState<Wallet | null>(null);

    const handleDonate = (project: Project) => {
        const token = getCookie('givar_token');
        if (token && !wallet) {
            ApiService.wallet.get()
                .then(setWallet)
                .catch(console.error);
        }
        setSelectedProject(project);
        setIsDonateOpen(true);
    };

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

                <div className="space-y-8">
                    <ProjectShowcase
                        initialProjects={trending}
                        categories={categories}
                        onDonate={handleDonate}
                        onShare={handleShare}
                    />

                    {trending.length > 0 && (
                        <div className="flex justify-center pt-2">
                            <Link href="/dashboard/impact">
                                <Button
                                    variant="outline"
                                    className="rounded-3xl h-11 px-8 font-bold text-xs gap-2 border-border/60 hover:border-primary/30 hover:text-primary transition-all group active:scale-95"
                                >
                                    View All
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {completed.map(p => (
                                <ProjectCard
                                    key={p.id}
                                    project={p as any}
                                    onDonate={handleDonate}
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

            <Modal
                isOpen={isDonateOpen}
                onClose={() => setIsDonateOpen(false)}
                title={`Donate To ${selectedProject?.title}`}
            >
                <DonationForm
                    project={selectedProject}
                    wallet={wallet}
                    isAuthenticated={true}
                />
            </Modal>
        </div>
    );
});