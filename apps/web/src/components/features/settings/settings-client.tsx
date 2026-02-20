'use client';

import React, { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Shield,
    Bell,
    Activity,
    Building2,
    ChevronRight,
    ChevronLeft,
    Repeat,
    Inbox
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';
import { UserAuditView } from './user-audit-view';
import { VerificationWizard } from '../organization/verification-wizard';
import { SubscriptionCard } from '../subscriptions/subscription-card';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsClientProps {
    user: any;
    orgProfile: any;
    subscriptions: any[];
}

const SETTINGS_OPTIONS = [
    {
        id: 'profile',
        label: 'Profile',
        icon: User,
        color: 'text-primary',
        bg: 'bg-primary/10',
        description: 'Manage your public identity.'
    },
    {
        id: 'org',
        label: 'Organization',
        icon: Building2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: 'Verification & trust docs.'
    },
    {
        id: 'recurring',
        label: 'Recurring',
        icon: Repeat,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        description: 'Manage automated impact plans.'
    },
    {
        id: 'security',
        label: 'Security',
        icon: Shield,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        description: 'Password & 2FA protocols.'
    },
    {
        id: 'activity',
        label: 'Activity',
        icon: Activity,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        description: 'Account forensic audit logs.'
    },
    {
        id: 'preferences',
        label: 'Preferences',
        icon: Bell,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        description: 'Notification & theme settings.'
    },
];

export const SettingsClient = memo(function SettingsClient({ user, orgProfile, subscriptions }: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab');
    const effectiveTab = activeTab || 'profile';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const clearTab = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('tab');
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="w-full space-y-4 md:space-y-0">
            {!activeTab && (
                <div className="md:hidden">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
                </div>
            )}

            <div className="hidden md:block">
                <Tabs value={effectiveTab} onValueChange={handleTabChange} className="w-full space-y-6">
                    <div className="overflow-x-auto no-scrollbar pb-1">
                        <TabsList className="h-11 bg-muted/50 p-1 rounded-3xl w-fit border border-border/40 shadow-inner inline-flex">
                            {SETTINGS_OPTIONS.filter(o => o.id !== 'org' || user.accountType === 'ORGANIZER').map((opt) => (
                                <TabsTrigger
                                    key={opt.id}
                                    value={opt.id}
                                    className="rounded-3xl px-6 gap-2 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm whitespace-nowrap"
                                >
                                    <opt.icon className="h-3.5 w-3.5" />
                                    {opt.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <TabsContent value="profile" className="mt-0 outline-none"><ProfileForm user={user} /></TabsContent>
                        {user.accountType === 'ORGANIZER' && <TabsContent value="org" className="mt-0 outline-none"><VerificationWizard initialProfile={orgProfile} /></TabsContent>}
                        <TabsContent value="recurring" className="mt-0 outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-5xl mx-auto space-y-4"
                            >
                                {subscriptions.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                                        <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                        <p className="text-xs font-bold text-muted-foreground tracking-widest">No Recurring Plans</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        <AnimatePresence>
                                            {subscriptions.map((sub, i) => (
                                                <motion.div
                                                    key={sub.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <SubscriptionCard subscription={sub} />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="security" className="mt-0 outline-none"><SecurityForm user={user} /></TabsContent>
                        <TabsContent value="activity" className="mt-0 outline-none"><UserAuditView /></TabsContent>
                        <TabsContent value="preferences" className="mt-0 outline-none"><PreferencesForm user={user} /></TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="md:hidden">
                {!activeTab ? (
                    <div className="grid gap-2 animate-in fade-in duration-200">
                        {SETTINGS_OPTIONS.filter(o => o.id !== 'org' || user.accountType === 'ORGANIZER').map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleTabChange(opt.id)}
                                className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-3xl active:bg-muted transition-all text-left"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={cn("h-10 w-10 rounded-3xl flex items-center justify-center border border-border/10 shrink-0", opt.bg, opt.color)}>
                                        <opt.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-foreground">{opt.label}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                        <button onClick={clearTab} className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1">
                            <ChevronLeft className="h-4 w-4" /> Back To Settings
                        </button>
                        <div>
                            {activeTab === 'profile' && <ProfileForm user={user} />}
                            {activeTab === 'org' && user.accountType === 'ORGANIZER' && <VerificationWizard initialProfile={orgProfile} />}
                            {activeTab === 'recurring' && (
                                <div className="space-y-3">
                                    {subscriptions.length === 0 ? (
                                        <div className="py-12 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border/40">
                                            <p className="text-xs font-bold text-muted-foreground tracking-widest">No Plans</p>
                                        </div>
                                    ) : (
                                        subscriptions.map(sub => <SubscriptionCard key={sub.id} subscription={sub} />)
                                    )}
                                </div>
                            )}
                            {activeTab === 'security' && <SecurityForm user={user} />}
                            {activeTab === 'activity' && <UserAuditView />}
                            {activeTab === 'preferences' && <PreferencesForm user={user} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});