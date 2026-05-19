'use client';

import React, { useState, useEffect } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { ShieldAlert, UserX, Eye, Clock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

export function ImpersonationBanner() {
    const [isExiting, setIsExiting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [sessionData, setSessionData] = useState<{
        isImpersonating: boolean;
        user: any;
        expiry: number | null
    }>({ isImpersonating: false, user: null, expiry: null });

    useEffect(() => {
        setMounted(true);

        const userJson = getCookie('givar_user') as string;
        const forceFlag = getCookie('givar_is_impersonating') === 'true';
        const expiryCookie = getCookie('givar_impersonation_expiry') as string;

        const user = userJson ? JSON.parse(userJson) : null;

        if (forceFlag && user) {
            setSessionData({
                isImpersonating: true,
                user,
                // Logic: Rely entirely on UI cookie instead of attempting to decode HttpOnly JWT
                expiry: expiryCookie ? parseInt(expiryCookie, 10) : null
            });
        }
    }, []);

    if (!mounted || !sessionData.isImpersonating) return null;

    const timeLeft = sessionData.expiry
        ? Math.max(0, Math.floor((sessionData.expiry - Date.now()) / 60000))
        : null;

    const handleExit = async () => {
        setIsExiting(true);

        try {
            // Trigger Next.js API route to securely swap back the HttpOnly admin token
            await fetch('/api/auth/clear-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop_impersonation' })
            });

            toast.success('Support session ended. Admin access restored.', { duration: 4000 });
            window.location.href = '/admin';
        } catch (error) {
            // Failsafe: Hard clear if swap fails
            window.location.href = '/api/auth/clear-session?reason=impersonation_ended';
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
                        <p className="text-xs font-bold text-amber-500/90 leading-tight">Perspective mode</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">
                                User: <span className="text-amber-500 font-bold">{sessionData.user.firstName} {sessionData.user.lastName}</span>
                            </p>
                            <span className="hidden sm:inline text-zinc-500 font-mono text-xs">({sessionData.user.email})</span>
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