'use client';

import React, { useState } from 'react';
import { Bell, Loader2, Info } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
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
}

const PreferenceToggle = ({ title, description, enabled, onToggle, isUpdating }: PreferenceToggleProps) => (
    <div className={cn(
        "flex flex-col gap-2 p-5 sm:p-6 rounded-2xl border transition-all group",
        isUpdating ? "bg-muted/10 opacity-70 cursor-wait" : "bg-muted/20 border-border/40 hover:bg-muted/30"
    )}>
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground leading-none">{title}</h4>
                {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </div>

            <button
                type="button"
                onClick={onToggle}
                disabled={isUpdating}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                    enabled ? "bg-primary" : "bg-muted-foreground/20",
                    isUpdating && "opacity-50 cursor-wait"
                )}
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        enabled ? "translate-x-5" : "translate-x-0"
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
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);

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
            toast.success("Settings updated", {
                icon: '⚡',
                style: { borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }
            });
            router.refresh();
        } catch (error) {
            setPrefs(prefs);
            toast.error("Sync failed");
        } finally {
            setUpdatingKey(null);
        }
    };

    return (
        /* Changed: Removed px-4 to match SecurityForm width on mobile */
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                {/* Changed: Adjusted p-5 on mobile to provide more text room, matching SecurityForm p-8 desktop style */}
                <CardContent className="p-5 sm:p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-foreground">Notification Protocols</h3>
                            <p className="text-sm text-muted-foreground font-medium">Auto-syncing to your secure node.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <PreferenceToggle
                            title="Transaction Receipts"
                            description="Receive an immutable impact receipt via email immediately after every successful ledger transaction."
                            enabled={prefs.donationReceipts}
                            onToggle={() => togglePref('donationReceipts')}
                            isUpdating={updatingKey === 'donationReceipts'}
                        />
                        <PreferenceToggle
                            title="Milestone Updates"
                            description="Includes goal achievement alerts, financial ledger amendments, and verified proof-of-work updates for projects you support."
                            enabled={prefs.milestoneUpdates}
                            onToggle={() => togglePref('milestoneUpdates')}
                            isUpdating={updatingKey === 'milestoneUpdates'}
                        />
                        <PreferenceToggle
                            title="Security Watchtower"
                            description="Critical alerts for login events from new devices, credential modifications, or restricted administrative actions."
                            enabled={prefs.securityAlerts}
                            onToggle={() => togglePref('securityAlerts')}
                            isUpdating={updatingKey === 'securityAlerts'}
                        />
                        <PreferenceToggle
                            title="Ecosystem Insights"
                            description="Curated summaries of high-priority causes and global impact trends within your preferred sectors."
                            enabled={prefs.marketing}
                            onToggle={() => togglePref('marketing')}
                            isUpdating={updatingKey === 'marketing'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Info Box matches the card width exactly */}
            <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-4">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    Live Sync Active: Toggling these switches updates your communication matrix in real-time. System-critical security logs remain enforced.
                </p>
            </div>
        </div>
    );
}