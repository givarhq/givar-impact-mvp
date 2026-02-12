'use client';

import { useEffect } from 'react';
import { getCookie, setCookie } from 'cookies-next';

interface IdentitySyncProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        accountType: string;
        emailVerified: boolean;
    } | null;
}

export function IdentitySync({ user }: IdentitySyncProps) {
    useEffect(() => {
        if (!user) return;

        const userCookie = getCookie('givar_user');

        if (userCookie) {
            try {
                const localUser = JSON.parse(userCookie as string);

                // Check for critical state drift (Verification or Account Type)
                const hasDrifted =
                    localUser.emailVerified !== user.emailVerified ||
                    localUser.accountType !== user.accountType ||
                    localUser.role !== user.role;

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
    }, [user]);

    return null; // This is a logic-only component
}