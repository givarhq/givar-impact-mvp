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
        const userCookie = getCookie('givar_user');
        let user: any = null;

        if (userCookie) {
            try {
                user = JSON.parse(decodeURIComponent(userCookie as string));
                setUserData(user);
            } catch (e) { }
        }

        if (user) {
            // Logged-in user: Read dismissal state directly from Database Preferences
            const isDismissedInDb = user.preferences?.legalBannerDismissed === true;
            if (!isDismissedInDb) {
                setIsVisible(true);
            }
        } else {
            // Guest user: Fallback to local storage
            const isDismissedLocally = localStorage.getItem('givar_legal_banner_dismissed') === 'true';
            if (!isDismissedLocally) {
                setIsVisible(true);
            }
        }
    }, []);

    if (!isVisible) return null;

    const dismiss = async () => {
        setIsVisible(false);

        if (userData) {
            // 1. Persist to Database via User Preferences
            const updatedPreferences = {
                ...userData.preferences,
                legalBannerDismissed: true,
                legalBannerDismissedAt: new Date().toISOString()
            };

            try {
                await ApiService.auth.updatePreferences(updatedPreferences);
                // Update local cookie so client state stays synchronized
                const updatedUser = { ...userData, preferences: updatedPreferences };
                setCookie('givar_user', JSON.stringify(updatedUser), { maxAge: 172800, path: '/' });
            } catch (e) {
                console.error("Failed to persist legal banner dismissal to DB");
            }
        } else {
            // 2. Guest fallback
            localStorage.setItem('givar_legal_banner_dismissed', 'true');
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