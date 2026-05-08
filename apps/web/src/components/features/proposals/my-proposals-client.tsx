'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Rocket,
    Activity,
    Clock,
    FileEdit,
    Archive,
    Inbox
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { ProposalCard } from './proposal-card';
import { motion, AnimatePresence } from 'framer-motion';

interface MyProposalsClientProps {
    proposals: any[];
}

export function MyProposalsClient({ proposals }: MyProposalsClientProps) {
    const [activeTab, setActiveTab] = useState('live');

    // Group proposals based on their status and projectStatus
    const groupedProposals = useMemo(() => {
        const live: any[] = [];
        const inReview: any[] = [];
        const drafts: any[] = [];
        const past: any[] = [];

        proposals.forEach((p) => {
            if (p.status === 'APPROVED' && ['ACTIVE', 'FUNDED'].includes(p.projectStatus)) {
                live.push(p);
            } else if (['SUBMITTED', 'UNDER_REVIEW', 'AWAITING_VERIFICATION'].includes(p.status)) {
                inReview.push(p);
            } else if (['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(p.status)) {
                drafts.push(p);
            } else if (p.status === 'APPROVED' && ['COMPLETED', 'SUSPENDED'].includes(p.projectStatus)) {
                past.push(p);
            }
        });

        return { live, inReview, drafts, past };
    }, [proposals]);

    const EmptyState = ({
        icon: Icon,
        title,
        description,
        showAction = false
    }: {
        icon: any,
        title: string,
        description: string,
        showAction?: boolean
    }) => (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
            <div className="h-16 w-16 bg-muted/50 rounded-[24px] flex items-center justify-center mb-6 border border-border/40 shadow-inner">
                <Icon className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
                <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {description}
                </p>
            </div>
            {showAction && (
                <Link href="/dashboard/proposals/start" className="mt-8">
                    <Button variant="outline" className="rounded-3xl border-primary/30 text-primary hover:bg-primary/5 font-bold h-11 px-8 transition-all active:scale-95">
                        Launch first cause
                    </Button>
                </Link>
            )}
        </div>
    );

    const renderGrid = (items: any[], emptyState: React.ReactNode) => {
        if (items.length === 0) return emptyState;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
                <AnimatePresence mode="popLayout">
                    {items.map((p) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="min-w-0 flex-1 h-full"
                        >
                            <ProposalCard proposal={p} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 md:space-y-6 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 w-full md:w-auto border border-border/40 shadow-inner shrink-0 overflow-x-auto no-scrollbar justify-start flex">
                    <TabsTrigger value="live" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Activity className="h-3.5 w-3.5" /> Live
                        {groupedProposals.live.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black">
                                {groupedProposals.live.length}
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="inReview" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
                        <Clock className="h-3.5 w-3.5" /> In Review
                        {groupedProposals.inReview.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[9px] font-black">
                                {groupedProposals.inReview.length}
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="drafts" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">
                        <FileEdit className="h-3.5 w-3.5" /> Drafts
                        {groupedProposals.drafts.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-black">
                                {groupedProposals.drafts.length}
                            </span>
                        )}
                    </TabsTrigger>

                    <TabsTrigger value="past" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                        <Archive className="h-3.5 w-3.5" /> Past
                        {groupedProposals.past.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground text-[9px] font-black">
                                {groupedProposals.past.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
                <TabsContent value="live" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderGrid(
                        groupedProposals.live,
                        <EmptyState
                            icon={Rocket}
                            title="Your impact starts here"
                            description="Launch a cause to begin raising funds for verified community impact."
                            showAction={true}
                        />
                    )}
                </TabsContent>

                <TabsContent value="inReview" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderGrid(
                        groupedProposals.inReview,
                        <EmptyState
                            icon={Clock}
                            title="No causes in review"
                            description="Causes submitted for verification and administrative approval will appear here."
                        />
                    )}
                </TabsContent>

                <TabsContent value="drafts" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderGrid(
                        groupedProposals.drafts,
                        <EmptyState
                            icon={FileEdit}
                            title="No drafts found"
                            description="Unpublished causes or causes requiring your edits will appear here."
                        />
                    )}
                </TabsContent>

                <TabsContent value="past" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderGrid(
                        groupedProposals.past,
                        <EmptyState
                            icon={Inbox}
                            title="No past causes"
                            description="Causes that have been fully completed or suspended will be archived here."
                        />
                    )}
                </TabsContent>
            </div>
        </Tabs>
    );
}