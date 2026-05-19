'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

// --- COMPROMISE: 4 Hour Inactivity Limit (Balance Security & Friction) ---
const INACTIVITY_LIMIT = 4 * 60 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = 'givar_last_activity';

export function useAutoLogout() {
    const checkInterval = useRef<NodeJS.Timeout | null>(null);

    const performLogout = useCallback(async (reason: string) => {
        try {
            await ApiService.auth.logout();
        } catch (e) {
            // Silently fail if network is down; server-side cookie cleanup is priority
        }

        localStorage.removeItem(ACTIVITY_STORAGE_KEY);

        toast('Session expired', {
            icon: '🕒',
            style: { borderRadius: '24px', fontWeight: 'bold', fontSize: '12px' }
        });

        // Logic: Rely on Next.js server route to securely destroy HttpOnly cookies
        window.location.href = `/api/auth/clear-session?reason=${reason}`;
    }, []);

    const recordActivity = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());
        }
    }, []);

    useEffect(() => {
        // Check for the presence of UI user cookie instead of HttpOnly token
        if (typeof window === 'undefined' || !document.cookie.includes('givar_user')) return;

        const checkExpiry = () => {
            const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
            if (lastActivity) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff >= INACTIVITY_LIMIT) {
                    performLogout('inactivity');
                    return true;
                }
            }
            return false;
        };

        if (checkExpiry()) return;

        recordActivity();

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        const handleInteraction = () => recordActivity();

        events.forEach(event => window.addEventListener(event, handleInteraction));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkExpiry();
        });

        // Check frequency maintained at 1 minute
        checkInterval.current = setInterval(checkExpiry, 60000);

        return () => {
            events.forEach(event => window.removeEventListener(event, handleInteraction));
            document.removeEventListener('visibilitychange', checkExpiry);
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [performLogout, recordActivity]);
}