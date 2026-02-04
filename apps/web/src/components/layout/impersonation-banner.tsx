'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { ShieldAlert, UserX, Eye, Clock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { decodeJwt } from '../../lib/utils/jwt';
import toast from 'react-hot-toast';

export function ImpersonationBanner() {
    const router = useRouter();
    const [isExiting, setIsExiting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [sessionData, setSessionData] = useState<{
        isImpersonating: boolean;
        user: any;
        expiry: number | null
    }>({ isImpersonating: false, user: null, expiry: null });

    useEffect(() => {
        setMounted(true);

        // Read forensic state from cryptographically verified token and auxiliary cookies
        const token = getCookie('givar_token') as string;
        const userJson = getCookie('givar_user') as string;
        const forceFlag = getCookie('givar_is_impersonating') === 'true';

        const decoded = decodeJwt(token);
        const user = userJson ? JSON.parse(userJson) : null;

        // Sync local state with forensic session markers
        if ((decoded?.isImpersonating || forceFlag) && user) {
            setSessionData({
                isImpersonating: true,
                user,
                expiry: decoded?.exp ? decoded.exp * 1000 : null
            });
        }
    }, []);

    // Prevent hydration mismatch on initial server render
    if (!mounted || !sessionData.isImpersonating) return null;

    const timeLeft = sessionData.expiry
        ? Math.max(0, Math.floor((sessionData.expiry - Date.now()) / 60000))
        : null;

    const handleExit = () => {
        setIsExiting(true);

        const originalToken = getCookie('givar_admin_backup_token');
        const originalUser = getCookie('givar_admin_backup_user');

        if (originalToken && originalUser) {
            // Restore original Administrative Identity
            setCookie('givar_token', originalToken, { maxAge: 604800, path: '/' });
            setCookie('givar_user', originalUser, { maxAge: 604800, path: '/' });

            // Purge support session context
            deleteCookie('givar_admin_backup_token');
            deleteCookie('givar_admin_backup_user');
            deleteCookie('givar_is_impersonating');
            deleteCookie('givar_view_mode');

            toast.success('Support session ended. Admin role restored.');

            // Hard navigation to purge internal router states and re-fetch admin permissions
            window.location.href = '/admin/users';
        } else {
            // Security Fallback: If backup is corrupt, terminate all sessions
            deleteCookie('givar_token');
            deleteCookie('givar_user');
            deleteCookie('givar_is_impersonating');
            window.location.href = '/login?reason=session_lost';
        }
    };

    return (
        <div className="sticky top-0 left-0 right-0 z-[60] bg-zinc-950 text-white px-4 py-2.5 shadow-2xl border-b border-amber-500/40 animate-in slide-in-from-top duration-500">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">

                <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 items-center justify-center ring-1 ring-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <ShieldAlert className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80 leading-none mb-1">Forensic Perspective Mode</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">
                                User: <span className="text-amber-500">{sessionData.user.firstName} {sessionData.user.lastName}</span>
                            </p>
                            <span className="hidden sm:inline text-zinc-600 font-mono text-xs">({sessionData.user.email})</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-400">
                        <Eye className="h-3 w-3" /> READ ONLY
                    </div>

                    {timeLeft !== null && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tabular-nums">
                            <Clock className="h-3 w-3" /> {timeLeft}m remaining
                        </div>
                    )}

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleExit}
                        disabled={isExiting}
                        className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest px-4 gap-2 shadow-lg shadow-destructive/20 border-0 transition-all hover:scale-105 active:scale-95"
                    >
                        {isExiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                        Stop
                    </Button>
                </div>
            </div>
        </div>
    );
}