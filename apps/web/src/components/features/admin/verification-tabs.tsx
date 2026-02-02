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
        params.set('page', '1'); // Reset pagination context on switch
        router.replace(`?${params.toString()}`);
    };

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
            <TabsList className="h-14 bg-muted/50 p-1.5 rounded-[22px] w-full max-w-md border border-border/30">
                <TabsTrigger
                    value="evidence"
                    className="flex-1 h-full rounded-xl gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
                >
                    <FileSearch className="h-4 w-4" />
                    Impact Evidence
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[9px]">
                        {evidence.meta.total}
                    </span>
                </TabsTrigger>
                <TabsTrigger
                    value="orgs"
                    className="flex-1 h-full rounded-xl gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-blue-500 data-[state=active]:shadow-lg"
                >
                    <BadgeCheck className="h-4 w-4" />
                    KYC Requests
                    <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md text-[9px]">
                        {orgs.meta.total}
                    </span>
                </TabsTrigger>
            </TabsList>

            {/* --- EVIDENCE AUDIT TAB --- */}
            <TabsContent value="evidence" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
                <EvidenceFilters />

                {evidence.data.length === 0 ? (
                    <Card className="border-dashed border-2 border-border/60 bg-muted/5 py-24 flex flex-col items-center justify-center text-center rounded-[32px]">
                        <Inbox className="h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                        <h3 className="text-lg font-bold text-foreground opacity-60 uppercase tracking-widest">No matching evidence</h3>
                        <p className="text-xs text-muted-foreground mt-1">All submitted proof of work has been audited.</p>
                    </Card>
                ) : (
                    <EvidenceQueueTable proofs={evidence.data} />
                )}
            </TabsContent>

            {/* --- ORGANIZATION KYC TAB --- */}
            <TabsContent value="orgs" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="rounded-[28px] border border-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Organization</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Proposer Account</th>
                                    <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Legal Docs</th>
                                    <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Audit Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {orgs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-24 text-center text-muted-foreground">
                                            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p className="font-medium">No pending KYC submissions in the queue.</p>
                                        </td>
                                    </tr>
                                ) : orgs.data.map((profile: any) => (
                                    <VerificationReviewRow key={profile.id} profile={profile} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}