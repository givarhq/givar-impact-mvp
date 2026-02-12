'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    UserCircle,
    Shield,
    Bell,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { ProfileForm } from '../../settings/profile-form';
import { PreferencesForm } from '../../settings/preferences-form';
import { AdminSecuritySection } from './admin-security-section';
import { cn } from '../../../../lib/utils/cn';

interface AdminSettingsClientProps {
    user: any;
}

const ADMIN_SETTINGS_OPTIONS = [
    {
        id: 'identity',
        label: 'Admin Identity',
        icon: UserCircle,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        description: 'Update root profile details and avatar.'
    },
    {
        id: 'security',
        label: 'Access Control',
        icon: Shield,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: 'Multi-factor authentication and password protocols.'
    },
    {
        id: 'notifications',
        label: 'System Alerts',
        icon: Bell,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        description: 'Configure security watchtower preferences.'
    }
];

export function AdminSettingsClient({ user }: AdminSettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeTab = searchParams.get('tab');
    const effectiveTab = activeTab || 'identity';

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
        <div className="w-full max-w-full overflow-hidden">
            {/* Desktop Navigation */}
            <div className="hidden md:block">
                <Tabs
                    value={effectiveTab}
                    onValueChange={handleTabChange}
                    className="w-full space-y-6"
                >
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-11 w-fit border border-border/40 shadow-inner">
                        {ADMIN_SETTINGS_OPTIONS.map((opt) => (
                            <TabsTrigger
                                key={opt.id}
                                value={opt.id}
                                className="rounded-3xl px-6 gap-2.5 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm active:scale-95"
                            >
                                <opt.icon className="h-3.5 w-3.5" />
                                {opt.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="relative">
                        <TabsContent value="identity" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ProfileForm user={user} />
                        </TabsContent>
                        <TabsContent value="security" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AdminSecuritySection user={user} />
                        </TabsContent>
                        <TabsContent value="notifications" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <PreferencesForm user={user} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden w-full">
                {!activeTab ? (
                    <div className="grid gap-2 animate-in fade-in duration-300 w-full">
                        {ADMIN_SETTINGS_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => handleTabChange(opt.id)}
                                className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-3xl active:bg-muted transition-all group text-left shadow-sm w-full min-w-0 overflow-hidden"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={cn(
                                        "h-10 w-10 rounded-2xl flex items-center justify-center border shadow-inner shrink-0",
                                        opt.bg,
                                        opt.color,
                                        "border-current/10"
                                    )}>
                                        <opt.icon className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-foreground truncate">{opt.label}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:opacity-100 transition-all shrink-0 ml-2" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 w-full">
                        <button
                            onClick={clearTab}
                            className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back to settings
                        </button>

                        <div className="pt-1 w-full">
                            {activeTab === 'identity' && <ProfileForm user={user} />}
                            {activeTab === 'security' && <AdminSecuritySection user={user} />}
                            {activeTab === 'notifications' && <PreferencesForm user={user} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}