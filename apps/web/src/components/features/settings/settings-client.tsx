'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User,
    Shield,
    Bell,
    Activity,
    Building2,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';
import { UserAuditView } from './user-audit-view';
import { VerificationWizard } from '../organization/verification-wizard';
import { cn } from '../../../lib/utils/cn';

interface SettingsClientProps {
    user: any;
    orgProfile: any;
}

const SETTINGS_OPTIONS = [
    {
        id: 'profile',
        label: 'Profile',
        icon: User,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        description: 'Manage your public identity and avatar.'
    },
    {
        id: 'org',
        label: 'Organization',
        icon: Building2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: 'Entity verification and trust documents.'
    },
    {
        id: 'security',
        label: 'Security',
        icon: Shield,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        description: 'Password protection and 2FA protocols.'
    },
    {
        id: 'activity',
        label: 'Activity',
        icon: Activity,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        description: 'Review your account forensic audit logs.'
    },
    {
        id: 'preferences',
        label: 'Preferences',
        icon: Bell,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        description: 'Configure your notification matrix.'
    },
];

export function SettingsClient({ user, orgProfile }: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // The 'tab' parameter determines the view state
    const activeTab = searchParams.get('tab');

    // On desktop, we always default to 'profile' if no tab is selected
    // On mobile, no tab selected means show the menu list
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
        <div className="w-full">
            {/* === DESKTOP NAVIGATION (Horizontal Tabs) === */}
            <div className="hidden md:block">
                <Tabs
                    value={effectiveTab}
                    onValueChange={handleTabChange}
                    className="w-full space-y-8"
                >
                    <TabsList className="bg-muted/50 p-1 rounded-[22px] h-14 w-fit border border-border/40">
                        {SETTINGS_OPTIONS.map((opt) => (
                            <TabsTrigger
                                key={opt.id}
                                value={opt.id}
                                className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                            >
                                <opt.icon className="h-4 w-4" />
                                {opt.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="relative">
                        <TabsContent value="profile" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <ProfileForm user={user} />
                        </TabsContent>
                        <TabsContent value="org" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <VerificationWizard initialProfile={orgProfile} />
                        </TabsContent>
                        <TabsContent value="security" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <SecurityForm user={user} />
                        </TabsContent>
                        <TabsContent value="activity" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <UserAuditView />
                        </TabsContent>
                        <TabsContent value="preferences" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500">
                            <PreferencesForm user={user} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* === MOBILE NAVIGATION (Vertical Settings List) === */}
            <div className="md:hidden space-y-3">
                {!activeTab ? (
                    /* MOBILE MENU VIEW */
                    <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {SETTINGS_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleTabChange(opt.id)}
                                className="flex items-center justify-between p-5 bg-card border border-border/50 rounded-3xl hover:bg-muted/30 transition-all active:scale-[0.98] group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm",
                                        opt.bg,
                                        opt.color,
                                        "border-current/10"
                                    )}>
                                        <opt.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h4 className="font-bold text-foreground">{opt.label}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{opt.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-all" />
                            </button>
                        ))}
                    </div>
                ) : (
                    /* MOBILE CONTENT VIEW */
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                        <button
                            onClick={clearTab}
                            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors py-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to Menu
                        </button>

                        <div className="pt-2">
                            {activeTab === 'profile' && <ProfileForm user={user} />}
                            {activeTab === 'org' && <VerificationWizard initialProfile={orgProfile} />}
                            {activeTab === 'security' && <SecurityForm user={user} />}
                            {activeTab === 'activity' && <UserAuditView />}
                            {activeTab === 'preferences' && <PreferencesForm user={user} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}