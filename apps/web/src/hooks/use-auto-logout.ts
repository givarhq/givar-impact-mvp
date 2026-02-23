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

        // Initialize activity timestamp
        recordActivity();

        // Standard interaction listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        const handleInteraction = () => {
            recordActivity();
        };

        events.forEach(event => {
            window.addEventListener(event, handleInteraction);
        });

        // Forensic Watcher: Check every 10 seconds if the threshold has been crossed
        checkInterval.current = setInterval(() => {
            const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);

            if (lastActivity) {
                const diff = Date.now() - parseInt(lastActivity, 10);
                if (diff >= INACTIVITY_LIMIT) {
                    performLogout('inactivity');
                }
            }
        }, 10000);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleInteraction);
            });
            if (checkInterval.current) clearInterval(checkInterval.current);
        };
    }, [performLogout, recordActivity]);
}