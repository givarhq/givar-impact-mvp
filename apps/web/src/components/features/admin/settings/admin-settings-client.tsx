'use client';

import React, { memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    UserCircle,
    Shield,
    Bell,
    ChevronRight,
    ChevronLeft,
    Zap,
    Landmark
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { ProfileForm } from '../../settings/profile-form';
import { PreferencesForm } from '../../settings/preferences-form';
import { AdminSecuritySection } from './admin-security-section';
import { VisibilityControlClient } from '../visibility/visibility-control-client';
import { FinancialGovernance } from './financial-governance';
import { cn } from '../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSettingsClientProps {
    user: any;
    initialConfig: any;
    initialSlots: any[];
    categories: any[];
    initialFeeRule?: any;
    initialFeeHistory?: any[];
}

const ADMIN_SETTINGS_OPTIONS = [
    {
        id: 'identity',
        label: 'Admin Identity',
        icon: UserCircle,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        description: 'Manage your personal profile & account identity.'
    },
    {
        id: 'discovery',
        label: 'Discovery Engine',
        icon: Zap,
        color: 'text-primary',
        bg: 'bg-primary/10',
        description: 'Manage recommendation weights & featured causes.'
    },
    {
        id: 'governance',
        label: 'Financial Governance',
        icon: Landmark,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        description: 'Manage platform transaction fees & tipping rules.'
    },
    {
        id: 'security',
        label: 'Access Control',
        icon: Shield,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        description: 'Secure your account with passwords & verification codes.'
    },
    {
        id: 'notifications',
        label: 'System Alerts & Preferences',
        icon: Bell,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        description: 'Configure how you receive important system updates.'
    }
];

export const AdminSettingsClient = memo(function AdminSettingsClient({
    user,
    initialConfig,
    initialSlots,
    categories,
    initialFeeRule,
    initialFeeHistory
}: AdminSettingsClientProps) {
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
            {/* Desktop Navigation View */}
            <div className="hidden md:block">
                <Tabs
                    value={effectiveTab}
                    onValueChange={handleTabChange}
                    className="w-full space-y-6"
                >
                    <div className="overflow-x-auto no-scrollbar pb-1">
                        <TabsList className="bg-muted/50 p-1 rounded-3xl h-11 w-fit border border-border/40 shadow-inner inline-flex">
                            {ADMIN_SETTINGS_OPTIONS.map((opt) => (
                                <TabsTrigger
                                    key={opt.id}
                                    value={opt.id}
                                    className="rounded-3xl px-6 gap-2.5 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm active:scale-95 whitespace-nowrap"
                                >
                                    <opt.icon className="h-3.5 w-3.5" />
                                    {opt.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={effectiveTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="relative outline-none"
                        >
                            <TabsContent value="identity" className="mt-0 outline-none">
                                <ProfileForm user={user} />
                            </TabsContent>
                            <TabsContent value="discovery" className="mt-0 outline-none">
                                <VisibilityControlClient
                                    initialConfig={initialConfig}
                                    initialSlots={initialSlots}
                                    categories={categories}
                                />
                            </TabsContent>
                            <TabsContent value="governance" className="mt-0 outline-none">
                                <FinancialGovernance
                                    initialFeeRule={initialFeeRule}
                                    initialFeeHistory={initialFeeHistory || []}
                                />
                            </TabsContent>
                            <TabsContent value="security" className="mt-0 outline-none">
                                <AdminSecuritySection user={user} />
                            </TabsContent>
                            <TabsContent value="notifications" className="mt-0 outline-none">
                                <PreferencesForm user={user} />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>

            {/* Mobile Navigation View */}
            <div className="md:hidden w-full">
                <AnimatePresence mode="wait">
                    {!activeTab ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="grid gap-2 animate-in fade-in duration-300 w-full"
                        >
                            {ADMIN_SETTINGS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleTabChange(opt.id)}
                                    className="flex items-center justify-between p-5 bg-card border border-border/40 rounded-3xl active:bg-muted transition-all group text-left shadow-sm w-full min-w-0 overflow-hidden"
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
                                            <p className="text-[11px] text-muted-foreground truncate font-medium">{opt.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:opacity-100 transition-all shrink-0 ml-2" />
                                </button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4 w-full"
                        >
                            <button
                                onClick={clearTab}
                                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-1 py-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back To Settings
                            </button>

                            <div className="pt-1 w-full">
                                {activeTab === 'identity' && <ProfileForm user={user} />}
                                {activeTab === 'discovery' && (
                                    <VisibilityControlClient
                                        initialConfig={initialConfig}
                                        initialSlots={initialSlots}
                                        categories={categories}
                                    />
                                )}
                                {activeTab === 'governance' && (
                                    <FinancialGovernance
                                        initialFeeRule={initialFeeRule}
                                        initialFeeHistory={initialFeeHistory || []}
                                    />
                                )}
                                {activeTab === 'security' && <AdminSecuritySection user={user} />}
                                {activeTab === 'notifications' && <PreferencesForm user={user} />}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});