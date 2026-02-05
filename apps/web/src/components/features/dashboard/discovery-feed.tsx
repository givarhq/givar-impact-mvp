'use client';

import React, { useState } from 'react';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { ShareModal } from '../impact/share-modal';
import { Modal } from '../../ui/modal';
import { DonationForm } from '../../../app/(dashboard)/dashboard/impact/[slug]/donate/donation-form';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import { ProjectShowcase } from './project-showcase';

interface DiscoveryFeedProps {
    trending: Project[];
    completed: Project[];
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
}

export function DiscoveryFeed({ trending, completed, categories }: DiscoveryFeedProps) {
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
        <div className="space-y-12">

            {/* 1. Trending / Active Grid with Category Browser */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-foreground">Trending Causes</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Discover your next impact</p>
                        </div>
                    </div>
                </div>
                <ProjectShowcase initialProjects={trending} categories={categories} />
            </section>

            {/* 2. Completed / Historical Impact */}
            {completed.length > 0 && (
                <section className="space-y-6 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg md:text-xl font-bold text-foreground">Mission Accomplished</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recently funded and executed projects</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {completed.map(p => (
                            <ProjectCard
                                key={p.id}
                                project={p as any}
                                onDonate={handleDonate}
                                onShare={handleShare}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* MODALS */}
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                projectTitle={shareProject?.title || ''}
                projectSlug={shareProject?.slug || ''}
            />

            <Modal
                isOpen={isDonateOpen}
                onClose={() => setIsDonateOpen(false)}
                title={`Donate to ${selectedProject?.title}`}
            >
                <DonationForm
                    project={selectedProject}
                    wallet={wallet}
                    isAuthenticated={true}
                />
            </Modal>
        </div>
    );
}