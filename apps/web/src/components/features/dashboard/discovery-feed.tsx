'use client';

import React, { useState } from 'react';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from '../impact/project-card';
import { Zap, CheckCircle2 } from 'lucide-react';
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
        <div className="space-y-8 md:space-y-12">
            {/* Trending / Active Grid */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-9 w-9 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <Zap className="h-4.5 w-4.5 fill-current" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Trending Causes</h3>
                        <p className="text-xs text-muted-foreground font-medium tracking-widest">Active Communities</p>
                    </div>
                </div>
                <ProjectShowcase initialProjects={trending} categories={categories} />
            </section>

            {/* Completed / Historical Impact */}
            {completed.length > 0 && (
                <section className="space-y-4 pt-6 border-t border-border/40">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-9 w-9 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                            <CheckCircle2 className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Mission Accomplished</h3>
                            <p className="text-xs text-muted-foreground font-medium tracking-widest">Verified Success</p>
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
                </section>
            )}

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