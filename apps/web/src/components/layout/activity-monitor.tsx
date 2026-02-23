'use client';

import { useAutoLogout } from '../../hooks/use-auto-logout';

/**
 * Global Activity Monitor
 * Logic: Wraps the auto-logout hook in a client-side component 
 * to provide platform-wide inactivity tracking.
 */
export function ActivityMonitor() {
    useAutoLogout();
    return null;
}