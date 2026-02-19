'use client';

import React, { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, FileSearch, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { EvidenceQueueTable } from './evidence-queue-table';
import { EvidenceFilters } from './evidence-filters';
import { VerificationReviewRow } from './verification-review-row';
import { Card } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationTabsProps {
    orgs: { data: any[]; meta: any };
    evidence: { data: any[]; meta: any };
}

export const VerificationTabs = memo(function VerificationTabs({ orgs, evidence }: VerificationTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'evidence';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        params.set('page', '1');
        router.replace(`?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <EvidenceFilters />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="h-12 bg-muted/50 p-1 rounded-3xl w-full md:w-[420px] border border-border/40 shadow-inner">
                    <TabsTrigger
                        value="evidence"
                        className="flex-1 h-full rounded-3xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <FileSearch className="h-3.5 w-3.5" />
                        Impact Evidence
                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                            {evidence.meta.total}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="orgs"
                        className="flex-1 h-full rounded-3xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Identity Requests
                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                            {orgs.meta.total}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="outline-none"
                    >
                        <TabsContent value="evidence" className="mt-0 outline-none">
                            {evidence.data.length === 0 ? (
                                <EmptyPlaceholder
                                    title="No Matching Evidence"
                                    subtitle="All recent proof of work has been reviewed by the team."
                                />
                            ) : (
                                <EvidenceQueueTable proofs={evidence.data} />
                            )}
                        </TabsContent>

                        <TabsContent value="orgs" className="mt-0 outline-none">
                            <Card className="rounded-[32px] border border-border/40 bg-card shadow-sm overflow-hidden">
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-[10px] tracking-widest ">Organization</th>
                                                <th className="px-6 py-4 font-bold text-[10px] tracking-widest ">Account Profile</th>
                                                <th className="px-6 py-4 font-bold text-[10px] tracking-widest ">Legal Assets</th>
                                                <th className="px-6 py-4 font-bold text-[10px] tracking-widest text-right ">Review Decision</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {orgs.data.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground">
                                                        <Inbox className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                                        <p className="text-xs font-medium italic">The identity verification queue is currently empty.</p>
                                                    </td>
                                                </tr>
                                            ) : orgs.data.map((profile: any) => (
                                                <VerificationReviewRow key={profile.id} profile={profile} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
});

function EmptyPlaceholder({ title, subtitle }: { title: string, subtitle: string }) {
    return (
        <Card className="border-dashed border-2 border-border/40 bg-muted/5 py-24 flex flex-col items-center justify-center text-center rounded-[40px]">
            <Inbox className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-sm font-bold text-foreground opacity-60 tracking-tight ">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium max-w-[280px]">{subtitle}</p>
        </Card>
    );
}