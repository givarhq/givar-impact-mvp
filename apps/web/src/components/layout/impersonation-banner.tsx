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

        const token = getCookie('givar_token') as string;
        const userJson = getCookie('givar_user') as string;
        const forceFlag = getCookie('givar_is_impersonating') === 'true';

        const decoded = decodeJwt(token);
        const user = userJson ? JSON.parse(userJson) : null;

        if ((decoded?.isImpersonating || forceFlag) && user) {
            setSessionData({
                isImpersonating: true,
                user,
                expiry: decoded?.exp ? decoded.exp * 1000 : null
            });
        }
    }, []);

    if (!mounted || !sessionData.isImpersonating) return null;

    const timeLeft = sessionData.expiry
        ? Math.max(0, Math.floor((sessionData.expiry - Date.now()) / 60000))
        : null;

    const handleExit = () => {
        setIsExiting(true);

        const originalToken = getCookie('givar_admin_backup_token');
        const originalUser = getCookie('givar_admin_backup_user');

        if (originalToken && originalUser) {
            setCookie('givar_token', originalToken, { maxAge: 604800, path: '/' });
            setCookie('givar_user', originalUser, { maxAge: 604800, path: '/' });

            deleteCookie('givar_admin_backup_token');
            deleteCookie('givar_admin_backup_user');
            deleteCookie('givar_is_impersonating');
            deleteCookie('givar_view_mode');

            toast.success('Support session ended. Admin role restored.');
            window.location.href = '/admin/users';
        } else {
            deleteCookie('givar_token');
            deleteCookie('givar_user');
            deleteCookie('givar_is_impersonating');
            window.location.href = '/login?reason=session_lost';
        }
    };

    return (
        <div className="sticky top-0 left-0 right-0 z-[60] bg-zinc-950 text-white px-4 py-2 shadow-xl border-b border-amber-500/20 animate-in slide-in-from-top duration-300">
            <div className="max-w-6xl mx-auto flex items-center justify-between">

                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 rounded-3xl bg-amber-500/10 text-amber-500 items-center justify-center border border-amber-500/20 shadow-sm">
                        <ShieldAlert className="h-4 w-4 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-xs font-bold text-amber-500/90 leading-tight">Forensic perspective mode</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">
                                User: <span className="text-amber-500 font-bold">{sessionData.user.firstName} {sessionData.user.lastName}</span>
                            </p>
                            <span className="hidden sm:inline text-zinc-500 font-mono text-[11px]">({sessionData.user.email})</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-3xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-400">
                        <Eye className="h-3 w-3" /> Read only
                    </div>

                    {timeLeft !== null && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-zinc-500 tabular-nums">
                            <Clock className="h-3 w-3" /> {timeLeft}m left
                        </div>
                    )}

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleExit}
                        disabled={isExiting}
                        className="h-8 rounded-3xl font-bold text-xs px-4 gap-2 border-0 transition-all active:scale-95 shadow-sm"
                    >
                        {isExiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
                        Stop
                    </Button>
                </div>
            </div>
        </div>
    );
}