'use client';

import React, { useState } from 'react';
import { User, Shield, Bell, CreditCard, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { ProfileForm } from './profile-form';
import { cn } from '../../../lib/utils/cn';

interface SettingsClientProps {
    user: any;
}

export function SettingsClient({ user }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <div className="overflow-x-auto pb-2 no-scrollbar">
                <TabsList className="bg-muted/50 p-1 rounded-[22px] h-14 w-full md:w-fit border border-border/40 min-w-max">
                    <TabsTrigger
                        value="profile"
                        className="rounded-xl px-6 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
                    >
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="rounded-xl px-6 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
                    >
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger
                        value="preferences"
                        className="rounded-xl px-6 gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
                    >
                        <Bell className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="profile" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="security" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-card border border-border/50 rounded-[32px] p-8 md:p-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="font-bold text-foreground">Security Module</h3>
                    <p className="text-sm text-muted-foreground mt-1">Establishing secure connection... (Next Phase)</p>
                </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-0 outline-none animate-in slide-in-from-bottom-2 duration-500">
                <div className="bg-card border border-border/50 rounded-[32px] p-8 md:p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="font-bold text-foreground">Preferences Module</h3>
                    <p className="text-sm text-muted-foreground mt-1">Configuring notification nodes... (Next Phase)</p>
                </div>
            </TabsContent>
        </Tabs>
    );
}