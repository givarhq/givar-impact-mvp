'use client';

import React, { useState } from 'react';
import {
    Bell, Mail, ShieldCheck, Heart,
    Zap, Loader2, Info
} from 'lucide-react';
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
    icon: React.ElementType;
    isUpdating?: boolean;
}

const PreferenceToggle = ({ title, description, enabled, onToggle, icon: Icon, isUpdating }: PreferenceToggleProps) => (
    <div className={cn(
        "flex items-start justify-between gap-6 p-6 rounded-2xl border transition-all group",
        isUpdating ? "bg-muted/10 opacity-70 cursor-wait" : "bg-muted/20 border-border/40 hover:bg-muted/30"
    )}>
        <div className="flex gap-4">
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                enabled ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground/40 border border-transparent"
            )}>
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md font-medium">{description}</p>
            </div>
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

        // 1. Optimistic UI Update
        setPrefs(updatedPrefs);
        setUpdatingKey(key);

        try {
            // 2. Immediate Remote Sync
            await ApiService.auth.updatePreferences(updatedPrefs);
            toast.success("Protocol updated", {
                icon: '⚡',
                style: { borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }
            });
            router.refresh();
        } catch (error) {
            // 3. Revert on failure
            setPrefs(prefs);
            toast.error("Cloud sync failed");
        } finally {
            setUpdatingKey(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Notification Protocols</h3>
                            <p className="text-xs text-muted-foreground font-medium">Changes are saved automatically to your identity node.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <PreferenceToggle
                            title="Instant Transaction Receipts"
                            description="Receive an immutable impact receipt via email immediately after every successful ledger transaction."
                            enabled={prefs.donationReceipts}
                            onToggle={() => togglePref('donationReceipts')}
                            isUpdating={updatingKey === 'donationReceipts'}
                            icon={Mail}
                        />
                        <PreferenceToggle
                            title="Forensic Milestone Updates"
                            description="Includes goal achievement alerts, financial ledger amendments, and verified proof-of-work updates for projects you support."
                            enabled={prefs.milestoneUpdates}
                            onToggle={() => togglePref('milestoneUpdates')}
                            isUpdating={updatingKey === 'milestoneUpdates'}
                            icon={Zap}
                        />
                        <PreferenceToggle
                            title="Security Watchtower"
                            description="Critical alerts for login events from new devices, credential modifications, or restricted administrative actions."
                            enabled={prefs.securityAlerts}
                            onToggle={() => togglePref('securityAlerts')}
                            isUpdating={updatingKey === 'securityAlerts'}
                            icon={ShieldCheck}
                        />
                        <PreferenceToggle
                            title="Ecosystem Insights"
                            description="Curated summaries of high-priority causes and global impact trends within your preferred sectors."
                            enabled={prefs.marketing}
                            onToggle={() => togglePref('marketing')}
                            isUpdating={updatingKey === 'marketing'}
                            icon={Heart}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-4">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        Live Sync Active: Toggling these switches updates your communication matrix in real-time. System-critical security logs and tranches remain enforced.
                    </p>
                </div>
            </div>
        </div>
    );
}