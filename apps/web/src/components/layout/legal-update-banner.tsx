'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import Link from 'next/link';
import { getCookie, setCookie } from 'cookies-next';
import { ApiService } from '../../services/api';

export function LegalUpdateBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const checkBannerVisibility = async () => {
            try {
                // 1. Performance Optimization: Check Session Storage first to avoid heavy API calls on every page load
                const cachedUpdate = sessionStorage.getItem('givar_latest_legal_update');
                let latestDocUpdate = cachedUpdate ? parseInt(cachedUpdate, 10) : 0;

                if (!latestDocUpdate) {
                    const docs = await ApiService.legalDocs.getAllPublic();
                    if (!docs || docs.length === 0) return;

                    // Determine the newest update date among all platform legal documents
                    latestDocUpdate = Math.max(...docs.map((d: any) => new Date(d.updatedAt).getTime()));

                    // Cache it for the duration of the browser tab
                    sessionStorage.setItem('givar_latest_legal_update', latestDocUpdate.toString());
                }

                // 2. Resolve User Identity
                const userCookie = getCookie('givar_user');
                let user: any = null;

                if (userCookie) {
                    try {
                        user = JSON.parse(decodeURIComponent(userCookie as string));
                        setUserData(user);
                    } catch (e) { }
                }

                // 3. Compare Timestamps
                if (user) {
                    // Logged-in user: Compare DB dismissal timestamp with the latest doc update
                    const dismissedAtStr = user.preferences?.legalBannerDismissedAt;
                    const dismissedAt = dismissedAtStr ? new Date(dismissedAtStr).getTime() : 0;

                    if (latestDocUpdate > dismissedAt) setIsVisible(true);
                } else {
                    // Guest user: Compare local storage timestamp
                    const localDismissedAtStr = localStorage.getItem('givar_legal_banner_dismissed_at');
                    const localDismissedAt = localDismissedAtStr ? new Date(localDismissedAtStr).getTime() : 0;

                    if (latestDocUpdate > localDismissedAt) setIsVisible(true);
                }
            } catch (e) {
                // Failsafe: Do not block rendering if fetch fails
            }
        };

        checkBannerVisibility();
    }, []);

    if (!isVisible) return null;

    const dismiss = async () => {
        setIsVisible(false);
        const nowIso = new Date().toISOString();

        if (userData) {
            // 1. Store the exact dismissal timestamp in the User's Database Preferences
            const updatedPreferences = {
                ...userData.preferences,
                legalBannerDismissedAt: nowIso
            };

            try {
                // Background sync to DB
                await ApiService.auth.updatePreferences(updatedPreferences);

                // Sync local user cookie instantly for fast navigations
                const updatedUser = { ...userData, preferences: updatedPreferences };
                setCookie('givar_user', JSON.stringify(updatedUser), { maxAge: 172800, path: '/' });
            } catch (e) {
                console.error("Failed to save legal banner dismissal timestamp to DB");
            }
        } else {
            // 2. Guest fallback
            localStorage.setItem('givar_legal_banner_dismissed_at', nowIso);
        }
    };

    return (
        <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3 relative z-[60] animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 text-sm text-foreground font-medium w-full">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 sm:mt-0 shadow-inner">
                        <FileText className="h-4 w-4" />
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed pr-2">
                        We have updated our <Link href="/legal/terms" className="font-bold text-primary hover:underline transition-colors" onClick={dismiss}>Terms of Service</Link> and <Link href="/legal/privacy" className="font-bold text-primary hover:underline transition-colors" onClick={dismiss}>Privacy Policy</Link>.
                    </p>
                </div>

                <div className="flex items-center shrink-0">
                    <button
                        onClick={dismiss}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground active:scale-95 bg-background/50 border border-border/40 sm:bg-transparent sm:border-transparent"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}