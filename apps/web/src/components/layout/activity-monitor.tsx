'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAutoLogout } from '../../hooks/use-auto-logout';

/**
 * Global Activity Monitor
 * Logic: Wraps the auto-logout hook and actively tracks the user's last 
 * non-legal route to provide smart "Back" button routing.
 */
export function ActivityMonitor() {
    useAutoLogout();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Track the URL constantly, UNLESS the user is inside the legal docs or API routes
        if (pathname && !pathname.startsWith('/legal') && !pathname.startsWith('/api')) {
            const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
            sessionStorage.setItem('givar_last_non_legal_route', url);
        }
    }, [pathname, searchParams]);

    return null;
}