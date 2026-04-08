'use client';

import React, { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Shield,
    Bell,
    Activity,
    ChevronRight,
    ChevronLeft,
    ShieldCheck
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';
import { UserAuditView } from './user-audit-view';
import { VerificationWizard } from '../organization/verification-wizard';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsClientProps {
    user: any;
    orgProfile: any;
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
        id: 'verification',
        label: 'Verification',
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: 'Identity & trust documents.'
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
        description: 'Account logs.'
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

export const SettingsClient = memo(function SettingsClient({ user, orgProfile }: SettingsClientProps) {
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
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>
                </div>
            )}

            <div className="hidden md:block">
                <Tabs value={effectiveTab} onValueChange={handleTabChange} className="w-full space-y-6">
                    <div className="overflow-x-auto no-scrollbar pb-1">
                        <TabsList className="h-11 bg-muted/50 p-1 rounded-3xl w-fit border border-border/40 shadow-inner inline-flex">
                            {SETTINGS_OPTIONS.map((opt) => (
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
                        <TabsContent value="verification" className="mt-0 outline-none">
                            <VerificationWizard user={user} initialProfile={orgProfile} />
                        </TabsContent>
                        {/* --- GHOST FIX: Removed the dead TabsContent for 'recurring' --- */}
                        <TabsContent value="security" className="mt-0 outline-none"><SecurityForm user={user} /></TabsContent>
                        <TabsContent value="activity" className="mt-0 outline-none"><UserAuditView /></TabsContent>
                        <TabsContent value="preferences" className="mt-0 outline-none"><PreferencesForm user={user} /></TabsContent>
                    </div>
                </Tabs>
            </div>

            <div className="md:hidden">
                {!activeTab ? (
                    <div className="grid gap-2 animate-in fade-in duration-200">
                        {SETTINGS_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleTabChange(opt.id)}
                                className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-3xl active:bg-muted transition-all group text-left"
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
                        <button onClick={clearTab} className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-1 hover:text-primary transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back to settings
                        </button>
                        <div>
                            {activeTab === 'profile' && <ProfileForm user={user} />}
                            {activeTab === 'verification' && <VerificationWizard user={user} initialProfile={orgProfile} />}
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