'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

const ACTIVITY_STORAGE_KEY = 'givar_last_activity';

// Dynamic resolver for inactivity limits based on client requirements
const getInactivityLimit = (): number => {
    if (typeof document === 'undefined') return 24 * 60 * 60 * 1000; // SSR fallback

    const userCookie = document.cookie.split('; ').find(row => row.startsWith('givar_user='));
    if (userCookie) {
        try {
            const user = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
            if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
                return 12 * 60 * 60 * 1000; // 12 Hours for Admins
            }
        } catch (e) {
            console.error("Error parsing user cookie");
        }
    }
    return 24 * 60 * 60 * 1000; // 24 Hours for Normal Users
};

export function useAutoLogout() {
    const checkInterval = useRef<NodeJS.Timeout | null>(null);

    const performLogout = useCallback(async (reason: string) => {
        try {
            await ApiService.auth.logout();
        } catch (e) {
            // Silently fail if network is down; server-side cookie cleanup is priority
        }

        localStorage.removeItem(ACTIVITY_STORAGE_KEY);

        toast('Session expired due to inactivity', {
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
            const inactivityLimit = getInactivityLimit();

            if (lastActivity) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff >= inactivityLimit) {
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