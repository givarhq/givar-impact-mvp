'use client';

import React, { memo } from 'react';
import { BadgeCheck, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { VerificationReviewRow } from './verification-review-row';
import { Card } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationTabsProps {
    orgs: { data: any[]; meta: any };
}

export const VerificationTabs = memo(function VerificationTabs({ orgs }: VerificationTabsProps) {

    return (
        <div className="space-y-6">
            <Tabs defaultValue="orgs" className="w-full space-y-6">
                <TabsList className="h-12 bg-muted/50 p-1 rounded-3xl w-full md:w-[240px] border border-border/40 shadow-inner">
                    <TabsTrigger
                        value="orgs"
                        className="flex-1 h-full rounded-3xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Identity Requests
                        {orgs.meta.total > 0 && (
                            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                                {orgs.meta.total}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key="orgs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="outline-none"
                    >
                        <TabsContent value="orgs" className="mt-0 outline-none">
                            <Card className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
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