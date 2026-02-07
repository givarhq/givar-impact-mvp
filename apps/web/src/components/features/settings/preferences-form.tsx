'use client';

import React, { useState, useEffect } from 'react';
import {
    Bell, Mail, ShieldCheck, Heart,
    Zap, Save, Loader2, Info
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import { useRouter } from 'next/navigation';

interface ToggleProps {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    icon: React.ElementType;
}

const PreferenceToggle = ({ title, description, enabled, onToggle, icon: Icon }: ToggleProps) => (
    <div className="flex items-start justify-between gap-6 p-6 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/30 transition-all group">
        <div className="flex gap-4">
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                enabled ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground/40 border border-transparent"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md font-medium">{description}</p>
            </div>
        </div>
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                enabled ? "bg-primary" : "bg-muted-foreground/20"
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
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Default state merged with existing preferences from prop
    const [prefs, setPrefs] = useState({
        donationReceipts: true,
        milestoneUpdates: true,
        securityAlerts: true,
        marketing: false,
        ...user?.preferences
    });

    const togglePref = (key: keyof typeof prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsLoading(true);
        const toastId = toast.loading("Syncing preferences to your node...");

        try {
            await ApiService.auth.updatePreferences(prefs);
            toast.success("Notification protocols updated", { id: toastId });
            setIsDirty(false);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update preferences", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-8 md:p-10 space-y-8">
                    <div className="flex items-center gap-3 border-border/40 ">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Notification Protocols</h3>
                            <p className="text-xs text-muted-foreground font-medium">Manage how the Givar ledger communicates with your identity.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <PreferenceToggle
                            title="Instant Transaction Receipts"
                            description="Receive an immutable impact receipt via email immediately after every successful ledger transaction."
                            enabled={prefs.donationReceipts}
                            onToggle={() => togglePref('donationReceipts')}
                            icon={Mail}
                        />
                        <PreferenceToggle
                            title="Forensic Milestone Updates"
                            description="Get real-time intelligence when projects you support post verified proof of progress or complete execution phases."
                            enabled={prefs.milestoneUpdates}
                            onToggle={() => togglePref('milestoneUpdates')}
                            icon={Zap}
                        />
                        <PreferenceToggle
                            title="Security Watchtower"
                            description="Critical alerts for login events from new devices, credential modifications, or restricted administrative actions."
                            enabled={prefs.securityAlerts}
                            onToggle={() => togglePref('securityAlerts')}
                            icon={ShieldCheck}
                        />
                        <PreferenceToggle
                            title="Ecosystem Insights"
                            description="Curated summaries of high-priority causes and global impact trends within your preferred sectors."
                            enabled={prefs.marketing}
                            onToggle={() => togglePref('marketing')}
                            icon={Heart}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-4">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        These settings only control outbound communications. Ledger-level system notifications and critical billing alerts cannot be disabled to ensure account integrity.
                    </p>
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-2">
                {isDirty && (
                    <button
                        onClick={() => {
                            setPrefs({
                                donationReceipts: true,
                                milestoneUpdates: true,
                                securityAlerts: true,
                                marketing: false,
                                ...user?.preferences
                            });
                            setIsDirty(false);
                        }}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                    >
                        Reset Changes
                    </button>
                )}
                <Button
                    onClick={handleSave}
                    disabled={isLoading || !isDirty}
                    className="h-14 rounded-2xl px-10 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all gap-2"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Protocols
                </Button>
            </div>
        </div>
    );
}