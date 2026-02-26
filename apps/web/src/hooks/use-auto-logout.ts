'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes
const ACTIVITY_STORAGE_KEY = 'givar_last_activity';

export function useAutoLogout() {
    const router = useRouter();
    const checkInterval = useRef<NodeJS.Timeout | null>(null);

    const performLogout = useCallback(async (reason: string) => {
        try {
            // Logic: Attempt to notify backend of session termination
            await ApiService.auth.logout();
        } catch (e) {
            // Silently fail if network is down; client cleanup is priority
        }

        // Logic: Hard clear all active session keys
        deleteCookie('givar_token');
        deleteCookie('givar_user');
        deleteCookie('givar_view_mode');
        deleteCookie('givar_is_impersonating');
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);

        toast('Session expired due to inactivity', {
            icon: '🕒',
            style: { borderRadius: '24px', fontWeight: 'bold', fontSize: '12px' }
        });

        router.push(`/login?reason=${reason}`);
    }, [router]);

    const recordActivity = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());
        }
    }, []);

    useEffect(() => {
        const token = getCookie('givar_token');
        if (!token) return;

        // Logic: Deterministic Check (Mount & Tab Focus)
        // Ensures that if a user returns to a dormant tab, they are booted immediately 
        // if the threshold was crossed while the tab was backgrounded.
        const checkExpiry = () => {
            const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
            if (lastActivity) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff >= INACTIVITY_LIMIT) performLogout('inactivity');
            }
        };

        checkExpiry();
        recordActivity();

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        const handleInteraction = () => recordActivity();

        events.forEach(event => window.addEventListener(event, handleInteraction));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkExpiry();
        });

        checkInterval.current = setInterval(checkExpiry, 10000);

        return () => {
            events.forEach(event => window.removeEventListener(event, handleInteraction));
            document.removeEventListener('visibilitychange', checkExpiry);
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [performLogout, recordActivity]);
}
