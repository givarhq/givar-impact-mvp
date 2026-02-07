'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Shield, Bell, Activity, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';
import { UserAuditView } from './user-audit-view';
import { VerificationWizard } from '../organization/verification-wizard';

interface SettingsClientProps {
    user: any;
    orgProfile: any;
}

export function SettingsClient({ user, orgProfile }: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeTab = searchParams.get('tab') || 'profile';

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    return (
        <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full space-y-8"
        >
            <div className="overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="bg-muted/50 p-1 rounded-[22px] h-14 w-full md:w-fit border border-border/40 min-w-max">
                    <TabsTrigger
                        value="profile"
                        className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>

                    <TabsTrigger
                        value="org"
                        className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Building2 className="h-4 w-4" />
                        Organization
                    </TabsTrigger>

                    <TabsTrigger
                        value="security"
                        className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>

                    <TabsTrigger
                        value="activity"
                        className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Activity className="h-4 w-4" />
                        Activity
                    </TabsTrigger>

                    <TabsTrigger
                        value="preferences"
                        className="rounded-xl px-8 gap-2.5 h-11 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Bell className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="relative">
                <TabsContent
                    value="profile"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <ProfileForm user={user} />
                </TabsContent>

                <TabsContent
                    value="org"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <VerificationWizard initialProfile={orgProfile} />
                </TabsContent>

                <TabsContent
                    value="security"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <SecurityForm user={user} />
                </TabsContent>

                <TabsContent
                    value="activity"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <UserAuditView />
                </TabsContent>

                <TabsContent
                    value="preferences"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <PreferencesForm user={user} />
                </TabsContent>
            </div>
        </Tabs>
    );
}