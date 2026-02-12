'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Loader2, Info, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import { useRouter } from 'next/navigation';

interface UserPreferences {
    donationReceipts: boolean;
    milestoneUpdates: boolean;
    securityAlerts: boolean;
    marketing: boolean;
}

interface PreferenceToggleProps {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    isUpdating?: boolean;
    icon?: React.ElementType;
}

const PreferenceToggle = ({ title, description, enabled, onToggle, isUpdating, icon: Icon }: PreferenceToggleProps) => (
    <div className={cn(
        "flex flex-col gap-2 p-4 md:p-5 rounded-3xl border transition-all duration-200",
        isUpdating ? "bg-muted/10 opacity-70 cursor-wait" : "bg-muted/20 border-border/40 hover:bg-muted/30"
    )}>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
                <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground leading-none">{title}</h4>
                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
            </div>

            <button
                type="button"
                onClick={onToggle}
                disabled={isUpdating}
                className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-3xl border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                    enabled ? "bg-primary" : "bg-muted-foreground/20",
                    isUpdating && "opacity-50 cursor-wait"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-4 w-4 transform rounded-3xl bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                        enabled ? "translate-x-4" : "translate-x-0"
                    )}
                />
            </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            {description}
        </p>
    </div>
);

export function PreferencesForm({ user }: { user: any }) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [prefs, setPrefs] = useState<UserPreferences>({
        donationReceipts: true,
        milestoneUpdates: true,
        securityAlerts: true,
        marketing: false,
        ...user?.preferences
    });

    const togglePref = async (key: keyof UserPreferences) => {
        const newValue = !prefs[key];
        const updatedPrefs = { ...prefs, [key]: newValue };

        setPrefs(updatedPrefs);
        setUpdatingKey(key);

        try {
            await ApiService.auth.updatePreferences(updatedPrefs);
            toast.success("Identity preferences updated");
            router.refresh();
        } catch (error) {
            setPrefs(prefs);
            toast.error("Sync failed");
        } finally {
            setUpdatingKey(null);
        }
    };

    if (!mounted) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Appearance Section */}
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-4 border-border/40 pb-4">
                        <div className="h-9 w-9 rounded-3xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Monitor className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-sm text-foreground">Visual Identity</h3>
                            <p className="text-xs text-muted-foreground font-medium tracking-tight">Platform interface settings</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <PreferenceToggle
                            title="Dark Mode Interface"
                            description="Toggle high-contrast dark color palette for low-light environments."
                            enabled={theme === 'dark'}
                            onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            icon={theme === 'dark' ? Moon : Sun}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Section */}
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-4 border-border/40 pb-4">
                        <div className="h-9 w-9 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-sm text-foreground">Notification Protocols</h3>
                            <p className="text-xs text-muted-foreground font-medium tracking-tight">Automated ledger alerts</p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <PreferenceToggle
                            title="Immutable Receipts"
                            description="Receive detailed transaction verification via email after every donation."
                            enabled={prefs.donationReceipts}
                            onToggle={() => togglePref('donationReceipts')}
                            isUpdating={updatingKey === 'donationReceipts'}
                        />
                        <PreferenceToggle
                            title="Impact Milestones"
                            description="Updates regarding project goals, amendments, and verified proof-of-work."
                            enabled={prefs.milestoneUpdates}
                            onToggle={() => togglePref('milestoneUpdates')}
                            isUpdating={updatingKey === 'milestoneUpdates'}
                        />
                        <PreferenceToggle
                            title="Security Watchtower"
                            description="Critical alerts for login events, credential changes, or account restrictions."
                            enabled={prefs.securityAlerts}
                            onToggle={() => togglePref('securityAlerts')}
                            isUpdating={updatingKey === 'securityAlerts'}
                        />
                        <PreferenceToggle
                            title="Ecosystem Insights"
                            description="Summaries of trending causes and high-priority sector impacts."
                            enabled={prefs.marketing}
                            onToggle={() => togglePref('marketing')}
                            isUpdating={updatingKey === 'marketing'}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="p-5 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-4">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Preference modifications are synced instantly with your node. Ledger-critical security logging remains enforced by system policy.
                </p>
            </div>
        </div>
    );
}