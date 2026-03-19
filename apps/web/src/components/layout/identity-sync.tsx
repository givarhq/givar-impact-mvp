'use client';

import { useEffect } from 'react';
import { getCookie, setCookie } from 'cookies-next';
import { usePathname } from 'next/navigation';

interface IdentitySyncProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        accountType: string;
        emailVerified: boolean;
        organization?: {
            status: string;
            legalName: string;
        } | null;
    } | null;
}

export function IdentitySync({ user }: IdentitySyncProps) {
    const pathname = usePathname();

    useEffect(() => {
        if (!user) return;

        if (pathname === '/login' || pathname === '/signup') return;

        const userCookie = getCookie('givar_user');

        if (userCookie) {
            try {
                const localUser = JSON.parse(userCookie as string);

                // Check for critical state drift, including KYC Verification status
                const hasDrifted =
                    localUser.emailVerified !== user.emailVerified ||
                    localUser.accountType !== user.accountType ||
                    localUser.role !== user.role ||
                    localUser.organization?.status !== user.organization?.status;

                if (hasDrifted) {
                    // Force synchronization of the local cookie with server truth
                    setCookie('givar_user', JSON.stringify(user), { maxAge: 604800, path: '/' });

                    // Trigger a silent refresh of the current page to update all 
                    // dependent UI overlays immediately.
                    window.location.reload();
                }
            } catch (e) {
                // If cookie is malformed, re-sync it
                setCookie('givar_user', JSON.stringify(user), { maxAge: 604800, path: '/' });
            }
        }
    }, [user, pathname]);

    return null; // This is a logic-only component
}