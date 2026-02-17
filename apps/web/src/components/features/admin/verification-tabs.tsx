'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, FileSearch, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { EvidenceQueueTable } from './evidence-queue-table';
import { EvidenceFilters } from './evidence-filters';
import { VerificationReviewRow } from './verification-review-row';
import { Card } from '../../ui/card';

interface VerificationTabsProps {
    orgs: { data: any[]; meta: any };
    evidence: { data: any[]; meta: any };
}

export function VerificationTabs({ orgs, evidence }: VerificationTabsProps) {
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
            {/* Standardized Title/Filter Row handled via EvidenceFilters */}
            <EvidenceFilters />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="h-12 bg-muted/50 p-1 rounded-3xl w-full md:w-[400px] border border-border/40 shadow-inner">
                    <TabsTrigger
                        value="evidence"
                        className="flex-1 h-full rounded-3xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <FileSearch className="h-3.5 w-3.5" />
                        Impact evidence
                        <span className="ml-1 px-1.5 py-0.5 rounded-3xl bg-primary/10 text-primary text-[11px] font-bold">
                            {evidence.meta.total}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="orgs"
                        className="flex-1 h-full rounded-3xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        KYC requests
                        <span className="ml-1 px-1.5 py-0.5 rounded-3xl bg-primary/10 text-primary text-[11px] font-bold">
                            {orgs.meta.total}
                        </span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="evidence" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {evidence.data.length === 0 ? (
                        <Card className="border-dashed border-2 border-border/40 bg-muted/5 py-20 flex flex-col items-center justify-center text-center rounded-3xl">
                            <Inbox className="h-10 w-10 text-muted-foreground opacity-20 mb-3" />
                            <h3 className="text-sm font-bold text-foreground opacity-60 tracking-tight">No matching evidence</h3>
                            <p className="text-xs text-muted-foreground mt-1">All proof of work for this criteria has been audited.</p>
                        </Card>
                    ) : (
                        <EvidenceQueueTable proofs={evidence.data} />
                    )}
                </TabsContent>

                <TabsContent value="orgs" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-muted/40 text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-xs  tracking-wider">Organization</th>
                                        <th className="px-6 py-4 font-bold text-xs  tracking-wider">Proposer account</th>
                                        <th className="px-6 py-4 font-bold text-xs  tracking-wider">Legal docs</th>
                                        <th className="px-6 py-4 font-bold text-xs  tracking-wider text-right">Decision</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {orgs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground">
                                                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs font-medium italic">No pending KYC submissions in the queue.</p>
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
            </Tabs>
        </div>
    );
}