'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Shield, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';

interface SettingsClientProps {
    user: any;
}

export function SettingsClient({ user }: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Sync State with URL parameter
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
            {/* --- TAB NAVIGATION HUB --- */}
            <div className="overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="bg-muted/50 p-1 rounded-[22px] h-14 w-full md:w-fit border border-border/40 min-w-max">
                    <TabsTrigger
                        value="profile"
                        className="rounded-xl px-8 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>

                    <TabsTrigger
                        value="security"
                        className="rounded-xl px-8 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>

                    <TabsTrigger
                        value="preferences"
                        className="rounded-xl px-8 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg active:scale-95"
                    >
                        <Bell className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* --- TAB CONTENT SECTIONS --- */}
            <div className="relative">
                {/* 1. Identity Management */}
                <TabsContent
                    value="profile"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <ProfileForm user={user} />
                </TabsContent>

                {/* 2. Security Protocols */}
                <TabsContent
                    value="security"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <SecurityForm />
                </TabsContent>

                {/* 3. Platform Preferences */}
                <TabsContent
                    value="preferences"
                    className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-3 duration-500"
                >
                    <PreferencesForm />
                </TabsContent>
            </div>

            {/* --- FORENSIC STATUS FOOTER --- */}
            <div className="pt-10 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                    Ledger Connection: Secure
                </div>
                <div className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                    Last Session Sync: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </Tabs>
    );
}