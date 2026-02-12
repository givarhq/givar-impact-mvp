'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, getCookie } from 'cookies-next';
import { ShieldCheck, User } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import toast from 'react-hot-toast';

interface ViewModeToggleProps {
    currentRole: string;
    variant?: 'sidebar' | 'header';
}

export function ViewModeToggle({ currentRole, variant = 'header' }: ViewModeToggleProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const viewMode = getCookie('givar_view_mode') || 'ADMIN';
    const isImpersonating = getCookie('givar_is_impersonating') === 'true';

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !['ADMIN', 'SUPERADMIN'].includes(currentRole) || isImpersonating) return null;

    const isSuperAdmin = currentRole === 'SUPERADMIN';

    const handleToggle = () => {
        const newMode = viewMode === 'ADMIN' ? 'USER' : 'ADMIN';
        setCookie('givar_view_mode', newMode, { maxAge: 604800, path: '/' });

        toast.success(newMode === 'USER' ? 'Viewing as Giver' : 'Switched to Admin console', {
            icon: newMode === 'USER' ? <User className="h-4 w-4 text-primary" /> : <ShieldCheck className="h-4 w-4 text-destructive" />,
            style: { borderRadius: '24px', fontWeight: 'bold', fontSize: '12px' }
        });

        router.push(newMode === 'USER' ? '/dashboard' : '/admin');
        router.refresh();
    };

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-3.5 rounded-3xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-3xl flex items-center justify-center border shadow-sm",
                        isSuperAdmin ? "bg-purple-50 border-purple-100 text-purple-600" : "bg-primary/5 border-primary/10 text-primary"
                    )}>
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                        <span className="text-xs font-bold text-muted-foreground leading-none mb-1">Perspective</span>
                        <span className="text-xs font-bold text-foreground truncate">
                            {viewMode === 'ADMIN' ? 'Giver mode' : isSuperAdmin ? 'Superadmin mode' : 'Admin mode'}
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "hidden lg:flex items-center text-xs font-bold px-4 py-1.5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                viewMode === 'USER'
                    ? "bg-primary/5 text-primary border-primary/20"
                    : isSuperAdmin
                        ? "bg-purple-50 text-purple-600 border-purple-100"
                        : "bg-destructive/5 text-destructive border-destructive/10"
            )}
        >
            <div className={cn(
                "h-1.5 w-1.5 rounded-full animate-pulse mr-2",
                viewMode === 'USER' ? "bg-primary" : isSuperAdmin ? "bg-purple-500" : "bg-destructive"
            )} />
            {viewMode === 'USER'
                ? (isSuperAdmin ? 'View as Superadmin' : 'View as Admin') : 'View as User'}
        </button>
    );
}